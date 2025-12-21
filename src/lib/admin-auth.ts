import { NextResponse } from 'next/server';

export type AdminAuthInfo = {
    token: string;
    isDemo: boolean;
    id: string;
    email?: string;
};

function getBearerToken(request: Request): string | null {
    const raw = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!raw) return null;

    const match = raw.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;

    return match[1].trim();
}

function parseAdminToken(token: string): AdminAuthInfo | null {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const parts = decoded.split(':');
        if (parts.length < 2) return null;

        const id = parts[0];
        const email = parts[1];

        return {
            token,
            isDemo: id === 'demo',
            id,
            email,
        };
    } catch {
        return null;
    }
}

export function getAdminAuthFromRequest(request: Request): AdminAuthInfo | null {
    const token = getBearerToken(request);
    if (!token) return null;

    return parseAdminToken(token);
}

export function requireAdminAuth(request: Request) {
    const auth = getAdminAuthFromRequest(request);
    if (!auth) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    return { ok: true as const, auth };
}

export function requireAdminWriteAccess(request: Request): NextResponse | null {
    const result = requireAdminAuth(request);
    if (!result.ok) return result.response;

    if (result.auth.isDemo) {
        return NextResponse.json({ error: 'Demo admin is read-only' }, { status: 403 });
    }

    return null;
}
