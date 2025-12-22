import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

function createResponse(
    data: Uint8Array,
    mimeType: string,
    etag: string,
    ifNoneMatch: string | null
) {
    const headers: Record<string, string> = {
        ETag: etag,
        'Cache-Control': 'private, max-age=0, must-revalidate',
    };
    if (ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304, headers });
    }
    return new NextResponse(data as any, {
        status: 200,
        headers: { ...headers, 'Content-Type': mimeType },
    });
}

function parseLegacyPayload(raw: string) {
    try {
        return JSON.parse(raw);
    } catch {
        const legacy = raw.trim();
        const mimeMatch = legacy.match(/mimeType:\s*'([^']+)'/);
        const dataMatch = legacy.match(/data:\s*'([^']+)'/);
        const legacyData = dataMatch ? dataMatch[1] : null;

        if (legacyData) {
            const base64 = legacyData.includes('base64,')
                ? (legacyData.split('base64,').pop() as string)
                : legacyData;
            return { mimeType: mimeMatch ? mimeMatch[1] : undefined, data: base64 };
        }
        return { data: legacy };
    }
}

// GET: Return hero image binary from DB
export async function GET(request: Request) {
    try {
        const heroRows = await query<any>(
            'SELECT id, mime_type, image_data FROM hero_images ORDER BY updated_at DESC LIMIT 1'
        );
        const ifNoneMatch = request.headers.get('if-none-match');

        if (Array.isArray(heroRows) && heroRows.length > 0 && heroRows[0].image_data) {
            const row = heroRows[0];
            const mimeType = row.mime_type || 'image/png';
            const buffer = Buffer.isBuffer(row.image_data)
                ? row.image_data
                : Buffer.from(row.image_data as any);
            return createResponse(
                new Uint8Array(buffer),
                mimeType,
                `W/"${mimeType}:${buffer.length}:${row.id}"`,
                ifNoneMatch
            );
        }

        const rows = (await query(
            'SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1',
            ['homeHeroImageData']
        )) as any[];
        if (!Array.isArray(rows) || rows.length === 0 || !rows[0].setting_value) {
            return new NextResponse('Not found', { status: 404 });
        }

        const raw = rows[0].setting_value as string;
        const payload = parseLegacyPayload(raw);
        const mimeType = payload.mimeType || 'image/png';
        const buffer = Buffer.from(payload.data, 'base64');
        return createResponse(
            new Uint8Array(buffer),
            mimeType,
            `W/"${mimeType}:${raw.length}"`,
            ifNoneMatch
        );
    } catch (error) {
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

        await query(`INSERT INTO hero_images (mime_type, image_data) VALUES (?, ?)`, [
            mimeType,
            buffer,
        ]);

        const imageUrl = `/api/settings/hero-image?v=${Date.now()}`;

        await query(
            `INSERT INTO settings (setting_key, setting_value)
             VALUES ('homeHeroImageUrl', ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [imageUrl]
        );

        return NextResponse.json({ success: true, imageUrl });
    } catch (error: any) {
        console.error('Failed to upload hero image:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload image' },
            { status: 500 }
        );
    }
}
