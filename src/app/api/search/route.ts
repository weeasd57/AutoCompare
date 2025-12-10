// ============================================
// Search API Route - Vehicle Autocomplete
// GET /api/search?q=query
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getPopularSuggestions } from '@/lib/fuzzy-search';
import { getModelsForMake, getAllMakes } from '@/lib/vpic';

/**
 * Cache for makes data
 */
let makesCache: { makeName: string; makeId: number }[] | null = null;
let makesCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * GET /api/search
 * Search for vehicles with fuzzy matching
 * 
 * Query params:
 * - q: Search query (required)
 * - limit: Max results (optional, default 10)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        // Validate query
        if (!query || query.length < 2) {
            return NextResponse.json(
                { suggestions: [], message: 'Query must be at least 2 characters' },
                { status: 200 }
            );
        }

        // Use popular suggestions for fast response
        // This provides instant results while full VPIC search could be slow
        const suggestions = getPopularSuggestions(query, limit);

        // If we have cached makes, also search them
        if (makesCache && Date.now() - makesCacheTime < CACHE_DURATION) {
            // Search in cached makes
            const queryLower = query.toLowerCase();
            const matchedMakes = makesCache
                .filter((m) => m.makeName.toLowerCase().includes(queryLower))
                .slice(0, 5);

            // Add matched makes as suggestions if not already included
            for (const make of matchedMakes) {
                const exists = suggestions.some(
                    (s) => s.make.toLowerCase() === make.makeName.toLowerCase()
                );
                if (!exists && suggestions.length < limit) {
                    suggestions.push({
                        id: `${make.makeName}-select-model`.toLowerCase().replace(/\s+/g, '-'),
                        displayName: `${make.makeName} (Select Model)`,
                        make: make.makeName,
                        model: '',
                        year: new Date().getFullYear(),
                    });
                }
            }
        }

        return NextResponse.json({
            suggestions,
            query,
            count: suggestions.length,
        });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json(
            { error: 'Search failed', suggestions: [] },
            { status: 500 }
        );
    }
}

/**
 * POST /api/search
 * Initialize or refresh the makes cache
 * This can be called on app startup
 */
export async function POST() {
    try {
        // Refresh makes cache
        const makes = await getAllMakes();
        makesCache = makes;
        makesCacheTime = Date.now();

        return NextResponse.json({
            success: true,
            makesCount: makes.length,
            message: 'Search index updated',
        });

    } catch (error) {
        console.error('Failed to refresh search cache:', error);
        return NextResponse.json(
            { error: 'Failed to update search index' },
            { status: 500 }
        );
    }
}
