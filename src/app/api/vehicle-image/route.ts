// ============================================
// Vehicle Image Search API (Google Custom Search)
// ============================================

import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
// Use env if provided, otherwise fall back to default CSE ID
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || '11dfdf0330183431a';

async function parseGoogleError(res: Response) {
    try {
        const details = await res.json();
        return details?.error?.message ? String(details.error.message) : null;
    } catch {
        try {
            return await res.text();
        } catch {
            return null;
        }
    }
}

function buildSearchUrl(make: string, model: string, year: string, startParam: string | null) {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', GOOGLE_API_KEY!);
    url.searchParams.set('cx', GOOGLE_CSE_ID!);
    url.searchParams.set('q', [year, make, model, 'car photo'].filter(Boolean).join(' '));
    url.searchParams.set('searchType', 'image');
    url.searchParams.set('num', '1');
    const start = Math.max(1, Math.min(50, Number(startParam) || 1));
    url.searchParams.set('start', String(start));
    url.searchParams.set('safe', 'active');
    url.searchParams.set('imgType', 'photo');
    return url;
}

export async function GET(request: Request) {
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
        return NextResponse.json({ error: 'Image search is not configured.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const m = searchParams.get('make') || '';
    const mo = searchParams.get('model') || '';
    if (!m || !mo) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const url = buildSearchUrl(m, mo, searchParams.get('year') || '', searchParams.get('start'));

    try {
        const res = await fetch(url.toString());
        if (!res.ok) {
            return NextResponse.json(
                {
                    error: 'Google API error',
                    status: res.status,
                    googleError: await parseGoogleError(res),
                },
                { status: 502 }
            );
        }

        const data = await res.json();
        const item = data.items?.[0];
        if (!item?.link) return NextResponse.json({ error: 'No image found' }, { status: 404 });

        return NextResponse.json({
            imageUrl: item.link,
            contextLink: item.image?.contextLink ?? null,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
