// ============================================
// Compare Store - Zustand State Management
// Manages vehicle selection, comparison, and UI state
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    NormalizedSpec,
    ComparisonResult,
    ComparisonHighlight,
    VehicleSuggestion,
    CompareState,
} from '@/types/vehicle';
import { compareVehicles, generateHighlights } from '@/lib/compare-engine';

/**
 * Store interface
 */
interface CompareStore extends CompareState {
    // Actions
    addVehicle: (vehicle: NormalizedSpec) => void;
    removeVehicle: (vehicleId: string) => void;
    clearVehicles: () => void;
    runComparison: () => void;
    clearComparison: () => void;
    reset: () => void;

    // Search state & actions (kept global for simplicity, or could comprise multiple search states)
    // For unlimited vehicles, we might want a single active search or per-slot search.
    // Let's keep a generic search state that UI can use.
    searchQuery: string;
    suggestions: VehicleSuggestion[];
    setSearchQuery: (query: string) => void;
    setSuggestions: (suggestions: VehicleSuggestion[]) => void;

    // Error handling
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
}

/**
 * Initial state
 */
const initialState = {
    vehicles: [],
    comparison: null,
    highlights: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    suggestions: [],
};

/**
 * Create the Zustand store with persistence
 */
export const useCompareStore = create<CompareStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            /**
             * Add a vehicle to comparison
             */
            addVehicle: (vehicle) => {
                const { vehicles } = get();

                // Prevent duplicates
                if (vehicles.some(v => v.id === vehicle.id)) {
                    return;
                }

                const newVehicles = [...vehicles, vehicle];

                set({
                    vehicles: newVehicles,
                    comparison: null,
                    highlights: []
                });

                // Auto-run comparison if we have at least 2 vehicles
                if (newVehicles.length >= 2) {
                    get().runComparison();
                }
            },

            /**
             * Remove a vehicle
             */
            removeVehicle: (vehicleId) => {
                const { vehicles } = get();
                const newVehicles = vehicles.filter(v => v.id !== vehicleId);

                set({
                    vehicles: newVehicles,
                    comparison: null,
                    highlights: []
                });

                if (newVehicles.length >= 2) {
                    get().runComparison();
                }
            },

            /**
             * Clear all vehicles
             */
            clearVehicles: () => {
                set({ vehicles: [], comparison: null, highlights: [] });
            },

            /**
             * Run comparison between selected vehicles
             */
            runComparison: () => {
                const { vehicles } = get();

                if (vehicles.length < 2) {
                    // Logic: You can "compare" 1 vehicle effectively just showing its stats,
                    // but typically comparison implies >= 2.
                    // Let's allow > 0 to perhaps show specs, but highlights need >= 2 generally.
                    // For now, let's keep it simple: if < 2, maybe just clear comparison?
                    // Or we can just run it, but highlights will be empty.
                    console.log("Running comparisons with", vehicles.length);
                }

                set({ isLoading: true, error: null });

                try {
                    // Generate comparison
                    const comparison = compareVehicles(vehicles);

                    // Generate highlights only if sufficient vehicles
                    const highlights = vehicles.length > 1 ? generateHighlights(comparison) : [];

                    set({
                        comparison,
                        highlights,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        error: 'Failed to generate comparison',
                        isLoading: false,
                    });
                    console.error('Comparison error:', error);
                }
            },

            /**
             * Clear comparison results but keep vehicles
             */
            clearComparison: () => {
                set({
                    comparison: null,
                    highlights: [],
                    error: null,
                });
            },

            /**
             * Reset entire store to initial state
             */
            reset: () => {
                set(initialState);
            },

            /**
             * Set search query
             */
            setSearchQuery: (query) => {
                set({ searchQuery: query });
            },

            /**
             * Set suggestions
             */
            setSuggestions: (suggestions) => {
                set({ suggestions });
            },

            /**
             * Set error message
             */
            setError: (error) => {
                set({ error });
            },

            /**
             * Set loading state
             */
            setLoading: (loading) => {
                set({ isLoading: loading });
            },
        }),
        {
            name: 'autocompare-storage',
            // Only persist vehicles
            partialize: (state) => ({
                vehicles: state.vehicles,
            }),
        }
    )
);

/**
 * Selector hooks for common use cases
 */
export const useVehicles = () => useCompareStore((state) => state.vehicles);
export const useComparison = () => useCompareStore((state) => state.comparison);
export const useHighlights = () => useCompareStore((state) => state.highlights);
export const useIsLoading = () => useCompareStore((state) => state.isLoading);
export const useError = () => useCompareStore((state) => state.error);
