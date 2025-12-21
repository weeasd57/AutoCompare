// ============================================
// Sample Data API Route
// Loads demo vehicles from an in-memory array
// ============================================

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

interface SampleVehicle {
    make: string;
    model: string;
    year: number;
    trim?: string;
    horsepower?: number;
    engineCylinders?: number;
    fuelType?: string;
    bodyStyle?: string;
    country?: string;
    fuelCombinedMpg?: number;
    drivetrain?: string;
    seatingCapacity?: number;
    basePrice?: number;
    imageUrl?: string;
}

// Around 40 demo vehicles covering different brands and segments
const SAMPLE_VEHICLES: SampleVehicle[] = [
    { make: 'Toyota', model: 'Corolla', year: 2024, trim: 'SE', horsepower: 169, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Japan', fuelCombinedMpg: 34, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 24000 },
    { make: 'Toyota', model: 'Camry', year: 2024, trim: 'XSE', horsepower: 301, engineCylinders: 6, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Japan', fuelCombinedMpg: 26, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 32000 },
    { make: 'Toyota', model: 'RAV4', year: 2024, trim: 'Hybrid XLE', horsepower: 219, engineCylinders: 4, fuelType: 'Hybrid', bodyStyle: 'SUV', country: 'Japan', fuelCombinedMpg: 40, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 34000 },
    { make: 'Honda', model: 'Civic', year: 2024, trim: 'Sport', horsepower: 180, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Japan', fuelCombinedMpg: 33, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 25000 },
    { make: 'Honda', model: 'Accord', year: 2024, trim: 'EX', horsepower: 192, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Japan', fuelCombinedMpg: 32, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 29000 },
    { make: 'Honda', model: 'CR-V', year: 2024, trim: 'EX-L', horsepower: 190, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Japan', fuelCombinedMpg: 30, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 33000 },
    { make: 'Hyundai', model: 'Elantra', year: 2024, trim: 'N Line', horsepower: 201, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'South Korea', fuelCombinedMpg: 30, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 26000 },
    { make: 'Hyundai', model: 'Tucson', year: 2024, trim: 'Hybrid Limited', horsepower: 226, engineCylinders: 4, fuelType: 'Hybrid', bodyStyle: 'SUV', country: 'South Korea', fuelCombinedMpg: 38, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 36000 },
    { make: 'Kia', model: 'Sportage', year: 2024, trim: 'EX', horsepower: 187, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'South Korea', fuelCombinedMpg: 28, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 29000 },
    { make: 'Kia', model: 'K5', year: 2024, trim: 'GT-Line', horsepower: 180, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'South Korea', fuelCombinedMpg: 31, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 28000 },
    { make: 'Nissan', model: 'Altima', year: 2024, trim: 'SR', horsepower: 188, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Japan', fuelCombinedMpg: 32, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 27000 },
    { make: 'Nissan', model: 'Rogue', year: 2024, trim: 'SL', horsepower: 201, engineCylinders: 3, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Japan', fuelCombinedMpg: 33, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 32000 },
    { make: 'Mazda', model: 'Mazda3', year: 2024, trim: 'Premium', horsepower: 186, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Hatchback', country: 'Japan', fuelCombinedMpg: 30, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 27000 },
    { make: 'Mazda', model: 'CX-5', year: 2024, trim: 'Carbon Edition', horsepower: 187, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Japan', fuelCombinedMpg: 28, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 32000 },
    { make: 'Ford', model: 'F-150', year: 2024, trim: 'Lariat', horsepower: 400, engineCylinders: 6, fuelType: 'Petrol', bodyStyle: 'Truck', country: 'USA', fuelCombinedMpg: 20, drivetrain: '4WD', seatingCapacity: 5, basePrice: 52000 },
    { make: 'Ford', model: 'Mustang', year: 2024, trim: 'GT', horsepower: 450, engineCylinders: 8, fuelType: 'Petrol', bodyStyle: 'Coupe', country: 'USA', fuelCombinedMpg: 19, drivetrain: 'RWD', seatingCapacity: 4, basePrice: 43000 },
    { make: 'Ford', model: 'Escape', year: 2024, trim: 'Hybrid', horsepower: 200, engineCylinders: 4, fuelType: 'Hybrid', bodyStyle: 'SUV', country: 'USA', fuelCombinedMpg: 40, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 33000 },
    { make: 'Chevrolet', model: 'Silverado 1500', year: 2024, trim: 'RST', horsepower: 355, engineCylinders: 8, fuelType: 'Petrol', bodyStyle: 'Truck', country: 'USA', fuelCombinedMpg: 18, drivetrain: '4WD', seatingCapacity: 5, basePrice: 51000 },
    { make: 'Chevrolet', model: 'Camaro', year: 2024, trim: 'SS', horsepower: 455, engineCylinders: 8, fuelType: 'Petrol', bodyStyle: 'Coupe', country: 'USA', fuelCombinedMpg: 20, drivetrain: 'RWD', seatingCapacity: 4, basePrice: 42000 },
    { make: 'Chevrolet', model: 'Equinox', year: 2024, trim: 'LT', horsepower: 175, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'USA', fuelCombinedMpg: 28, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 29000 },
    { make: 'BMW', model: '3 Series', year: 2024, trim: '330i', horsepower: 255, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Germany', fuelCombinedMpg: 28, drivetrain: 'RWD', seatingCapacity: 5, basePrice: 46000 },
    { make: 'BMW', model: 'X3', year: 2024, trim: 'xDrive30i', horsepower: 248, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Germany', fuelCombinedMpg: 25, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 49000 },
    { make: 'BMW', model: 'i4', year: 2024, trim: 'eDrive40', horsepower: 335, fuelType: 'Electric', bodyStyle: 'Sedan', country: 'Germany', drivetrain: 'RWD', seatingCapacity: 5, basePrice: 56000 },
    { make: 'Mercedes-Benz', model: 'C-Class', year: 2024, trim: 'C300', horsepower: 255, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Germany', fuelCombinedMpg: 27, drivetrain: 'RWD', seatingCapacity: 5, basePrice: 48000 },
    { make: 'Mercedes-Benz', model: 'GLC', year: 2024, trim: 'GLC 300', horsepower: 255, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Germany', fuelCombinedMpg: 25, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 52000 },
    { make: 'Audi', model: 'A4', year: 2024, trim: 'Premium Plus', horsepower: 261, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Germany', fuelCombinedMpg: 27, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 46000 },
    { make: 'Audi', model: 'Q5', year: 2024, trim: 'Prestige', horsepower: 261, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Germany', fuelCombinedMpg: 25, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 51000 },
    { make: 'Volkswagen', model: 'Golf GTI', year: 2024, trim: 'SE', horsepower: 241, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Hatchback', country: 'Germany', fuelCombinedMpg: 28, drivetrain: 'FWD', seatingCapacity: 5, basePrice: 36000 },
    { make: 'Volkswagen', model: 'Tiguan', year: 2024, trim: 'SEL R-Line', horsepower: 184, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Germany', fuelCombinedMpg: 25, drivetrain: 'AWD', seatingCapacity: 7, basePrice: 39000 },
    { make: 'Tesla', model: 'Model 3', year: 2024, trim: 'Long Range', horsepower: 425, fuelType: 'Electric', bodyStyle: 'Sedan', country: 'USA', drivetrain: 'AWD', seatingCapacity: 5, basePrice: 50000 },
    { make: 'Tesla', model: 'Model Y', year: 2024, trim: 'Performance', horsepower: 456, fuelType: 'Electric', bodyStyle: 'SUV', country: 'USA', drivetrain: 'AWD', seatingCapacity: 7, basePrice: 56000 },
    { make: 'Volvo', model: 'XC60', year: 2024, trim: 'Recharge', horsepower: 455, fuelType: 'Plug-in Hybrid', bodyStyle: 'SUV', country: 'Sweden', drivetrain: 'AWD', seatingCapacity: 5, basePrice: 62000 },
    { make: 'Subaru', model: 'Outback', year: 2024, trim: 'Onyx XT', horsepower: 260, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'Wagon', country: 'Japan', fuelCombinedMpg: 26, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 38000 },
    { make: 'Subaru', model: 'Forester', year: 2024, trim: 'Sport', horsepower: 182, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Japan', fuelCombinedMpg: 29, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 32000 },
    { make: 'Jeep', model: 'Wrangler', year: 2024, trim: 'Rubicon', horsepower: 285, engineCylinders: 6, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'USA', fuelCombinedMpg: 19, drivetrain: '4WD', seatingCapacity: 5, basePrice: 55000 },
    { make: 'Jeep', model: 'Grand Cherokee', year: 2024, trim: 'Limited', horsepower: 293, engineCylinders: 6, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'USA', fuelCombinedMpg: 23, drivetrain: '4WD', seatingCapacity: 5, basePrice: 52000 },
    { make: 'Porsche', model: '911', year: 2024, trim: 'Carrera S', horsepower: 443, engineCylinders: 6, fuelType: 'Petrol', bodyStyle: 'Coupe', country: 'Germany', fuelCombinedMpg: 20, drivetrain: 'RWD', seatingCapacity: 4, basePrice: 130000 },
    { make: 'Lexus', model: 'RX 350', year: 2024, trim: 'F Sport', horsepower: 275, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'Japan', fuelCombinedMpg: 25, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 58000 },
    { make: 'Lexus', model: 'IS 350', year: 2024, trim: 'F Sport', horsepower: 311, engineCylinders: 6, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'Japan', fuelCombinedMpg: 23, drivetrain: 'RWD', seatingCapacity: 5, basePrice: 51000 },
    { make: 'Genesis', model: 'G70', year: 2024, trim: '3.3T Sport', horsepower: 365, engineCylinders: 6, fuelType: 'Petrol', bodyStyle: 'Sedan', country: 'South Korea', fuelCombinedMpg: 21, drivetrain: 'RWD', seatingCapacity: 5, basePrice: 49000 },
    { make: 'Genesis', model: 'GV70', year: 2024, trim: '2.5T Advanced', horsepower: 300, engineCylinders: 4, fuelType: 'Petrol', bodyStyle: 'SUV', country: 'South Korea', fuelCombinedMpg: 23, drivetrain: 'AWD', seatingCapacity: 5, basePrice: 52000 },
];

function createVehicleId(sample: SampleVehicle): string {
    return `${sample.make}-${sample.model}-${sample.year}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export async function POST(request: Request) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        // Insert each sample vehicle using INSERT IGNORE to avoid duplicates
        for (const sample of SAMPLE_VEHICLES) {
            const id = createVehicleId(sample);

            await query(
                `INSERT IGNORE INTO vehicles (
                    id,
                    make,
                    model,
                    year,
                    trim,
                    horsepower,
                    engine_cylinders,
                    fuel_type,
                    body_style,
                    country,
                    fuel_combined_mpg,
                    drivetrain,
                    seating_capacity,
                    base_price,
                    image_url,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    id,
                    sample.make,
                    sample.model,
                    sample.year,
                    sample.trim ?? null,
                    sample.horsepower ?? null,
                    sample.engineCylinders ?? null,
                    sample.fuelType ?? null,
                    sample.bodyStyle ?? null,
                    sample.country ?? null,
                    sample.fuelCombinedMpg ?? null,
                    sample.drivetrain ?? null,
                    sample.seatingCapacity ?? null,
                    sample.basePrice ?? null,
                    sample.imageUrl ?? null,
                ]
            );
        }

        // Get count of vehicles now in database
        const countResult = await query<{ count: number }>('SELECT COUNT(*) as count FROM vehicles', []);
        const count = Array.isArray(countResult) && countResult.length > 0
            ? countResult[0].count
            : 0;

        return NextResponse.json({
            success: true,
            message: `Sample data loaded successfully! Database now has ${count} vehicles.`,
            totalVehicles: count,
        });
    } catch (error: any) {
        console.error('Sample data error:', error);

        return NextResponse.json(
            { error: error.message || 'Failed to load sample data' },
            { status: 500 }
        );
    }
}
