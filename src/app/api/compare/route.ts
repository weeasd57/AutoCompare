// ============================================
// Compare API Route - Vehicle Comparison
// POST /api/compare
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { compareVehicles, generateHighlights, getComparisonSummary, calculateComparisonScore } from '@/lib/compare-engine';
import type { NormalizedSpec } from '@/types/vehicle';

/**
 * POST /api/compare
 * Compare two vehicles and generate insights
 * 
 * Request body:
 * - vehicleA: NormalizedSpec
 * - vehicleB: NormalizedSpec
 * 
 * OR
 * 
 * - vehicleAId: string (vehicle ID to fetch)
 * - vehicleBId: string (vehicle ID to fetch)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        let vehicleA: NormalizedSpec;
        let vehicleB: NormalizedSpec;

        // Check if full specs are provided
        if (body.vehicleA && body.vehicleB) {
            vehicleA = body.vehicleA as NormalizedSpec;
            vehicleB = body.vehicleB as NormalizedSpec;
        }
        // Or if IDs are provided, fetch them
        else if (body.vehicleAId && body.vehicleBId) {
            const baseUrl = request.nextUrl.origin;

            // Fetch vehicle A
            const responseA = await fetch(`${baseUrl}/api/vehicle/${body.vehicleAId}`);
            if (!responseA.ok) {
                return NextResponse.json(
                    { error: `Vehicle A not found: ${body.vehicleAId}` },
                    { status: 404 }
                );
            }
            const dataA = await responseA.json();
            vehicleA = dataA.specs;

            // Fetch vehicle B
            const responseB = await fetch(`${baseUrl}/api/vehicle/${body.vehicleBId}`);
            if (!responseB.ok) {
                return NextResponse.json(
                    { error: `Vehicle B not found: ${body.vehicleBId}` },
                    { status: 404 }
                );
            }
            const dataB = await responseB.json();
            vehicleB = dataB.specs;
        }
        else {
            return NextResponse.json(
                { error: 'Please provide vehicleA/vehicleB or vehicleAId/vehicleBId' },
                { status: 400 }
            );
        }

        // Validate vehicles
        if (!vehicleA.id || !vehicleB.id) {
            return NextResponse.json(
                { error: 'Invalid vehicle data' },
                { status: 400 }
            );
        }

        // Run comparison
        const comparison = compareVehicles(vehicleA, vehicleB);

        // Generate highlights
        const maxHighlights = body.maxHighlights || 5;
        const highlights = generateHighlights(comparison, maxHighlights);

        // Get summary
        const summary = getComparisonSummary(comparison);

        // Calculate scores
        const scores = calculateComparisonScore(comparison);

        return NextResponse.json({
            comparison,
            highlights,
            summary,
            scores,
            vehicleA: {
                id: vehicleA.id,
                name: `${vehicleA.make} ${vehicleA.model} ${vehicleA.year}`,
            },
            vehicleB: {
                id: vehicleB.id,
                name: `${vehicleB.make} ${vehicleB.model} ${vehicleB.year}`,
            },
        });

    } catch (error) {
        console.error('Compare API error:', error);
        return NextResponse.json(
            { error: 'Failed to compare vehicles' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/compare
 * Quick comparison with query parameters
 * 
 * Query params:
 * - a: Vehicle A ID
 * - b: Vehicle B ID
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const vehicleAId = searchParams.get('a');
        const vehicleBId = searchParams.get('b');

        if (!vehicleAId || !vehicleBId) {
            return NextResponse.json(
                { error: 'Please provide both vehicle IDs (a and b)' },
                { status: 400 }
            );
        }

        // Redirect to POST handler with IDs
        const baseUrl = request.nextUrl.origin;
        const response = await fetch(`${baseUrl}/api/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vehicleAId, vehicleBId }),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });

    } catch (error) {
        console.error('Compare API GET error:', error);
        return NextResponse.json(
            { error: 'Failed to compare vehicles' },
            { status: 500 }
        );
    }
}
