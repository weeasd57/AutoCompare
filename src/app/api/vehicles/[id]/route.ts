import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

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
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const { id } = params;
        const body = await request.json();

        // Load existing row so we can support partial updates safely
        const rows = await query<VehicleDbRow>(
            'SELECT * FROM vehicles WHERE id = ?',
            [id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        const existing = rows[0];

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
        } = body as Partial<VehicleDbRow> & { fuel_combined_mpg?: number };

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
                make ?? existing.make,
                model ?? existing.model,
                year ?? existing.year,
                trim ?? existing.trim,
                base_price ?? existing.base_price,
                horsepower ?? existing.horsepower,
                engine_cylinders ?? existing.engine_cylinders,
                fuel_combined_mpg ?? existing.fuel_combined_mpg,
                drivetrain ?? existing.drivetrain,
                seating_capacity ?? existing.seating_capacity,
                fuel_type ?? existing.fuel_type,
                body_style ?? existing.body_style,
                country ?? existing.country,
                image_url ?? existing.image_url,
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
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

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
