import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

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

export async function GET(
    request: Request,
    { params }: { params: { id: string; imageId: string } }
) {
    try {
        const vehicleId = params.id;
        const imageId = Number(params.imageId);

        if (!Number.isFinite(imageId)) {
            return new NextResponse('Not found', { status: 404 });
        }

        const rows = await query<{ mime_type: string; image_data: Buffer; updated_at: string }>(
            'SELECT mime_type, image_data, updated_at FROM vehicle_images WHERE id = ? AND vehicle_id = ? LIMIT 1',
            [imageId, vehicleId]
        );

        if (!Array.isArray(rows) || rows.length === 0) {
            return new NextResponse('Not found', { status: 404 });
        }

        const row = rows[0];
        const mimeType = row.mime_type || 'image/jpeg';
        const updatedAt = row.updated_at || '';

        const etag = `W/"${imageId}:${updatedAt}:${row.image_data?.length || 0}"`;
        const ifNoneMatch = request.headers.get('if-none-match');
        if (ifNoneMatch && ifNoneMatch === etag) {
            return new NextResponse(null, {
                status: 304,
                headers: {
                    ETag: etag,
                    'Cache-Control': 'private, max-age=0, must-revalidate',
                },
            });
        }

        const data = new Uint8Array(row.image_data);

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                ETag: etag,
                'Cache-Control': 'private, max-age=0, must-revalidate',
            },
        });
    } catch (error: any) {
        console.error('Failed to read vehicle image:', error);
        return new NextResponse('Server error', { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string; imageId: string } }
) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const vehicleId = params.id;
        const imageId = Number(params.imageId);

        if (!Number.isFinite(imageId)) {
            return NextResponse.json({ error: 'Invalid imageId' }, { status: 400 });
        }

        await query('DELETE FROM vehicle_images WHERE id = ? AND vehicle_id = ?', [imageId, vehicleId]);
        const imageUrlList = await syncVehicleImageUrl(vehicleId);

        return NextResponse.json({ success: true, imageUrlList });
    } catch (error: any) {
        console.error('Failed to delete vehicle image:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete image' },
            { status: 500 }
        );
    }
}
