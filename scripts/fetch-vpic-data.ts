
import fs from 'fs';
import path from 'path';

// NHTSA VPIC API Base URL
const BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Vehicle types to fetch
const VEHICLE_TYPES = ['passenger car', 'truck', 'mpv', 'bus', 'motorcycle'];

interface Make {
    Make_ID: number;
    Make_Name: string;
}

interface Model {
    Make_ID: number;
    Make_Name: string;
    Model_ID: number;
    Model_Name: string;
}

async function fetchJson(url: string) {
    // console.log(`Fetching: ${url}`);
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    return res.json();
}

async function main() {
    console.log('Starting VPIC data fetch...');

    // 1. Get Makes for specific vehicle types to filter out irrelevant ones
    const makeIds = new Set<number>();
    const makesMap = new Map<number, string>();

    for (const type of VEHICLE_TYPES) {
        try {
            console.log(`Fetching makes for type: ${type}`);
            const data = await fetchJson(`${BASE_URL}/GetMakesForVehicleType/${type}?format=json`);
            for (const item of data.Results) {
                // API usually returns MakeId and MakeName
                const id = item.MakeId || item.MakeID;
                const name = item.MakeName || item.Make_Name;
                if (id && name) {
                    makeIds.add(id);
                    makesMap.set(id, name.trim());
                }
            }
        } catch (err) {
            console.error(`Error fetching makes for type ${type}:`, err);
        }
    }

    console.log(`Found ${makeIds.size} unique makes.`);

    // 2. Fetch Models for each Make
    // Priority list to ensure these get fetched first
    const PRIORITY_MAKES = new Set([
        'JEEP', 'KIA', 'FORD', 'CHEVROLET', 'TOYOTA', 'HONDA', 'NISSAN',
        'BMW', 'MERCEDES-BENZ', 'AUDI', 'VOLKSWAGEN', 'HYUNDAI', 'MAZDA',
        'SUBARU', 'LEXUS', 'ACURA', 'INFINITI', 'VOLVO', 'LAND ROVER',
        'JAGUAR', 'PORSCHE', 'TESLA', 'RIVIAN', 'LUCID', 'CADILLAC',
        'BUICK', 'GMC', 'RAM', 'DODGE', 'CHRYSLER', 'LINCOLN', 'MINI',
        'FIAT', 'ALFA ROMEO', 'MASERATI', 'FERRARI', 'LAMBORGHINI',
        'ASTON MARTIN', 'BENTLEY', 'ROLLS-ROYCE', 'MCLAREN', 'BUGATTI',
        'GENESIS', 'POLESTAR', 'MITSUBISHI', 'SUZUKI', 'ISUZU'
    ]);

    const makesArray = Array.from(makeIds);
    // Sort: Priority makes first, then alphabetical
    const sortedMakes = makesArray.sort((a, b) => {
        const nameA = makesMap.get(a)?.toUpperCase() || '';
        const nameB = makesMap.get(b)?.toUpperCase() || '';
        const isPriorityA = PRIORITY_MAKES.has(nameA);
        const isPriorityB = PRIORITY_MAKES.has(nameB);

        if (isPriorityA && !isPriorityB) return -1;
        if (!isPriorityA && isPriorityB) return 1;
        return nameA.localeCompare(nameB);
    });

    console.log('Fetching models for makes (Priority First)...');

    const results: Record<string, string[]> = {}; // Make -> [Models]

    // Create a concurrency limiter
    const BATCH_SIZE = 50;

    // Path to save file
    const outputPath = path.join(__dirname, '../src/data/vpic-data.json');

    for (let i = 0; i < sortedMakes.length; i += BATCH_SIZE) {
        const batch = sortedMakes.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (makeId) => {
            const makeName = makesMap.get(makeId);
            if (!makeName) return;

            // Skip very obscure names or empty names if not in priority
            if (!PRIORITY_MAKES.has(makeName.toUpperCase()) && makeName.match(/^[0-9]+$/)) return;

            try {
                // Fetch models
                const data = await fetchJson(`${BASE_URL}/GetModelsForMakeId/${makeId}?format=json`);
                const models = data.Results.map((m: any) => m.Model_Name.trim());

                // Deduplicate models
                const uniqueModels = Array.from(new Set(models)).sort() as string[];

                if (uniqueModels.length > 0) {
                    results[makeName] = uniqueModels;
                }
            } catch (err) {
                console.error(`Failed to fetch models for ${makeName}`, err);
            }
        }));

        console.log(`Processed batch ${i / BATCH_SIZE + 1} / ${Math.ceil(sortedMakes.length / BATCH_SIZE)}`);

        // Save intermediate results every 5 batches or if it's the first batch (priority)
        if (i === 0 || i % (BATCH_SIZE * 5) === 0) {
            const sortedResults: Record<string, string[]> = {};
            Object.keys(results).sort().forEach(key => {
                sortedResults[key] = results[key];
            });
            fs.writeFileSync(outputPath, JSON.stringify(sortedResults, null, 2));
            console.log(`Saved intermediate data (${Object.keys(sortedResults).length} makes) to ${outputPath}`);
        }
    }

    // Final save
    const finalResults: Record<string, string[]> = {};
    Object.keys(results).sort().forEach(key => {
        finalResults[key] = results[key];
    });
    fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
    console.log(`Done! Saved data for ${Object.keys(finalResults).length} makes.`);
}

main().catch(console.error);
