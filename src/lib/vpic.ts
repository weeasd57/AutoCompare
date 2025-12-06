// ============================================
// VPIC API Service - NHTSA Vehicle Data
// Free API, no key required
// Docs: https://vpic.nhtsa.dot.gov/api/
// ============================================

import type {
    VehicleMake,
    VehicleModel,
    VPICResponse,
    NormalizedSpec
} from '@/types/vehicle';

// Base URL for NHTSA VPIC API
const VPIC_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

/**
 * Fetch wrapper with error handling
 */
async function vpicFetch<T>(endpoint: string): Promise<T> {
    const url = `${VPIC_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
            // Cache for 1 hour to reduce API calls
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            throw new Error(`VPIC API error: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error(`VPIC API fetch failed: ${endpoint}`, error);
        throw error;
    }
}

/**
 * Get all vehicle makes
 * Returns list of all manufacturers
 */
export async function getAllMakes(): Promise<VehicleMake[]> {
    const data = await vpicFetch<VPICResponse>('/GetAllMakes?format=json');

    return data.Results.map((result) => ({
        makeId: result.Make_ID as number,
        makeName: result.Make_Name as string,
    }));
}

/**
 * Get all models for a specific make
 */
export async function getModelsForMake(make: string): Promise<VehicleModel[]> {
    const encodedMake = encodeURIComponent(make);
    const data = await vpicFetch<VPICResponse>(
        `/GetModelsForMake/${encodedMake}?format=json`
    );

    return data.Results.map((result) => ({
        makeId: result.Make_ID as number,
        makeName: result.Make_Name as string,
        modelId: result.Model_ID as number,
        modelName: result.Model_Name as string,
    }));
}

/**
 * Get models for a make and specific year
 */
export async function getModelsForMakeYear(
    make: string,
    year: number
): Promise<VehicleModel[]> {
    const encodedMake = encodeURIComponent(make);
    const data = await vpicFetch<VPICResponse>(
        `/GetModelsForMakeYear/make/${encodedMake}/modelyear/${year}?format=json`
    );

    return data.Results.map((result) => ({
        makeId: result.Make_ID as number,
        makeName: result.Make_Name as string,
        modelId: result.Model_ID as number,
        modelName: result.Model_Name as string,
    }));
}

/**
 * Decode a VIN to get vehicle specifications
 */
export async function decodeVIN(vin: string): Promise<NormalizedSpec> {
    const data = await vpicFetch<VPICResponse>(
        `/DecodeVinValues/${vin}?format=json`
    );

    if (data.Results.length === 0) {
        throw new Error('No results found for VIN');
    }

    return normalizeVPICResult(data.Results[0]);
}

/**
 * Decode VIN with extended data (includes more fields)
 */
export async function decodeVINExtended(vin: string): Promise<NormalizedSpec> {
    const data = await vpicFetch<VPICResponse>(
        `/DecodeVinValuesExtended/${vin}?format=json`
    );

    if (data.Results.length === 0) {
        throw new Error('No results found for VIN');
    }

    return normalizeVPICResult(data.Results[0]);
}

/**
 * Get vehicle types for a make
 */
export async function getVehicleTypesForMake(make: string): Promise<string[]> {
    const encodedMake = encodeURIComponent(make);
    const data = await vpicFetch<VPICResponse>(
        `/GetVehicleTypesForMake/${encodedMake}?format=json`
    );

    return data.Results.map((result) => result.VehicleTypeName as string);
}

/**
 * Get all model years available (current - 10 to current + 2)
 */
export function getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];

    // Include 2 future years and 15 past years
    for (let year = currentYear + 2; year >= currentYear - 15; year--) {
        years.push(year);
    }

    return years;
}

/**
 * Normalize VPIC result to standardized spec format
 * Maps various VPIC field names to our unified schema
 */
function normalizeVPICResult(result: Record<string, unknown>): NormalizedSpec {
    // Helper to safely get string value
    const getString = (key: string): string | null => {
        const value = result[key];
        if (value === null || value === undefined || value === '') return null;
        return String(value).trim();
    };

    // Helper to safely get number value
    const getNumber = (key: string): number | null => {
        const value = result[key];
        if (value === null || value === undefined || value === '') return null;
        const num = parseFloat(String(value));
        return isNaN(num) ? null : num;
    };

    // Helper to get boolean
    const getBoolean = (key: string): boolean | null => {
        const value = getString(key);
        if (value === null) return null;
        return value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
    };

    // Build the ID from make-model-year
    const make = getString('Make') || 'Unknown';
    const model = getString('Model') || 'Unknown';
    const year = getNumber('ModelYear') || 0;
    const trim = getString('Trim');

    const id = `${make}-${model}-${year}`.toLowerCase().replace(/\s+/g, '-');

    return {
        // Identity
        id,
        make,
        model,
        year,
        trim,

        // Engine specs
        horsepower: getNumber('EngineHP'),
        torque: getNumber('EngineTorque_lb_ft') || getNumber('Torque_lb_ft'),
        engineDisplacement: getNumber('DisplacementL'),
        engineCylinders: getNumber('EngineCylinders'),
        engineConfiguration: getString('EngineConfiguration'),
        fuelType: getString('FuelTypePrimary'),

        // Fuel economy (VPIC doesn't provide MPG, would need additional source)
        fuelCityMpg: null,
        fuelHighwayMpg: null,
        fuelCombinedMpg: null,

        // Transmission & Drivetrain
        transmission: getString('TransmissionStyle'),
        transmissionSpeeds: getNumber('TransmissionSpeeds'),
        drivetrain: getString('DriveType'),

        // Body & Dimensions
        bodyStyle: getString('BodyClass'),
        doors: getNumber('Doors'),
        seatingCapacity: getNumber('Seats'),

        // Weight & Capacity
        curbWeight: getNumber('CurbWeightLB'),
        gvwr: getNumber('GVWR'),
        payloadCapacity: null, // Not in VPIC
        towingCapacity: null, // Not in VPIC

        // Safety
        airbags: getNumber('AirBagLocFront') ? 2 : null, // Simplified
        abs: getBoolean('ABS'),
        esc: getBoolean('ESC'),

        // Other
        basePrice: getNumber('BasePrice'),
        country: getString('PlantCountry'),
        manufacturer: getString('Manufacturer'),
    };
}

/**
 * Search vehicles by make/model/year combination
 * Returns normalized specs for comparison
 */
export async function searchVehicle(
    make: string,
    model: string,
    year: number
): Promise<NormalizedSpec | null> {
    try {
        // Use decode with partial VIN approach or model lookup
        // For now, we'll create a synthetic spec based on available data
        const models = await getModelsForMakeYear(make, year);
        const matchedModel = models.find(
            (m) => m.modelName.toLowerCase() === model.toLowerCase()
        );

        if (!matchedModel) {
            return null;
        }

        // Create a basic spec from the model info
        // In a real scenario, you'd need VIN or additional API
        const id = `${make}-${model}-${year}`.toLowerCase().replace(/\s+/g, '-');

        return {
            id,
            make: matchedModel.makeName,
            model: matchedModel.modelName,
            year,
            trim: null,
            horsepower: null,
            torque: null,
            engineDisplacement: null,
            engineCylinders: null,
            engineConfiguration: null,
            fuelType: null,
            fuelCityMpg: null,
            fuelHighwayMpg: null,
            fuelCombinedMpg: null,
            transmission: null,
            transmissionSpeeds: null,
            drivetrain: null,
            bodyStyle: null,
            doors: null,
            seatingCapacity: null,
            curbWeight: null,
            gvwr: null,
            payloadCapacity: null,
            towingCapacity: null,
            airbags: null,
            abs: null,
            esc: null,
            basePrice: null,
            country: null,
            manufacturer: null,
        };
    } catch (error) {
        console.error('Error searching vehicle:', error);
        return null;
    }
}
