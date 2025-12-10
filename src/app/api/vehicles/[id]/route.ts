import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface VehicleDbRow {
    id: string;
    make: string;
    model: string;
    year: number;
    trim: string | null;
    horsepower: number | null;
    engine_cylinders: number | null;
    fuel_combined_mpg: number | null;
    drivetrain: string | null;
    seating_capacity: number | null;
    fuel_type: string | null;
    body_style: string | null;
    country: string | null;
    base_price: number | null;
    image_url: string | null;
}

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const rows = await query<VehicleDbRow>(
            'SELECT * FROM vehicles WHERE id = ?',
            [id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error('Error fetching vehicle from MySQL', err);
        return NextResponse.json({ error: 'Failed to load vehicle' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const {
            make,
            model,
            year,
            trim,
            base_price,
            horsepower,
            engine_cylinders,
            fuel_combined_mpg,
            drivetrain,
            seating_capacity,
            fuel_type,
            body_style,
            country,
            image_url,
        } = body;

        await query(
            `UPDATE vehicles
             SET make = ?,
                 model = ?,
                 year = ?,
                 trim = ?,
                 base_price = ?,
                 horsepower = ?,
                 engine_cylinders = ?,
                 fuel_combined_mpg = ?,
                 drivetrain = ?,
                 seating_capacity = ?,
                 fuel_type = ?,
                 body_style = ?,
                 country = ?,
                 image_url = ?
             WHERE id = ?`,
            [
                make,
                model,
                year,
                trim,
                base_price,
                horsepower,
                engine_cylinders,
                fuel_combined_mpg,
                drivetrain,
                seating_capacity,
                fuel_type,
                body_style,
                country,
                image_url,
                id,
            ]
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error updating vehicle in MySQL', err);
        return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        await query(
            'DELETE FROM vehicles WHERE id = ?',
            [id]
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting vehicle from MySQL', err);
        return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
    }
}
