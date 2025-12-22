// ============================================
// Advanced Filters Component
// Filter vehicles by price, year, body type, fuel type
// ============================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import type { NormalizedSpec } from '@/types/vehicle';

export interface FilterState {
    priceMin: number | null;
    priceMax: number | null;
    yearMin: number | null;
    yearMax: number | null;
    bodyStyles: string[];
    fuelTypes: string[];
    drivetrains: string[];
}

const FILTERS_CLASSES = {
    badgeBase: 'px-2 py-1 text-xs font-bold border border-black',
    badgeActive: 'bg-black text-white',
    badgeInactive: 'bg-white hover:bg-gray-100',
};

interface AdvancedFiltersProps {
    vehicles: NormalizedSpec[];
    onFilter: (filtered: NormalizedSpec[]) => void;
    className?: string;
}

const defaultFilters: FilterState = {
    priceMin: null,
    priceMax: null,
    yearMin: null,
    yearMax: null,
    bodyStyles: [],
    fuelTypes: [],
    drivetrains: [],
};

/**
 * AdvancedFilters Component
 * Provides filtering options for vehicle list
 */
export function AdvancedFilters({ vehicles, onFilter, className }: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [activeCount, setActiveCount] = useState(0);

    // Extract unique values from vehicles
    const options = useMemo(() => {
        const bodyStyles = Array.from(
            new Set(vehicles.map((v) => v.bodyStyle).filter(Boolean))
        ) as string[];
        const fuelTypes = Array.from(
            new Set(vehicles.map((v) => v.fuelType).filter(Boolean))
        ) as string[];
        const drivetrains = Array.from(
            new Set(vehicles.map((v) => v.drivetrain).filter(Boolean))
        ) as string[];

        const prices = vehicles.map((v) => v.basePrice).filter(Boolean) as number[];
        const years = vehicles.map((v) => v.year).filter(Boolean) as number[];

        return {
            bodyStyles: bodyStyles.sort(),
            fuelTypes: fuelTypes.sort(),
            drivetrains: drivetrains.sort(),
            minPrice: Math.min(...prices, 0),
            maxPrice: Math.max(...prices, 100000),
            minYear: Math.min(...years, 2000),
            maxYear: Math.max(...years, new Date().getFullYear()),
        };
    }, [vehicles]);

    // Apply filters
    useEffect(() => {
        let filtered = [...vehicles];

        // Price filter
        if (filters.priceMin !== null) {
            filtered = filtered.filter((v) => (v.basePrice || 0) >= filters.priceMin!);
        }
        if (filters.priceMax !== null) {
            filtered = filtered.filter((v) => (v.basePrice || 0) <= filters.priceMax!);
        }

        // Year filter
        if (filters.yearMin !== null) {
            filtered = filtered.filter((v) => v.year >= filters.yearMin!);
        }
        if (filters.yearMax !== null) {
            filtered = filtered.filter((v) => v.year <= filters.yearMax!);
        }

        // Body style filter
        if (filters.bodyStyles.length > 0) {
            filtered = filtered.filter(
                (v) => v.bodyStyle && filters.bodyStyles.includes(v.bodyStyle)
            );
        }

        // Fuel type filter
        if (filters.fuelTypes.length > 0) {
            filtered = filtered.filter((v) => v.fuelType && filters.fuelTypes.includes(v.fuelType));
        }

        // Drivetrain filter
        if (filters.drivetrains.length > 0) {
            filtered = filtered.filter(
                (v) => v.drivetrain && filters.drivetrains.includes(v.drivetrain)
            );
        }

        // Count active filters
        let count = 0;
        if (filters.priceMin !== null) count++;
        if (filters.priceMax !== null) count++;
        if (filters.yearMin !== null) count++;
        if (filters.yearMax !== null) count++;
        count += filters.bodyStyles.length;
        count += filters.fuelTypes.length;
        count += filters.drivetrains.length;
        setActiveCount(count);

        onFilter(filtered);
    }, [filters, vehicles, onFilter]);

    const handleReset = () => {
        setFilters(defaultFilters);
    };

    const toggleArrayFilter = (key: 'bodyStyles' | 'fuelTypes' | 'drivetrains', value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter((v) => v !== value)
                : [...prev[key], value],
        }));
    };

    return (
        <div className={clsx('relative', className)}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'flex items-center gap-2 px-4 py-2 font-bold uppercase text-sm',
                    'border-2 border-black transition-all',
                    'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    'hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
                    isOpen || activeCount > 0 ? 'bg-yellow-400' : 'bg-white'
                )}
            >
                <Filter className="w-4 h-4" />
                Filters
                {activeCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-black text-white text-xs rounded">
                        {activeCount}
                    </span>
                )}
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Filters Panel */}
            {isOpen && (
                <>
                    <div
                        role="button"
                        tabIndex={0}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') setIsOpen(false);
                        }}
                        aria-label="Close filters"
                    />

                    <div className="absolute left-0 top-full mt-2 w-80 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b-2 border-black bg-yellow-400">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                <span className="font-black uppercase">Filters</span>
                            </div>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1 text-sm font-bold hover:underline"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
                            {/* Price Range */}
                            <div>
                                <span className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                    Price Range
                                </span>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.priceMin || ''}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                priceMin: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            }))
                                        }
                                        className="w-full px-2 py-1.5 text-sm border-2 border-black"
                                    />
                                    <span className="self-center">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.priceMax || ''}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                priceMax: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            }))
                                        }
                                        className="w-full px-2 py-1.5 text-sm border-2 border-black"
                                    />
                                </div>
                            </div>

                            {/* Year Range */}
                            <div>
                                <span className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                    Year Range
                                </span>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="From"
                                        value={filters.yearMin || ''}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                yearMin: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            }))
                                        }
                                        className="w-full px-2 py-1.5 text-sm border-2 border-black"
                                    />
                                    <span className="self-center">-</span>
                                    <input
                                        type="number"
                                        placeholder="To"
                                        value={filters.yearMax || ''}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                yearMax: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            }))
                                        }
                                        className="w-full px-2 py-1.5 text-sm border-2 border-black"
                                    />
                                </div>
                            </div>

                            {/* Body Style */}
                            {options.bodyStyles.length > 0 && (
                                <div>
                                    <span className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                        Body Style
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {options.bodyStyles.map((style) => (
                                            <button
                                                key={style}
                                                onClick={() =>
                                                    toggleArrayFilter('bodyStyles', style)
                                                }
                                                className={clsx(
                                                    FILTERS_CLASSES.badgeBase,
                                                    filters.bodyStyles.includes(style)
                                                        ? FILTERS_CLASSES.badgeActive
                                                        : FILTERS_CLASSES.badgeInactive
                                                )}
                                            >
                                                {style}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fuel Type */}
                            {options.fuelTypes.length > 0 && (
                                <div>
                                    <span className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                        Fuel Type
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {options.fuelTypes.map((fuel) => (
                                            <button
                                                key={fuel}
                                                onClick={() => toggleArrayFilter('fuelTypes', fuel)}
                                                className={clsx(
                                                    FILTERS_CLASSES.badgeBase,
                                                    filters.fuelTypes.includes(fuel)
                                                        ? FILTERS_CLASSES.badgeActive
                                                        : FILTERS_CLASSES.badgeInactive
                                                )}
                                            >
                                                {fuel}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Drivetrain */}
                            {options.drivetrains.length > 0 && (
                                <div>
                                    <span className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                        Drivetrain
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                        {options.drivetrains.map((drive) => (
                                            <button
                                                key={drive}
                                                onClick={() =>
                                                    toggleArrayFilter('drivetrains', drive)
                                                }
                                                className={clsx(
                                                    FILTERS_CLASSES.badgeBase,
                                                    filters.drivetrains.includes(drive)
                                                        ? FILTERS_CLASSES.badgeActive
                                                        : FILTERS_CLASSES.badgeInactive
                                                )}
                                            >
                                                {drive}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t-2 border-black bg-gray-50">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2 bg-black text-white font-bold uppercase text-sm"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
