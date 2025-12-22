// ============================================
// Favorite Button Component
// Heart icon to add/remove vehicles from favorites
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { useFavoritesStore } from '@/store/favorites-store';
import type { NormalizedSpec } from '@/types/vehicle';

interface FavoriteButtonProps {
    vehicle: NormalizedSpec;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showLabel?: boolean;
}

/**
 * FavoriteButton Component
 * Toggles favorite status for a vehicle
 */
export function FavoriteButton({
    vehicle,
    size = 'md',
    className,
    showLabel = false,
}: FavoriteButtonProps) {
    const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
    const [mounted, setMounted] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    // Handle hydration
    useEffect(() => {
        setMounted(true);
        setIsLiked(isFavorite(vehicle.id));
    }, [vehicle.id, isFavorite]);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLiked) {
            removeFavorite(vehicle.id);
            setIsLiked(false);
        } else {
            addFavorite(vehicle);
            setIsLiked(true);
        }
    };

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const buttonSizes = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5',
    };

    if (!mounted) {
        return (
            <button
                className={clsx(
                    buttonSizes[size],
                    'bg-white border-2 border-black text-gray-400',
                    className
                )}
                disabled
            >
                <Heart className={sizeClasses[size]} />
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className={clsx(
                buttonSizes[size],
                'border-2 border-black transition-all duration-200',
                'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                'hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]',
                'active:shadow-none active:translate-x-[2px] active:translate-y-[2px]',
                isLiked ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500',
                className
            )}
            aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart className={clsx(sizeClasses[size], isLiked && 'fill-current')} />
            {showLabel && (
                <span className="ml-2 font-bold text-sm">{isLiked ? 'Saved' : 'Save'}</span>
            )}
        </button>
    );
}
