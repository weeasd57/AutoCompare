// ============================================
// Fuzzy Search Service - Vehicle Autocomplete
// Uses Fuse.js for intelligent matching
// ============================================

import Fuse, { IFuseOptions } from 'fuse.js';
import type { VehicleSuggestion, VehicleMake, VehicleModel } from '@/types/vehicle';
import { getAvailableYears } from './vpic';

// Fuse.js configuration for optimal vehicle search
const FUSE_OPTIONS: IFuseOptions<VehicleSuggestion> = {
    // Which keys to search in
    keys: [
        { name: 'displayName', weight: 0.5 },
        { name: 'make', weight: 0.3 },
        { name: 'model', weight: 0.4 },
    ],
    // Fuzzy matching settings
    threshold: 0.4, // 0 = exact match, 1 = match anything
    distance: 100, // How close the match must be to the pattern
    minMatchCharLength: 2,
    includeScore: true,
    shouldSort: true,
    findAllMatches: true,
    ignoreLocation: true, // Search entire string, not just beginning
};

// Search instance
let fuseInstance: Fuse<VehicleSuggestion> | null = null;

/**
 * Initialize the search index with vehicle data
 * Should be called with data from VPIC API
 */
export function initializeSearchIndex(
    makes: VehicleMake[],
    modelsByMake: Map<string, VehicleModel[]>
): void {
    const years = getAvailableYears();
    const suggestions: VehicleSuggestion[] = [];

    // Build suggestions from makes, models, and years
    for (const make of makes) {
        const models = modelsByMake.get(make.makeName) || [];

        for (const model of models) {
            for (const year of years) {
                const displayName = `${make.makeName} ${model.modelName} ${year}`;
                const id = `${make.makeName}-${model.modelName}-${year}`
                    .toLowerCase()
                    .replace(/\s+/g, '-');

                suggestions.push({
                    id,
                    displayName,
                    make: make.makeName,
                    model: model.modelName,
                    year,
                });
            }
        }
    }

    fuseInstance = new Fuse(suggestions, FUSE_OPTIONS);
}

/**
 * Search vehicles with fuzzy matching
 * Returns ranked suggestions based on query
 *
 * @param query - Search query (e.g., "maver", "ford f150")
 * @param limit - Maximum number of results (default: 10)
 * @returns Ranked list of vehicle suggestions
 */
export function searchVehicles(query: string, limit: number = 10): VehicleSuggestion[] {
    if (!query || query.length < 2) {
        return [];
    }

    // If no index is initialized, return empty
    if (!fuseInstance) {
        console.warn('Search index not initialized. Call initializeSearchIndex first.');
        return [];
    }

    // Perform fuzzy search
    const results = fuseInstance.search(query, { limit });

    // Map results to suggestions with scores
    return results.map((result) => ({
        ...result.item,
        score: result.score,
    }));
}

/**
 * Quick search for common makes (pre-populated list)
 * Used when cache is not yet loaded
 */
const POPULAR_MAKES = [
    'Toyota',
    'Honda',
    'Ford',
    'Chevrolet',
    'Nissan',
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Lexus',
    'Hyundai',
    'Kia',
    'Volkswagen',
    'Subaru',
    'Mazda',
    'Jeep',
    'Ram',
    'GMC',
    'Dodge',
    'Tesla',
    'Porsche',
];

const POPULAR_MODELS: Record<string, string[]> = {
    Toyota: ['Camry', 'Corolla', 'RAV4', 'Tacoma', 'Highlander', 'Tundra', '4Runner'],
    Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Ridgeline'],
    Ford: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Bronco', 'Maverick', 'Ranger'],
    Chevrolet: ['Silverado', 'Camaro', 'Equinox', 'Tahoe', 'Traverse', 'Colorado'],
    Nissan: ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Frontier', 'Titan'],
    BMW: ['3 Series', '5 Series', 'X3', 'X5', 'X7', 'M3', 'M5'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'AMG GT'],
    Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
};

/**
 * Generate suggestions from popular vehicles
 * Used as fallback when full cache isn't loaded
 */
export function getPopularSuggestions(query: string, limit: number = 10): VehicleSuggestion[] {
    const queryLower = query.toLowerCase();
    const years = getAvailableYears().slice(0, 5); // Last 5 years
    const suggestions: VehicleSuggestion[] = [];

    for (const make of POPULAR_MAKES) {
        const models = POPULAR_MODELS[make] || [];

        for (const model of models) {
            for (const year of years) {
                const displayName = `${make} ${model} ${year}`;
                const displayNameLower = displayName.toLowerCase();

                // Check if query matches
                if (
                    displayNameLower.includes(queryLower) ||
                    levenshteinDistance(queryLower, make.toLowerCase()) <= 2 ||
                    levenshteinDistance(queryLower, model.toLowerCase()) <= 2
                ) {
                    const id = `${make}-${model}-${year}`.toLowerCase().replace(/\s+/g, '-');

                    suggestions.push({
                        id,
                        displayName,
                        make,
                        model,
                        year,
                    });
                }
            }
        }
    }

    // Sort by relevance (simple string matching score)
    suggestions.sort((a, b) => {
        const aScore = calculateMatchScore(queryLower, a);
        const bScore = calculateMatchScore(queryLower, b);
        return bScore - aScore;
    });

    return suggestions.slice(0, limit);
}

/**
 * Calculate simple match score for sorting
 */
function calculateMatchScore(query: string, suggestion: VehicleSuggestion): number {
    let score = 0;
    const displayLower = suggestion.displayName.toLowerCase();
    const makeLower = suggestion.make.toLowerCase();
    const modelLower = suggestion.model.toLowerCase();

    // Exact match in display name
    if (displayLower.includes(query)) score += 100;

    // Starts with query
    if (makeLower.startsWith(query)) score += 50;
    if (modelLower.startsWith(query)) score += 50;

    // Contains query
    if (makeLower.includes(query)) score += 25;
    if (modelLower.includes(query)) score += 25;

    // Prefer newer years
    score += (suggestion.year - 2020) * 2;

    return score;
}

/**
 * Levenshtein distance for fuzzy matching fallback
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Highlight matched text in suggestion
 * Returns HTML string with <mark> tags
 */
export function highlightMatch(text: string, query: string): string {
    if (!query) return text;

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
