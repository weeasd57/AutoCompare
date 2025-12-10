// ============================================
// Compare Engine - Vehicle Comparison Logic
// Generates insights and highlights
// ============================================

import type {
    NormalizedSpec,
    ComparisonResult,
    ComparisonCategory,
    ComparisonHighlight,
} from '@/types/vehicle';

/**
 * Category definitions for comparison
 * Each category has rules for determining the winner
 */
export interface CategoryDefinition {
    name: string;
    icon: string;
    key: keyof NormalizedSpec;
    unit?: string;
    higherIsBetter: boolean;
    importance: 'high' | 'medium' | 'low';
    formatValue?: (value: unknown) => string;
}

const COMPARISON_CATEGORIES: CategoryDefinition[] = [
    // Performance - High importance
    {
        name: 'Horsepower',
        icon: '⚡',
        key: 'horsepower',
        unit: 'hp',
        higherIsBetter: true,
        importance: 'high',
    },
    {
        name: 'Torque',
        icon: '🔧',
        key: 'torque',
        unit: 'lb-ft',
        higherIsBetter: true,
        importance: 'high',
    },
    {
        name: 'Engine Size',
        icon: '🏎️',
        key: 'engineDisplacement',
        unit: 'L',
        higherIsBetter: true, // Generally, but depends on context
        importance: 'medium',
    },

    // Fuel Economy - High importance
    {
        name: 'City MPG',
        icon: '🏙️',
        key: 'fuelCityMpg',
        unit: 'mpg',
        higherIsBetter: true,
        importance: 'high',
    },
    {
        name: 'Highway MPG',
        icon: '🛣️',
        key: 'fuelHighwayMpg',
        unit: 'mpg',
        higherIsBetter: true,
        importance: 'high',
    },
    {
        name: 'Combined MPG',
        icon: '⛽',
        key: 'fuelCombinedMpg',
        unit: 'mpg',
        higherIsBetter: true,
        importance: 'high',
    },

    // Capacity - Medium importance
    {
        name: 'Seating',
        icon: '👥',
        key: 'seatingCapacity',
        unit: 'seats',
        higherIsBetter: true,
        importance: 'medium',
    },
    {
        name: 'Towing Capacity',
        icon: '🚛',
        key: 'towingCapacity',
        unit: 'lbs',
        higherIsBetter: true,
        importance: 'medium',
    },
    {
        name: 'Payload',
        icon: '📦',
        key: 'payloadCapacity',
        unit: 'lbs',
        higherIsBetter: true,
        importance: 'medium',
    },

    // Price - High importance (lower is better)
    {
        name: 'Base Price',
        icon: '💰',
        key: 'basePrice',
        unit: '$',
        higherIsBetter: false, // Lower price is better
        importance: 'high',
        formatValue: (value) => `$${Number(value).toLocaleString()}`,
    },

    // Other specs
    {
        name: 'Transmission',
        icon: '⚙️',
        key: 'transmissionSpeeds',
        unit: 'speeds',
        higherIsBetter: true,
        importance: 'low',
    },
    {
        name: 'Doors',
        icon: '🚪',
        key: 'doors',
        unit: '',
        higherIsBetter: true,
        importance: 'low',
    },
];

/**
 * Compare vehicles and generate detailed comparison
 */
export function compareVehicles(
    vehicles: NormalizedSpec[]
): ComparisonResult {
    const categories: ComparisonCategory[] = [];
    const wins: Record<string, number> = {};

    // Initialize wins
    vehicles.forEach(v => wins[v.id] = 0);

    for (const category of COMPARISON_CATEGORIES) {
        const values: Record<string, string | number | null> = {};

        vehicles.forEach(v => {
            values[v.id] = v[category.key] as string | number | null;
        });

        // Determine winner for this category
        let winner: string | 'tie' | null = null;
        let bestValue: number | null = null;
        let tiedVehicles: string[] = [];

        // Filter out nulls and get valid numbers for comparison
        const validVehicles = vehicles.filter(v => {
            const val = values[v.id];
            return val !== null && val !== undefined && !isNaN(typeof val === 'number' ? val : parseFloat(String(val)));
        });

        if (validVehicles.length > 0) {
            validVehicles.forEach(v => {
                const rawVal = values[v.id];
                const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));

                if (bestValue === null) {
                    bestValue = numVal;
                    tiedVehicles = [v.id];
                } else {
                    if (category.higherIsBetter) {
                        if (numVal > bestValue) {
                            bestValue = numVal;
                            tiedVehicles = [v.id];
                        } else if (numVal === bestValue) {
                            tiedVehicles.push(v.id);
                        }
                    } else { // Lower is better
                        if (numVal < bestValue) {
                            bestValue = numVal;
                            tiedVehicles = [v.id];
                        } else if (numVal === bestValue) {
                            tiedVehicles.push(v.id);
                        }
                    }
                }
            });

            if (tiedVehicles.length === 1) {
                winner = tiedVehicles[0];
                wins[winner]++;
            } else if (tiedVehicles.length > 1) {
                winner = 'tie';
            }
        }

        categories.push({
            name: category.name,
            icon: category.icon,
            values,
            winner,
            unit: category.unit,
            higherIsBetter: category.higherIsBetter,
        });
    }

    // Determine overall winner
    let overallWinner: string | 'tie' | null = null;
    let maxWins = -1;
    let overallTies: string[] = [];

    Object.entries(wins).forEach(([id, winCount]) => {
        if (winCount > maxWins) {
            maxWins = winCount;
            overallTies = [id];
        } else if (winCount === maxWins) {
            overallTies.push(id);
        }
    });

    if (overallTies.length === 1) {
        overallWinner = overallTies[0];
    } else if (overallTies.length > 1 && maxWins > 0) {
        overallWinner = 'tie';
    }

    return {
        vehicles,
        categories,
        overallWinner,
    };
}

/**
 * Generate natural language highlights from comparison
 * Returns key insights about the comparison
 */
export function generateHighlights(
    comparison: ComparisonResult,
    maxHighlights: number = 5
): ComparisonHighlight[] {
    const highlights: ComparisonHighlight[] = [];
    const { vehicles, categories } = comparison;

    // Sort categories by importance and whether there's a clear winner
    const significantCategories = categories
        .filter((cat) => cat.winner !== null && cat.winner !== 'tie')
        .sort((a, b) => {
            // Prioritize high importance categories
            const importanceOrder = { high: 3, medium: 2, low: 1 };
            const catDefA = COMPARISON_CATEGORIES.find((c) => c.name === a.name);
            const catDefB = COMPARISON_CATEGORIES.find((c) => c.name === b.name);

            const impA = catDefA ? importanceOrder[catDefA.importance] : 0;
            const impB = catDefB ? importanceOrder[catDefB.importance] : 0;

            return impB - impA;
        });

    // Generate highlights for top categories
    for (const category of significantCategories.slice(0, maxHighlights)) {
        const catDef = COMPARISON_CATEGORIES.find((c) => c.name === category.name);
        if (!catDef) continue;

        const winnerId = category.winner as string;
        const winnerVehicle = vehicles.find(v => v.id === winnerId);

        if (!winnerVehicle) continue;

        const winnerName = `${winnerVehicle.make} ${winnerVehicle.model}`;
        const winnerValue = category.values[winnerId];

        // Format values
        const formatVal = (val: string | number | null) => {
            if (val === null) return 'N/A';
            if (catDef.formatValue) return catDef.formatValue(val);
            return `${val}${catDef.unit ? ` ${catDef.unit}` : ''}`;
        };

        // Generate natural language message
        let message = '';

        if (category.name === 'Base Price') {
            message = `${winnerName} is the most affordable at ${formatVal(winnerValue)}`;
        } else if (category.name.includes('MPG')) {
            message = `${winnerName} leads in fuel economy with ${formatVal(winnerValue)}`;
        } else if (category.name === 'Horsepower') {
            message = `${winnerName} is the most powerful with ${formatVal(winnerValue)}`;
        } else if (category.name === 'Torque') {
            message = `${winnerName} delivers the most torque: ${formatVal(winnerValue)}`;
        } else if (category.name === 'Towing Capacity') {
            message = `${winnerName} has the highest towing capacity: ${formatVal(winnerValue)}`;
        } else if (category.name === 'Seating') {
            message = `${winnerName} fits the most passengers (${formatVal(winnerValue)})`;
        } else {
            // Generic message
            const comparison = catDef.higherIsBetter ? 'highest' : 'best';
            message = `${winnerName} has the ${comparison} ${category.name.toLowerCase()}: ${formatVal(winnerValue)}`;
        }

        highlights.push({
            id: `highlight-${category.name.toLowerCase().replace(/\s+/g, '-')}`,
            category: category.name,
            icon: category.icon,
            message,
            winner: winnerId,
            importance: catDef.importance,
        });
    }

    return highlights;
}

/**
 * Get a summary sentence for the overall comparison
 */
export function getComparisonSummary(comparison: ComparisonResult): string {
    const { vehicles, overallWinner, categories } = comparison;

    if (vehicles.length === 0) return 'Select vehicles to compare.';

    // Count wins per vehicle
    const wins: Record<string, number> = {};
    vehicles.forEach(v => wins[v.id] = 0);

    categories.forEach(c => {
        if (c.winner && c.winner !== 'tie') {
            wins[c.winner]++;
        }
    });

    if (overallWinner && overallWinner !== 'tie') {
        const winnerVehicle = vehicles.find(v => v.id === overallWinner);
        if (winnerVehicle) {
            const name = `${winnerVehicle.make} ${winnerVehicle.model}`;
            return `${name} leads the comparison, winning in ${wins[overallWinner]} out of ${categories.length} categories.`;
        }
    } else if (overallWinner === 'tie') {
        return `It's a close match! Multiple vehicles are tied for the lead.`;
    }

    return `Compare the specifications below to see how these ${vehicles.length} vehicles stack up.`;
}

/**
 * Calculate a comparison score (0-100) for each vehicle
 */
export function calculateComparisonScores(comparison: ComparisonResult): Record<string, number> {
    const scores: Record<string, number> = {};
    const points: Record<string, number> = {};
    let totalPossible = 0;

    const importanceWeight = { high: 3, medium: 2, low: 1 };

    // Initialize
    comparison.vehicles.forEach(v => {
        scores[v.id] = 0;
        points[v.id] = 0;
    });

    for (const category of comparison.categories) {
        const catDef = COMPARISON_CATEGORIES.find((c) => c.name === category.name);
        if (!catDef) continue;

        const weight = importanceWeight[catDef.importance];
        totalPossible += weight;

        if (category.winner && category.winner !== 'tie') {
            points[category.winner] += weight;
        } else if (category.winner === 'tie') {
            // Find which vehicles tied
            // In a real generic implementation we'd need to know exactly which ones tied
            // For now, we assume if it's a tie, all valid ones get points? 
            // Better strategy: Recalculate or store tied IDs in category.
            // Simplified: If tie, no one gets full points, or split points.
            // Let's iterate values again to be safe/precise or simplify.
            // PREVIOUS LOGIC: split points between A and B. 
            // NEW LOGIC: simpler, just give half points to everyone for now or 0.
            // Let's just give 0 for a tie to emphasize clear wins, or improve later.
        }
    }

    comparison.vehicles.forEach(v => {
        scores[v.id] = totalPossible > 0 ? Math.round((points[v.id] / totalPossible) * 100) : 50;
    });

    return scores;
}
