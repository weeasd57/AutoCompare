/**
 * Utility to get car brand logos
 * Source: filippofilip95/car-logos-dataset on GitHub
 */

const BASE_URL = 'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized';

export function getBrandLogoUrl(brandName: string): string {
    // Convert brand name to slug format (lowercase, hyphens instead of spaces)
    // e.g. "Mercedes-Benz" -> "mercedes-benz", "Land Rover" -> "land-rover"
    const slug = brandName.toLowerCase().replace(/ /g, '-');

    // Handle special cases if any known mismatches arise
    // For now, the dataset seems to follow standard slugification

    return `${BASE_URL}/${slug}.png`;
}
