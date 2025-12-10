// ============================================
// Vehicle API Route - Get Vehicle Specs
// GET /api/vehicle/[id]
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { decodeVIN, searchVehicle } from '@/lib/vpic';
import type { NormalizedSpec } from '@/types/vehicle';

/**
 * Sample vehicle data for demo purposes
 * In production, this would come from VPIC VIN decode or additional APIs
 */
const SAMPLE_VEHICLES: Record<string, Partial<NormalizedSpec>> = {
    'ford-maverick-2025': {
        id: 'ford-maverick-2025',
        make: 'Ford',
        model: 'Maverick',
        year: 2025,
        trim: 'XLT',
        horsepower: 250,
        torque: 277,
        engineDisplacement: 2.0,
        engineCylinders: 4,
        engineConfiguration: 'Inline',
        fuelType: 'Gasoline',
        fuelCityMpg: 23,
        fuelHighwayMpg: 30,
        fuelCombinedMpg: 26,
        transmission: 'Automatic',
        transmissionSpeeds: 8,
        drivetrain: 'FWD',
        bodyStyle: 'Pickup',
        doors: 4,
        seatingCapacity: 5,
        curbWeight: 3731,
        gvwr: 5000,
        payloadCapacity: 1500,
        towingCapacity: 4000,
        airbags: 6,
        abs: true,
        esc: true,
        basePrice: 28995,
        country: 'Mexico',
        manufacturer: 'Ford Motor Company',
    },
    'ford-maverick-hybrid-2025': {
        id: 'ford-maverick-hybrid-2025',
        make: 'Ford',
        model: 'Maverick Hybrid',
        year: 2025,
        trim: 'XL',
        horsepower: 191,
        torque: 155,
        engineDisplacement: 2.5,
        engineCylinders: 4,
        engineConfiguration: 'Inline',
        fuelType: 'Hybrid',
        fuelCityMpg: 42,
        fuelHighwayMpg: 33,
        fuelCombinedMpg: 37,
        transmission: 'CVT',
        transmissionSpeeds: null,
        drivetrain: 'FWD',
        bodyStyle: 'Pickup',
        doors: 4,
        seatingCapacity: 5,
        curbWeight: 3674,
        gvwr: 4500,
        payloadCapacity: 1200,
        towingCapacity: 2000,
        airbags: 6,
        abs: true,
        esc: true,
        basePrice: 25515,
        country: 'Mexico',
        manufacturer: 'Ford Motor Company',
    },
    'toyota-tacoma-2025': {
        id: 'toyota-tacoma-2025',
        make: 'Toyota',
        model: 'Tacoma',
        year: 2025,
        trim: 'SR5',
        horsepower: 278,
        torque: 317,
        engineDisplacement: 2.4,
        engineCylinders: 4,
        engineConfiguration: 'Inline Turbo',
        fuelType: 'Gasoline',
        fuelCityMpg: 19,
        fuelHighwayMpg: 24,
        fuelCombinedMpg: 21,
        transmission: 'Automatic',
        transmissionSpeeds: 8,
        drivetrain: 'RWD',
        bodyStyle: 'Pickup',
        doors: 4,
        seatingCapacity: 5,
        curbWeight: 4515,
        gvwr: 6010,
        payloadCapacity: 1495,
        towingCapacity: 6500,
        airbags: 8,
        abs: true,
        esc: true,
        basePrice: 35880,
        country: 'Japan',
        manufacturer: 'Toyota Motor Corporation',
    },
    'honda-civic-2024': {
        id: 'honda-civic-2024',
        make: 'Honda',
        model: 'Civic',
        year: 2024,
        trim: 'Sport',
        horsepower: 180,
        torque: 177,
        engineDisplacement: 2.0,
        engineCylinders: 4,
        engineConfiguration: 'Inline',
        fuelType: 'Gasoline',
        fuelCityMpg: 31,
        fuelHighwayMpg: 40,
        fuelCombinedMpg: 35,
        transmission: 'CVT',
        transmissionSpeeds: null,
        drivetrain: 'FWD',
        bodyStyle: 'Sedan',
        doors: 4,
        seatingCapacity: 5,
        curbWeight: 2906,
        gvwr: 3916,
        payloadCapacity: null,
        towingCapacity: 1000,
        airbags: 10,
        abs: true,
        esc: true,
        basePrice: 25845,
        country: 'USA',
        manufacturer: 'Honda Motor Co.',
    },
    'toyota-camry-2024': {
        id: 'toyota-camry-2024',
        make: 'Toyota',
        model: 'Camry',
        year: 2024,
        trim: 'SE',
        horsepower: 203,
        torque: 184,
        engineDisplacement: 2.5,
        engineCylinders: 4,
        engineConfiguration: 'Inline',
        fuelType: 'Gasoline',
        fuelCityMpg: 28,
        fuelHighwayMpg: 39,
        fuelCombinedMpg: 32,
        transmission: 'Automatic',
        transmissionSpeeds: 8,
        drivetrain: 'FWD',
        bodyStyle: 'Sedan',
        doors: 4,
        seatingCapacity: 5,
        curbWeight: 3310,
        gvwr: 4430,
        payloadCapacity: null,
        towingCapacity: 1000,
        airbags: 10,
        abs: true,
        esc: true,
        basePrice: 28400,
        country: 'USA',
        manufacturer: 'Toyota Motor Corporation',
    },
    'ford-f-150-2024': {
        id: 'ford-f-150-2024',
        make: 'Ford',
        model: 'F-150',
        year: 2024,
        trim: 'XLT',
        horsepower: 400,
        torque: 410,
        engineDisplacement: 3.5,
        engineCylinders: 6,
        engineConfiguration: 'V6 Twin Turbo',
        fuelType: 'Gasoline',
        fuelCityMpg: 18,
        fuelHighwayMpg: 24,
        fuelCombinedMpg: 20,
        transmission: 'Automatic',
        transmissionSpeeds: 10,
        drivetrain: '4WD',
        bodyStyle: 'Pickup',
        doors: 4,
        seatingCapacity: 6,
        curbWeight: 4705,
        gvwr: 7050,
        payloadCapacity: 1810,
        towingCapacity: 13000,
        airbags: 8,
        abs: true,
        esc: true,
        basePrice: 44970,
        country: 'USA',
        manufacturer: 'Ford Motor Company',
    },
    'chevrolet-silverado-2024': {
        id: 'chevrolet-silverado-2024',
        make: 'Chevrolet',
        model: 'Silverado 1500',
        year: 2024,
        trim: 'LT',
        horsepower: 355,
        torque: 383,
        engineDisplacement: 5.3,
        engineCylinders: 8,
        engineConfiguration: 'V8',
        fuelType: 'Gasoline',
        fuelCityMpg: 16,
        fuelHighwayMpg: 22,
        fuelCombinedMpg: 18,
        transmission: 'Automatic',
        transmissionSpeeds: 8,
        drivetrain: 'RWD',
        bodyStyle: 'Pickup',
        doors: 4,
        seatingCapacity: 6,
        curbWeight: 4740,
        gvwr: 7100,
        payloadCapacity: 1940,
        towingCapacity: 11500,
        airbags: 6,
        abs: true,
        esc: true,
        basePrice: 48200,
        country: 'USA',
        manufacturer: 'General Motors',
    },
    'tesla-model-3-2024': {
        id: 'tesla-model-3-2024',
        make: 'Tesla',
        model: 'Model 3',
        year: 2024,
        trim: 'Long Range',
        horsepower: 366,
        torque: 493,
        engineDisplacement: null,
        engineCylinders: null,
        engineConfiguration: 'Dual Motor Electric',
        fuelType: 'Electric',
        fuelCityMpg: 134, // MPGe
        fuelHighwayMpg: 126, // MPGe
        fuelCombinedMpg: 130, // MPGe
        transmission: 'Single Speed',
        transmissionSpeeds: 1,
        drivetrain: 'AWD',
        bodyStyle: 'Sedan',
        doors: 4,
        seatingCapacity: 5,
        curbWeight: 3862,
        gvwr: 5015,
        payloadCapacity: null,
        towingCapacity: null,
        airbags: 8,
        abs: true,
        esc: true,
        basePrice: 42990,
        country: 'USA',
        manufacturer: 'Tesla Inc.',
    },
};

/**
 * GET /api/vehicle/[id]
 * Get normalized specs for a specific vehicle
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'Vehicle ID is required' },
                { status: 400 }
            );
        }

        // Normalize the ID
        const normalizedId = id.toLowerCase().replace(/\s+/g, '-');

        // Check if it's a VIN (17 characters)
        if (id.length === 17 && /^[A-HJ-NPR-Z0-9]+$/i.test(id)) {
            try {
                const specs = await decodeVIN(id.toUpperCase());
                return NextResponse.json({ specs, source: 'vpic-vin' });
            } catch (error) {
                console.error('VIN decode failed:', error);
            }
        }

        // Check sample vehicles first
        if (SAMPLE_VEHICLES[normalizedId]) {
            const specs = SAMPLE_VEHICLES[normalizedId] as NormalizedSpec;
            return NextResponse.json({ specs, source: 'sample-data' });
        }

        // Try to parse make-model-year from ID
        const parts = normalizedId.split('-');
        if (parts.length >= 3) {
            const year = parseInt(parts[parts.length - 1], 10);
            const make = parts[0];
            const model = parts.slice(1, -1).join(' ');

            if (!isNaN(year) && year >= 1981 && year <= 2030) {
                const specs = await searchVehicle(make, model, year);
                if (specs) {
                    return NextResponse.json({ specs, source: 'vpic-search' });
                }
            }
        }

        return NextResponse.json(
            { error: 'Vehicle not found', id: normalizedId },
            { status: 404 }
        );

    } catch (error) {
        console.error('Vehicle API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vehicle data' },
            { status: 500 }
        );
    }
}
