export function getPrimaryVehicleImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) return null;

    const raw = String(imageUrl).trim();
    if (!raw) return null;

    const first = raw
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)[0];

    return first || null;
}
