import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { NormalizedSpec } from '@/types/vehicle';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

interface VehicleRow {
    id: string;
    make: string;
    model: string;
    year: number;
    trim: string | null;
    horsepower: number | null;
    torque: number | null;
    engine_displacement: number | null;
    engine_cylinders: number | null;
    engine_configuration: string | null;
    fuel_type: string | null;
    fuel_city_mpg: number | null;
    fuel_highway_mpg: number | null;
    fuel_combined_mpg: number | null;
    transmission: string | null;
    transmission_speeds: number | null;
    drivetrain: string | null;
    body_style: string | null;
    doors: number | null;
    seating_capacity: number | null;
    curb_weight: number | null;
    gvwr: number | null;
    payload_capacity: number | null;
    towing_capacity: number | null;
    airbags: number | null;
    abs: number | null; // stored as TINYINT(1)
    esc: number | null; // stored as TINYINT(1)
    base_price: number | null;
    country: string | null;
    manufacturer: string | null;
    image_url: string | null;
}

function mapRowToSpec(row: VehicleRow): NormalizedSpec {
    return {
        id: row.id,
        make: row.make,
        model: row.model,
        year: row.year,
        trim: row.trim,
        horsepower: row.horsepower,
        torque: row.torque,
        engineDisplacement: row.engine_displacement,
        engineCylinders: row.engine_cylinders,
        engineConfiguration: row.engine_configuration,
        fuelType: row.fuel_type,
        fuelCityMpg: row.fuel_city_mpg,
        fuelHighwayMpg: row.fuel_highway_mpg,
        fuelCombinedMpg: row.fuel_combined_mpg,
        transmission: row.transmission,
        transmissionSpeeds: row.transmission_speeds,
        drivetrain: row.drivetrain,
        bodyStyle: row.body_style,
        doors: row.doors,
        seatingCapacity: row.seating_capacity,
        curbWeight: row.curb_weight,
        gvwr: row.gvwr,
        payloadCapacity: row.payload_capacity,
        towingCapacity: row.towing_capacity,
        airbags: row.airbags,
        abs: row.abs === null ? null : !!row.abs,
        esc: row.esc === null ? null : !!row.esc,
        basePrice: row.base_price,
        country: row.country,
        manufacturer: row.manufacturer,
        imageUrl: row.image_url,
    };
}

export async function POST(request: Request) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const body = await request.json();
        const {
            make,
            model,
            year,
            trim,
            base_price,
            horsepower,
            engine_cylinders,
            fuel_type,
            body_style,
            country,
            fuel_combined_mpg,
            drivetrain,
            seating_capacity,
            image_url,
        } = body;

        // Generate ID
        const id = `${make}-${model}-${year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        await query<any>(
            `INSERT INTO vehicles (
                id, make, model, year, trim, base_price, horsepower,
                engine_cylinders, fuel_type, body_style, country,
                fuel_combined_mpg, drivetrain, seating_capacity,
                image_url, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                id,
                make,
                model,
                year,
                trim,
                base_price,
                horsepower,
                engine_cylinders,
                fuel_type,
                body_style,
                country,
                fuel_combined_mpg,
                drivetrain,
                seating_capacity,
                image_url,
            ]
        );

        return NextResponse.json({ success: true, id });
    } catch (err) {
        console.error('Error adding vehicle to MySQL', err);
        return NextResponse.json({ error: 'Failed to add vehicle' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const rows = await query<VehicleRow>('SELECT * FROM vehicles ORDER BY created_at DESC');
        const vehicles: NormalizedSpec[] = rows.map(mapRowToSpec);
        return NextResponse.json(vehicles);
    } catch (err) {
        console.error('Error fetching vehicles from MySQL', err);
        return NextResponse.json({ error: 'Failed to load vehicles' }, { status: 500 });
    }
}
