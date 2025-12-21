// ============================================
// Compare Page - Vehicle Comparison Results
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Car, Plus } from 'lucide-react';
import { VehicleCard } from '@/components/VehicleCard';
import { ComparisonTable } from '@/components/ComparisonTable';
import { InsightsPanel, QuickStats } from '@/components/InsightsPanel';
import { ExportButton } from '@/components/ExportButton';
import { VehicleSelector } from '@/components/VehicleSelector';
import { ComparisonChart, EconomyChart, PriceChart } from '@/components/ComparisonChart';
import { FavoritesPanel } from '@/components/FavoritesPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useCompareStore } from '@/store/compare-store';
import { useHistoryStore } from '@/store/history-store';
import { clsx } from 'clsx';
import type { NormalizedSpec } from '@/types/vehicle';
import { useSettings } from '@/context/SettingsContext';
import { GoogleAdSlot } from '@/components/GoogleAdSlot';

/**
 * Compare Page Component
 * Displays the comparison results between selected vehicles
 */
export default function ComparePage() {
    const router = useRouter();
    const {
        vehicles,
        comparison,
        highlights,
        isLoading,
        error,
        addVehicle,
        removeVehicle,
        runComparison,
        reset,
    } = useCompareStore();

    const { addToHistory } = useHistoryStore();
    const { settings } = useSettings();

    const [mounted, setMounted] = useState(false);

    const adsenseCompareSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_COMPARE;

    // Handle hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Run comparison if vehicles change
    useEffect(() => {
        if (mounted && vehicles.length >= 2 && !comparison && !isLoading) {
            runComparison();
        }
    }, [mounted, vehicles.length, comparison, isLoading, runComparison]);

    // Save to history when comparison is made
    useEffect(() => {
        if (mounted && comparison && vehicles.length >= 2) {
            addToHistory(vehicles);
        }
    }, [mounted, comparison, vehicles, addToHistory]);

    /**
     * Handle new comparison
     */
    const handleNewComparison = () => {
        reset();
        router.push('/');
    };

    const handleAddVehicle = (vehicle: NormalizedSpec) => {
        addVehicle(vehicle);
    };

    // Show loading skeleton during hydration
    if (!mounted) {
        return <CompareSkeleton />;
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={handleNewComparison} className="btn-primary">
                        Start Over
                    </button>
                </div>
            </div>
        );
    }

    // If no vehicles, redirect or show empty state (though store persistence should prevent this if coming from home)
    if (vehicles.length === 0) {
        // Optionally render empty state with selector
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-white mb-4">Start Comparison</h2>
                <div className="w-full max-w-md">
                    <VehicleSelector onSelect={handleAddVehicle} />
                </div>
            </div>
        );
    }

    // Determine overall winner for stats
    const wins: Record<string, number> = {};
    const ties = comparison?.categories.filter(c => c.winner === 'tie').length || 0;

    if (comparison) {
        comparison.vehicles.forEach(v => wins[v.id] = 0);
        comparison.categories.forEach(c => {
            if (c.winner && c.winner !== 'tie') {
                wins[c.winner] = (wins[c.winner] || 0) + 1;
            }
        });
    }

    // Calculate scores (simplified logic for now or retrieve from engine if added to store)
    // For now we pass undefined scores or implement `calculateComparisonScore` usage

    return (
        <div className="min-h-screen pb-20">
            {/* Page toolbar under global navbar */}
            <header className="border-b-2 border-black dark:border-white bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 md:gap-4">
                    {/* Back button */}
                    <div className="flex items-center gap-2 order-1">
                        <button
                            onClick={handleNewComparison}
                            className="flex items-center gap-2 text-black hover:text-blue-600 font-bold uppercase transition-colors"
                        >
                            <ArrowLeft
                                className="w-6 h-6 border-2 border-black rounded-none p-1 shadow-[2px_2px_0px_0px_black]"
                                style={{ backgroundColor: settings.primaryColor }}
                            />
                            <span className="hidden sm:inline">New Comparison</span>
                        </button>
                    </div>

                    {/* Title */}
                    <div className="order-3 w-full md:order-2 md:w-auto flex justify-center">
                        <div className="flex items-center gap-2 px-4 py-2 bg-black text-white transform -skew-x-12">
                            <Car className="w-5 h-5 transform skew-x-12" style={{ color: settings.primaryColor }} />
                            <span className="font-black uppercase tracking-wider transform skew-x-12 text-sm sm:text-base md:text-sm lg:text-base">
                                {settings.siteName}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto order-2 md:order-3">
                        {/* Desktop favorites/history */}
                        <div className="hidden sm:flex items-center gap-2">
                            <FavoritesPanel />
                            <HistoryPanel />
                        </div>
                        {/* Mobile icons */}
                        <div className="flex sm:hidden items-center gap-1">
                            <FavoritesPanel />
                            <HistoryPanel />
                        </div>
                        <button
                            onClick={() => runComparison()}
                            className="p-2 bg-white dark:bg-gray-800 border-2 border-black dark:border-white hover:bg-yellow-400 text-black dark:text-white transition-all shadow-[2px_2px_0px_0px_black] dark:shadow-[2px_2px_0px_0px_white] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                            title="Refresh comparison"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Vehicle Cards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {vehicles.map(vehicle => {
                        const isWinner = comparison?.overallWinner === vehicle.id;
                        // Score calculation could be better connected, but omitted for brevity
                        return (
                            <div key={vehicle.id} className="relative">
                                <FavoriteButton
                                    vehicle={vehicle}
                                    className="absolute top-2 right-14 z-10"
                                    size="sm"
                                />
                                <VehicleCard
                                    vehicle={vehicle}
                                    isWinner={isWinner}
                                    onRemove={() => removeVehicle(vehicle.id)}
                                />
                            </div>
                        );
                    })}

                    {/* Add Vehicle Button Card */}
                    <div className="min-h-[300px]">
                        <VehicleSelector onSelect={handleAddVehicle} className="h-full" />
                    </div>
                </div>

                {adsenseCompareSlot && (
                    <div className="mb-8">
                        <GoogleAdSlot slot={adsenseCompareSlot} />
                    </div>
                )}

                {/* Quick Stats */}
                {comparison && (
                    <QuickStats
                        wins={wins}
                        vehicles={vehicles}
                        className="mb-8"
                    />
                )}

                {/* Visual Charts */}
                {comparison && (
                    <div className="mb-8 space-y-6">
                        <ComparisonChart vehicles={vehicles} wins={wins} />

                        <div className="grid md:grid-cols-2 gap-6">
                            <EconomyChart vehicles={vehicles} />
                            <PriceChart vehicles={vehicles} />
                        </div>
                    </div>
                )}

                {/* Main comparison grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Comparison Table - 2 columns (spans more if needed) */}
                    <div className="lg:col-span-2">
                        {comparison && <ComparisonTable comparison={comparison} />}
                    </div>

                    {/* Insights Panel - 1 column */}
                    <div>
                        {comparison && (
                            <InsightsPanel
                                highlights={highlights}
                                summary={comparison.overallWinner ? "Check out the key differences highlighted below." : undefined}
                            />
                        )}
                    </div>
                </div>

                {/* Export Section */}
                <div className="mt-8 flex justify-center">
                    {comparison && <ExportButton comparison={comparison} highlights={highlights} />}
                </div>
            </main>
        </div>
    );
}

/**
 * Loading Skeleton Component
 */
function CompareSkeleton() {
    return (
        <div className="min-h-screen pb-20">
            {/* Header skeleton */}
            <header className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-lg border-b border-dark-700/50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="w-32 h-8 skeleton rounded-lg" />
                    <div className="w-24 h-8 skeleton rounded-lg" />
                    <div className="w-8 h-8 skeleton rounded-lg" />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Vehicle cards skeleton */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="h-80 skeleton rounded-2xl" />
                    <div className="h-80 skeleton rounded-2xl" />
                    <div className="h-80 skeleton rounded-2xl" />
                </div>

                {/* Stats skeleton */}
                <div className="h-32 skeleton rounded-2xl mb-8" />

                {/* Content skeleton */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 skeleton rounded-2xl" />
                    <div className="h-96 skeleton rounded-2xl" />
                </div>
            </main>
        </div>
    );
}
