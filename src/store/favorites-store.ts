// ============================================
// Favorites Store - Zustand State Management
// Manages user's favorite vehicles
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NormalizedSpec } from '@/types/vehicle';

/**
 * Favorites Store Interface
 */
interface FavoritesStore {
    favorites: NormalizedSpec[];

    // Actions
    addFavorite: (vehicle: NormalizedSpec) => void;
    removeFavorite: (vehicleId: string) => void;
    isFavorite: (vehicleId: string) => boolean;
    clearFavorites: () => void;
    getFavoritesCount: () => number;
}

/**
 * Create the Zustand store with persistence
 */
export const useFavoritesStore = create<FavoritesStore>()(
    persist(
        (set, get) => ({
            favorites: [],

            /**
             * Add a vehicle to favorites
             */
            addFavorite: (vehicle) => {
                const { favorites } = get();

                // Prevent duplicates
                if (favorites.some((v) => v.id === vehicle.id)) {
                    return;
                }

                set({ favorites: [...favorites, vehicle] });
            },

            /**
             * Remove a vehicle from favorites
             */
            removeFavorite: (vehicleId) => {
                const { favorites } = get();
                set({ favorites: favorites.filter((v) => v.id !== vehicleId) });
            },

            /**
             * Check if a vehicle is in favorites
             */
            isFavorite: (vehicleId) => {
                const { favorites } = get();
                return favorites.some((v) => v.id === vehicleId);
            },

            /**
             * Clear all favorites
             */
            clearFavorites: () => {
                set({ favorites: [] });
            },

            /**
             * Get favorites count
             */
            getFavoritesCount: () => {
                return get().favorites.length;
            },
        }),
        {
            name: 'autocompare-favorites',
        }
    )
);

/**
 * Selector hooks
 */
export const useFavorites = () => useFavoritesStore((state) => state.favorites);
