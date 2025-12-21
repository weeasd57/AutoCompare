export function getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem('admin_token');
    } catch {
        return null;
    }
}

export function getAdminAuthHeaders(): Record<string, string> {
    const token = getAdminToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

export function isDemoAdminToken(token?: string | null): boolean {
    if (!token) return false;
    try {
        const decoded = atob(token);
        return decoded.startsWith('demo:');
    } catch {
        return false;
    }
}

export function isDemoAdmin(): boolean {
    return isDemoAdminToken(getAdminToken());
}
