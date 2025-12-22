// ============================================
// Insights Panel Component
// Displays AI-generated comparison highlights
// ============================================

'use client';

import { Sparkles, Trophy } from 'lucide-react';
import { ComparisonHighlight, NormalizedSpec } from '@/types/vehicle';
import { clsx } from 'clsx';
import { useSettings } from '@/context/SettingsContext';

interface InsightsPanelProps {
    highlights: ComparisonHighlight[];
    summary?: string;
    className?: string;
}

/**
 * InsightsPanel Component
 * Shows key insights from the comparison
 */
export function InsightsPanel({ highlights, summary, className }: InsightsPanelProps) {
    const { settings } = useSettings();
    if (highlights.length === 0) {
        return null;
    }

    return (
        <div className={clsx('neo-card', className)}>
            {/* Header */}
            <div
                className="px-6 py-4 border-b-2 border-black"
                style={{ backgroundColor: settings.primaryColor }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_black]">
                        <Sparkles className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase">Key Insights</h2>
                    </div>
                </div>
            </div>

            {/* Summary if provided */}
            {summary && (
                <div className="px-6 py-4 border-b-2 border-black bg-white">
                    <p className="text-black font-medium leading-relaxed font-mono">{summary}</p>
                </div>
            )}

            {/* Highlights list */}
            <div className="p-4 space-y-4 bg-gray-50">
                {highlights.map((highlight, index) => (
                    <div
                        key={highlight.id}
                        className={clsx(
                            'relative p-4 border-2 border-black bg-white',
                            'shadow-[4px_4px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all'
                        )}
                    >
                        {/* Ranking badge */}
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-black text-white flex items-center justify-center font-black border-2 border-white shadow-sm">
                            {index + 1}
                        </div>

                        <div className="flex items-start gap-4">
                            {/* Category icon */}
                            <span className="text-2xl pt-1">{highlight.icon}</span>

                            {/* Insight content */}
                            <div className="flex-1 min-w-0">
                                <p className="text-black font-bold leading-relaxed mb-2">
                                    {highlight.message}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 bg-gray-200 border border-black font-bold uppercase text-black">
                                        {highlight.category}
                                    </span>
                                    {highlight.importance === 'high' && (
                                        <span className="text-xs px-2 py-1 bg-red-500 text-white border border-black font-bold uppercase">
                                            Key Factor
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t-2 border-black">
                <p className="text-xs text-gray-500 text-center font-mono uppercase">
                    Comparison Analysis
                </p>
            </div>
        </div>
    );
}

/**
 * Quick Stats Bar Component
 * Shows winner summary at a glance
 */

export function QuickStats({
    wins,
    className,
    vehicles = [], // Add vehicles prop
}: {
    wins: Record<string, number>;
    className?: string;
    vehicles?: NormalizedSpec[];
}) {
    const { settings } = useSettings();
    // If no wins, showing nothing or empty state
    if (!wins || Object.keys(wins).length === 0) return null;

    return (
        <div
            className={clsx(
                'p-6 neo-card', // Neo card
                className
            )}
            style={{ backgroundColor: settings.primaryColor + '33' }}
        >
            {/* Title */}
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-black" />
                <h3 className="text-xl font-black uppercase text-black">Quick Summary</h3>
            </div>

            {/* Stats Grid */}
            <div className="flex flex-wrap gap-4 items-center justify-center">
                {Object.entries(wins).map(([id, count]) => {
                    // Find actual vehicle object to get proper name
                    const vehicle = vehicles.find((v) => v.id === id);
                    const name = vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : id; // Fallback to ID if not found (shouldn't happen)

                    return (
                        <div
                            key={id}
                            className="text-center px-6 py-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_black]"
                        >
                            <p className="text-3xl font-black text-black">{count}</p>
                            <p className="text-xs font-bold uppercase text-gray-600">{name}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
