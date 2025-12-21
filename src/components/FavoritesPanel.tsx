// ============================================
// Favorites Panel Component
// Displays user's favorite vehicles with quick actions
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Heart, X, Trash2, Scale } from 'lucide-react';
import { clsx } from 'clsx';
import { useFavoritesStore } from '@/store/favorites-store';
import { useCompareStore } from '@/store/compare-store';
import type { NormalizedSpec } from '@/types/vehicle';

interface FavoritesPanelProps {
    className?: string;
}

/**
 * FavoritesPanel Component
 * Dropdown panel showing all favorite vehicles
 */
export function FavoritesPanel({ className }: FavoritesPanelProps) {
    const { favorites, removeFavorite, clearFavorites } = useFavoritesStore();
    const { addVehicle, vehicles: compareVehicles } = useCompareStore();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleAddToCompare = (vehicle: NormalizedSpec) => {
        addVehicle(vehicle);
    };

    const isInComparison = (vehicleId: string) => {
        return compareVehicles.some(v => v.id === vehicleId);
    };

    if (!mounted) {
        return (
            <button
                className={clsx(
                    'relative p-2 bg-white border-2 border-black',
                    'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    className
                )}
                disabled
            >
                <Heart className="w-5 h-5 text-gray-400" />
            </button>
        );
    }

    return (
        <div className={clsx('relative', className)}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'relative p-2 border-2 border-black transition-all',
                    'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                    'hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
                    isOpen ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-red-50'
                )}
                aria-label="Favorites"
                title="View Favorites"
            >
                <Heart className={clsx('w-5 h-5', favorites.length > 0 && 'fill-current text-red-500')} />
                {favorites.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center border border-black">
                        {favorites.length}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        role="button"
                        tabIndex={0}
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                        onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false); }}
                        aria-label="Close panel"
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b-2 border-black bg-yellow-400">
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 fill-current" />
                                <span className="font-black uppercase">Favorites</span>
                                <span className="text-sm font-mono">({favorites.length})</span>
                            </div>
                            {favorites.length > 0 && (
                                <button
                                    onClick={() => clearFavorites()}
                                    className="p-1 hover:bg-yellow-500 rounded"
                                    title="Clear all favorites"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="max-h-72 overflow-y-auto">
                            {favorites.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="font-bold">No favorites yet</p>
                                    <p className="text-sm mt-1">Click the heart icon on vehicles to save them here</p>
                                </div>
                            ) : (
                                <ul>
                                    {favorites.map((vehicle) => (
                                        <li
                                            key={vehicle.id}
                                            className="flex items-center gap-3 p-3 border-b border-gray-200 hover:bg-gray-50"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm uppercase truncate">
                                                    {vehicle.make} {vehicle.model}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {vehicle.year} • {vehicle.trim || 'Base'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleAddToCompare(vehicle)}
                                                    disabled={isInComparison(vehicle.id)}
                                                    className={clsx(
                                                        'p-1.5 border border-black text-xs font-bold',
                                                        isInComparison(vehicle.id)
                                                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                    )}
                                                    title={isInComparison(vehicle.id) ? 'Already in comparison' : 'Add to comparison'}
                                                >
                                                    <Scale className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => removeFavorite(vehicle.id)}
                                                    className="p-1.5 bg-white border border-black text-red-500 hover:bg-red-50"
                                                    title="Remove from favorites"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
