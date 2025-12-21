// ============================================
// Comparison Table Component
// Side-by-side vehicle spec comparison
// ============================================

'use client';

import { CheckCircle, XCircle, Minus } from 'lucide-react';
import { ComparisonResult, ComparisonCategory } from '@/types/vehicle';
import { clsx } from 'clsx';
import { useSettings } from '@/context/SettingsContext';

interface ComparisonTableProps {
    comparison: ComparisonResult;
    className?: string;
}

/**
 * Format a value with its unit
 */
function formatValue(value: string | number | null, unit?: string): string {
    if (value === null || value === undefined) return '—';

    if (typeof value === 'number') {
        // Format large numbers with commas
        const formatted = value.toLocaleString();
        return unit ? `${formatted} ${unit}` : formatted;
    }

    return unit ? `${value} ${unit}` : String(value);
}

/**
 * Get winner indicator
 */
export function ComparisonTable({ comparison, className }: ComparisonTableProps) {
    const { vehicles, categories } = comparison;
    const { settings } = useSettings();

    // Group categories by type
    const performanceCategories = categories.filter(c =>
        ['Horsepower', 'Torque', 'Engine Size'].includes(c.name)
    );
    const fuelCategories = categories.filter(c =>
        c.name.includes('MPG')
    );
    const capacityCategories = categories.filter(c =>
        ['Seating', 'Towing Capacity', 'Payload'].includes(c.name)
    );
    const otherCategories = categories.filter(c =>
        !performanceCategories.includes(c) &&
        !fuelCategories.includes(c) &&
        !capacityCategories.includes(c)
    );

    const renderCategoryGroup = (title: string, items: ComparisonCategory[]) => {
        if (items.length === 0) return null;

        return (
            <div className="mb-6">
                <h3
                    className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3 px-4 border-l-4 pl-2"
                    style={{ borderLeftColor: settings.primaryColor }}
                >
                    {title}
                </h3>
                <div className="space-y-0 text-black">
                    {items.map((category, index) => (
                        <div
                            key={category.name}
                            className={clsx(
                                'grid gap-4 px-4 py-3 border-b border-gray-200',
                                'transition-colors hover:bg-yellow-50',
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            )}
                            style={{ gridTemplateColumns: `1fr repeat(${vehicles.length}, 120px)` }}
                        >
                            {/* Category name */}
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-lg flex-shrink-0 text-black">{category.icon}</span>
                                <span className="text-black font-bold uppercase text-xs truncate">{category.name}</span>
                            </div>

                            {/* Vehicle Values */}
                            {vehicles.map(vehicle => {
                                const isWinner = category.winner === vehicle.id;
                                const isTie = category.winner === 'tie';
                                const val = category.values[vehicle.id];

                                return (
                                    <div key={vehicle.id} className={clsx(
                                        'flex items-center justify-end gap-2',
                                        isWinner && 'text-green-600 font-bold',
                                        (category.winner === null || isTie) && 'text-gray-400',
                                        !isWinner && !isTie && category.winner && 'text-gray-500'
                                    )}>
                                        <WinnerIndicator winner={category.winner === vehicle.id ? vehicle.id : (isTie ? 'tie' : null)} side={vehicle.id} />
                                        <span className="truncate font-mono font-medium">{formatValue(val, category.unit)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={clsx(
            'neo-card overflow-hidden', // Neo card wrapper
            'overflow-x-auto',
            className
        )}>
            <div className="min-w-fit">
                {/* Header */}
                <div
                    className="grid gap-4 px-4 py-4 border-b-2 border-black"
                    style={{
                        gridTemplateColumns: `1fr repeat(${vehicles.length}, 120px)`,
                        backgroundColor: settings.primaryColor
                    }}
                >
                    <div className="text-sm font-black uppercase text-black">Specification</div>
                    {vehicles.map(vehicle => (
                        <div key={vehicle.id} className="text-sm font-black text-black text-right truncate" title={`${vehicle.make} ${vehicle.model}`}>
                            {vehicle.make} {vehicle.model}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="p-4 bg-white">
                    {renderCategoryGroup('Performance', performanceCategories)}
                    {renderCategoryGroup('Fuel Economy', fuelCategories)}
                    {renderCategoryGroup('Capacity', capacityCategories)}
                    {renderCategoryGroup('Other', otherCategories)}
                </div>

                {/* Footer with legend */}
                <div className="px-4 py-3 bg-gray-100 border-t-2 border-black sticky left-0">
                    <div className="flex items-center justify-center gap-6 text-xs text-gray-500 font-bold uppercase">
                        <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Better</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Minus className="w-4 h-4 text-gray-500" />
                            <span>Tie</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-400">—</span>
                            <span>Not Available</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function WinnerIndicator({ winner, side }: { winner: string | 'tie' | null; side: string }) {
    if (winner === null) return null;

    if (winner === 'tie') {
        return <Minus className="w-4 h-4 text-gray-400" />;
    }

    if (winner === side) {
        return <CheckCircle className="w-5 h-5 text-green-600 fill-green-100" />;
    }

    return null;
}
