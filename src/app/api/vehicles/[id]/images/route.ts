import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_IMAGES_PER_VEHICLE = 5;

async function assertVehicleExists(vehicleId: string) {
    const rows = await query<{ id: string }>('SELECT id FROM vehicles WHERE id = ? LIMIT 1', [
        vehicleId,
    ]);
    return Array.isArray(rows) && rows.length > 0;
}

async function syncVehicleImageUrl(vehicleId: string) {
    const rows = await query<{ id: number }>(
        'SELECT id FROM vehicle_images WHERE vehicle_id = ? ORDER BY sort_order ASC',
        [vehicleId]
    );

    const urls = (Array.isArray(rows) ? rows : [])
        .map((r) => `/api/vehicles/${encodeURIComponent(vehicleId)}/images/${r.id}`)
        .join('|');

    await query('UPDATE vehicles SET image_url = ? WHERE id = ?', [urls || null, vehicleId]);

    return urls;
}

async function readImageFromUrl(sourceUrl: string) {
    let parsed: URL;
    try {
        parsed = new URL(sourceUrl);
    } catch {
        throw new Error('Invalid URL');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Only http/https URLs are allowed');
    }

    const res = await fetch(parsed.toString());
    if (!res.ok) {
        throw new Error('Failed to download image from URL');
    }

    const mimeType = res.headers.get('content-type') || '';
    if (!mimeType.startsWith('image/')) {
        throw new Error('URL did not return an image');
    }

    const bytes = await res.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > MAX_IMAGE_BYTES) {
        throw new Error('Image is too large');
    }

    return { buffer, mimeType };
}

async function findFirstAvailableSortOrder(vehicleId: string): Promise<number | null> {
    const rows = await query<{ sort_order: number }>(
        'SELECT sort_order FROM vehicle_images WHERE vehicle_id = ? ORDER BY sort_order ASC',
        [vehicleId]
    );

    const used = new Set<number>();
    if (Array.isArray(rows)) {
        rows.forEach((r) => {
            if (Number.isFinite(r.sort_order)) used.add(Number(r.sort_order));
        });
    }

    for (let i = 0; i < MAX_IMAGES_PER_VEHICLE; i++) {
        if (!used.has(i)) return i;
    }

    return null;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const vehicleId = params.id;

        const rows = await query<{ id: number; sort_order: number; mime_type: string }>(
            'SELECT id, sort_order, mime_type FROM vehicle_images WHERE vehicle_id = ? ORDER BY sort_order ASC',
            [vehicleId]
        );

        const images = (Array.isArray(rows) ? rows : []).map((row) => ({
            id: row.id,
            sortOrder: row.sort_order,
            mimeType: row.mime_type,
            url: `/api/vehicles/${encodeURIComponent(vehicleId)}/images/${row.id}`,
        }));

        return NextResponse.json({ images });
    } catch (error: any) {
        console.error('Failed to list vehicle images:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list images' },
            { status: 500 }
        );
    }
}

async function parseFormData(request: Request) {
    const formData = await request.formData();
    const file = formData.get('file');
    const sortOrderRaw = formData.get('sortOrder');
    let sortOrder;

    if (sortOrderRaw !== null && sortOrderRaw !== undefined && String(sortOrderRaw).trim() !== '') {
        const parsed = Number(sortOrderRaw);
        if (Number.isFinite(parsed) && parsed >= 0) sortOrder = parsed;
    }

    if (!file || !(file instanceof File) || !file.type.startsWith('image/')) return null;

    return { buffer: Buffer.from(await file.arrayBuffer()), mimeType: file.type, sortOrder };
}

async function parseJsonBody(request: Request) {
    const body = await request.json();
    const sourceUrl = body?.sourceUrl;
    const sortOrderRaw = body?.sortOrder;
    let sortOrder;

    if (sortOrderRaw !== undefined) {
        const parsed = Number(sortOrderRaw);
        if (Number.isFinite(parsed) && parsed >= 0) sortOrder = parsed;
    }

    if (!sourceUrl || typeof sourceUrl !== 'string') return null;

    try {
        const downloaded = await readImageFromUrl(sourceUrl);
        return { ...downloaded, sortOrder };
    } catch {
        return null;
    }
}

async function validateSortOrder(vehicleId: string, sortOrder?: number) {
    if (sortOrder === undefined) {
        const available = await findFirstAvailableSortOrder(vehicleId);
        if (available === null) return { error: `Max ${MAX_IMAGES_PER_VEHICLE} images` };
        return { sortOrder: available };
    }
    if (sortOrder >= MAX_IMAGES_PER_VEHICLE) {
        return { error: `sortOrder must be < ${MAX_IMAGES_PER_VEHICLE}` };
    }
    return { sortOrder };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const vehicleId = params.id;
        if (!(await assertVehicleExists(vehicleId)))
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });

        const isMultipart = (request.headers.get('content-type') || '').includes(
            'multipart/form-data'
        );
        const parsed = isMultipart ? await parseFormData(request) : await parseJsonBody(request);

        if (!parsed)
            return NextResponse.json(
                { error: 'Invalid request or failed to get image' },
                { status: 400 }
            );

        const { buffer, mimeType } = parsed;
        if (buffer.length > MAX_IMAGE_BYTES)
            return NextResponse.json({ error: 'Image too large' }, { status: 413 });

        const validated = await validateSortOrder(vehicleId, parsed.sortOrder);
        if (validated.error) return NextResponse.json({ error: validated.error }, { status: 400 });
        const sortOrder = validated.sortOrder!;

        await query(
            `INSERT INTO vehicle_images (vehicle_id, sort_order, mime_type, image_data)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                mime_type = VALUES(mime_type),
                image_data = VALUES(image_data),
                updated_at = CURRENT_TIMESTAMP`,
            [vehicleId, sortOrder, mimeType, buffer]
        );

        const idRows = await query<{ id: number }>(
            'SELECT id FROM vehicle_images WHERE vehicle_id = ? AND sort_order = ? LIMIT 1',
            [vehicleId, sortOrder]
        );
        const imageId = Array.isArray(idRows) && idRows.length > 0 ? idRows[0].id : null;

        const imageUrlList = await syncVehicleImageUrl(vehicleId);

        return NextResponse.json({
            success: true,
            imageId,
            url: imageId
                ? `/api/vehicles/${encodeURIComponent(vehicleId)}/images/${imageId}`
                : null,
            imageUrlList,
        });
    } catch (error: any) {
        console.error('Failed to upload vehicle image:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload image' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const vehicleId = params.id;

        const exists = await assertVehicleExists(vehicleId);
        if (!exists) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        await query('DELETE FROM vehicle_images WHERE vehicle_id = ?', [vehicleId]);
        const imageUrlList = await syncVehicleImageUrl(vehicleId);

        return NextResponse.json({ success: true, imageUrlList });
    } catch (error: any) {
        console.error('Failed to clear vehicle images:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to clear images' },
            { status: 500 }
        );
    }
}
