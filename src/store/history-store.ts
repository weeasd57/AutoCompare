// ============================================
// History Store - Zustand State Management
// Manages comparison history
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NormalizedSpec } from '@/types/vehicle';

/**
 * History Entry Interface
 */
interface HistoryEntry {
    id: string;
    vehicles: NormalizedSpec[];
    timestamp: number;
}

/**
 * History Store Interface
 */
interface HistoryStore {
    history: HistoryEntry[];
    maxEntries: number;

    // Actions
    addToHistory: (vehicles: NormalizedSpec[]) => void;
    removeFromHistory: (entryId: string) => void;
    clearHistory: () => void;
    getHistoryCount: () => number;
}

/**
 * Generate unique ID for history entry
 */
const generateId = () => `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Create the Zustand store with persistence
 */
export const useHistoryStore = create<HistoryStore>()(
    persist(
        (set, get) => ({
            history: [],
            maxEntries: 10,

            /**
             * Add a comparison to history
             */
            addToHistory: (vehicles) => {
                if (vehicles.length < 2) return;

                const { history, maxEntries } = get();

                // Check if this exact comparison already exists (by vehicle IDs)
                const vehicleIds = vehicles.map(v => v.id).sort().join('-');
                const exists = history.some(entry =>
                    entry.vehicles.map(v => v.id).sort().join('-') === vehicleIds
                );

                if (exists) return;

                const newEntry: HistoryEntry = {
                    id: generateId(),
                    vehicles,
                    timestamp: Date.now(),
                };

                // Keep only last maxEntries
                const updatedHistory = [newEntry, ...history].slice(0, maxEntries);
                set({ history: updatedHistory });
            },

            /**
             * Remove an entry from history
             */
            removeFromHistory: (entryId) => {
                const { history } = get();
                set({ history: history.filter(entry => entry.id !== entryId) });
            },

            /**
             * Clear all history
             */
            clearHistory: () => {
                set({ history: [] });
            },

            /**
             * Get history count
             */
            getHistoryCount: () => {
                return get().history.length;
            },
        }),
        {
            name: 'autocompare-history',
        }
    )
);

/**
 * Selector hooks
 */
export const useHistory = () => useHistoryStore((state) => state.history);
