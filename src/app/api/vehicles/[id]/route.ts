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

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const rows = await query<VehicleDbRow>('SELECT * FROM vehicles WHERE id = ?', [id]);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (err) {
        console.error('Error fetching vehicle from MySQL', err);
        return NextResponse.json({ error: 'Failed to load vehicle' }, { status: 500 });
    }
}

function getUpdatedValues(existing: VehicleDbRow, body: any) {
    return {
        make: body.make ?? existing.make,
        model: body.model ?? existing.model,
        year: body.year ?? existing.year,
        trim: body.trim ?? existing.trim,
        base_price: body.base_price ?? existing.base_price,
        horsepower: body.horsepower ?? existing.horsepower,
        engine_cylinders: body.engine_cylinders ?? existing.engine_cylinders,
        fuel_combined_mpg: body.fuel_combined_mpg ?? existing.fuel_combined_mpg,
        drivetrain: body.drivetrain ?? existing.drivetrain,
        seating_capacity: body.seating_capacity ?? existing.seating_capacity,
        fuel_type: body.fuel_type ?? existing.fuel_type,
        body_style: body.body_style ?? existing.body_style,
        country: body.country ?? existing.country,
        image_url: body.image_url ?? existing.image_url,
    };
}

async function updateVehicle(id: string, updates: ReturnType<typeof getUpdatedValues>) {
    await query(
        `UPDATE vehicles
         SET make = ?, model = ?, year = ?, trim = ?, base_price = ?,
             horsepower = ?, engine_cylinders = ?, fuel_combined_mpg = ?,
             drivetrain = ?, seating_capacity = ?, fuel_type = ?,
             body_style = ?, country = ?, image_url = ?
         WHERE id = ?`,
        [
            updates.make,
            updates.model,
            updates.year,
            updates.trim,
            updates.base_price,
            updates.horsepower,
            updates.engine_cylinders,
            updates.fuel_combined_mpg,
            updates.drivetrain,
            updates.seating_capacity,
            updates.fuel_type,
            updates.body_style,
            updates.country,
            updates.image_url,
            id,
        ]
    );
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const { id } = params;
        const body = await request.json();

        const rows = await query<VehicleDbRow>('SELECT * FROM vehicles WHERE id = ?', [id]);
        if (!rows || rows.length === 0) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        const updates = getUpdatedValues(rows[0], body);
        await updateVehicle(id, updates);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error updating vehicle in MySQL', err);
        return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const { id } = params;

        await query('DELETE FROM vehicles WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting vehicle from MySQL', err);
        return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
    }
}
