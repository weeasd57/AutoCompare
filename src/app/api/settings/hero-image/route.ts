import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// GET: Return hero image binary from DB
export async function GET(request: Request) {
    try {
        const heroRows = await query<any>(
            'SELECT id, mime_type, image_data FROM hero_images ORDER BY updated_at DESC LIMIT 1'
        );

        if (Array.isArray(heroRows) && heroRows.length > 0 && heroRows[0].image_data) {
            const row = heroRows[0] as { id: number; mime_type: string; image_data: Buffer };
            const mimeType = row.mime_type || 'image/png';

            const buffer = Buffer.isBuffer(row.image_data)
                ? row.image_data
                : Buffer.from(row.image_data as any);

            const data = new Uint8Array(buffer);

            const etag = `W/"${mimeType}:${buffer.length}:${row.id}"`;
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

            return new NextResponse(data, {
                status: 200,
                headers: {
                    'Content-Type': mimeType,
                    ETag: etag,
                    'Cache-Control': 'private, max-age=0, must-revalidate',
                },
            });
        }

        const rows = await query(
            'SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1',
            ['homeHeroImageData']
        ) as any[];

        if (!Array.isArray(rows) || rows.length === 0 || !rows[0].setting_value) {
            return new NextResponse('Not found', { status: 404 });
        }

        let payload: { mimeType?: string; data: string };
        const raw = rows[0].setting_value as string;

        try {
            payload = JSON.parse(raw);
        } catch {
            const legacy = raw.trim();

            let legacyMimeType: string | undefined;
            let legacyData: string | undefined;

            const mimeMatch = legacy.match(/mimeType:\s*'([^']+)'/);
            if (mimeMatch) {
                legacyMimeType = mimeMatch[1];
            }

            const dataMatch = legacy.match(/data:\s*'([^']+)'/);
            if (dataMatch) {
                legacyData = dataMatch[1];
            }

            if (legacyData) {
                const base64 = legacyData.includes('base64,')
                    ? legacyData.split('base64,').pop() as string
                    : legacyData;
                payload = { mimeType: legacyMimeType, data: base64 };
            } else {
                payload = { data: legacy };
            }
        }

        const mimeType = payload.mimeType || 'image/png';
        const buffer = Buffer.from(payload.data, 'base64');
        const data = new Uint8Array(buffer);

        const etag = `W/"${mimeType}:${raw.length}"`;
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

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                ETag: etag,
                'Cache-Control': 'private, max-age=0, must-revalidate',
            },
        });
    } catch (error: any) {
        console.error('Failed to read hero image from DB:', error);
        return new NextResponse('Server error', { status: 500 });
    }
}

// POST: Upload hero image and store in hero_images table as BLOB
export async function POST(request: Request) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const mimeType = file.type || 'image/png';

        await query(
            `INSERT INTO hero_images (mime_type, image_data)
             VALUES (?, ?)`,
            [mimeType, buffer]
        );

        const imageUrl = `/api/settings/hero-image?v=${Date.now()}`;

        // Also save public URL into homeHeroImageUrl setting for existing consumers
        await query(
            `INSERT INTO settings (setting_key, setting_value)
             VALUES ('homeHeroImageUrl', ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [imageUrl]
        );

        return NextResponse.json({ success: true, imageUrl });
    } catch (error: any) {
        console.error('Failed to upload hero image:', error);
        return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
    }
}
