// ============================================
// Vehicle Image Search API (Google Custom Search)
// ============================================

import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// Use env if provided, otherwise fall back to default CSE ID
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || '11dfdf0330183431a';

export async function GET(request: Request) {
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
        return NextResponse.json(
            { error: 'Image search is not configured on the server.' },
            { status: 500 },
        );
    }

    const { searchParams } = new URL(request.url);
    const make = searchParams.get('make') || '';
    const model = searchParams.get('model') || '';
    const year = searchParams.get('year') || '';
    const startParam = searchParams.get('start');

    if (!make || !model) {
        return NextResponse.json(
            { error: 'Missing required parameters: make and model' },
            { status: 400 },
        );
    }

    const queryParts = [] as string[];
    if (year) queryParts.push(year);
    queryParts.push(make, model, 'car photo');
    const q = queryParts.join(' ');

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', GOOGLE_API_KEY);
    url.searchParams.set('cx', GOOGLE_CSE_ID);
    url.searchParams.set('q', q);
    url.searchParams.set('searchType', 'image');
    url.searchParams.set('num', '1');

    // Support pagination so admin tools can fetch multiple candidate images
    const start = startParam ? Math.max(1, Math.min(50, Number(startParam) || 1)) : 1;
    url.searchParams.set('start', String(start));

    url.searchParams.set('safe', 'active');
    url.searchParams.set('imgType', 'photo');

    try {
        const res = await fetch(url.toString(), { method: 'GET' });
        if (!res.ok) {
            let details: any = null;
            try {
                details = await res.json();
            } catch {
                try {
                    details = await res.text();
                } catch {
                    details = null;
                }
            }

            const googleMessage =
                typeof details === 'object' && details?.error?.message
                    ? String(details.error.message)
                    : typeof details === 'string'
                    ? details
                    : null;

            return NextResponse.json(
                {
                    error: 'Failed to contact Google image search API',
                    status: res.status,
                    googleError: googleMessage,
                },
                { status: 502 },
            );
        }

        const data: any = await res.json();
        const item = Array.isArray(data.items) && data.items.length > 0 ? data.items[0] : null;

        if (!item || !item.link) {
            return NextResponse.json(
                { error: 'No image found for this vehicle' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            imageUrl: item.link as string,
            contextLink: item.image?.contextLink ?? null,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || 'Unexpected error while fetching image' },
            { status: 500 },
        );
    }
}
