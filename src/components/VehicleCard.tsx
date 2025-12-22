// ============================================
// Vehicle Card Component
// Displays selected vehicle with key specs
// ============================================

'use client';

import { useState } from 'react';
import { X, Car, Fuel, Zap, Settings, Users } from 'lucide-react';
import Image from 'next/image';
import type { NormalizedSpec } from '@/types/vehicle';
import { clsx } from 'clsx';
import { getBrandLogoUrl } from '@/lib/logos';
import { getPrimaryVehicleImageUrl } from '@/lib/vehicle-images';
import { useSettings } from '@/context/SettingsContext';

interface VehicleCardProps {
    vehicle: NormalizedSpec;
    onRemove?: () => void;
    variant?: 'default' | 'compact';
    isWinner?: boolean;
    score?: number;
    className?: string;
}

/**
 * VehicleCard Component
 * Displays a vehicle with its key specifications
 */
export function VehicleCard({
    vehicle,
    onRemove,
    variant = 'default',
    isWinner = false,
    score,
    className,
}: VehicleCardProps) {
    const [imageError, setImageError] = useState(false);
    const { settings } = useSettings();

    const primaryImage = getPrimaryVehicleImageUrl(vehicle.imageUrl);
    const fallbackLogo = getBrandLogoUrl(vehicle.make);
    const resolvedImage = imageError ? fallbackLogo : primaryImage || fallbackLogo;

    // Format display name
    const displayName = `${vehicle.make} ${vehicle.model}`;
    const yearTrim = vehicle.trim ? `${vehicle.year} ${vehicle.trim}` : String(vehicle.year);

    // Quick stats to display
    const stats = [
        {
            icon: Zap,
            label: 'Power',
            value: vehicle.horsepower ? `${vehicle.horsepower} hp` : 'N/A',
        },
        {
            icon: Fuel,
            label: 'MPG',
            value: vehicle.fuelCombinedMpg ? `${vehicle.fuelCombinedMpg} mpg` : 'N/A',
        },
        {
            icon: Settings,
            label: 'Drivetrain',
            value: vehicle.drivetrain || 'N/A',
        },
        {
            icon: Users,
            label: 'Seats',
            value: vehicle.seatingCapacity ? `${vehicle.seatingCapacity}` : 'N/A',
        },
    ];

    const renderWinnerBadge = () =>
        isWinner && (
            <div className="absolute top-4 left-4 z-20">
                <div className="neo-tag bg-green-500 text-white border-black text-sm">Winner</div>
            </div>
        );

    const renderPrice = () => {
        if (!settings.showPrices) return null;

        const hasPrice = vehicle.basePrice !== null && vehicle.basePrice > 0;
        const currencyMap: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', SAR: 'SAR ' };
        const symbol = currencyMap[settings.currency] || '';

        return (
            <div className="mt-4 pt-4 border-t-2 border-black border-dashed">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase text-gray-500">
                        {hasPrice ? 'Starting at' : 'Price'}
                    </span>
                    <span
                        className={clsx(
                            'font-black',
                            hasPrice ? 'text-lg text-green-600' : 'text-sm text-gray-400 italic'
                        )}
                    >
                        {hasPrice
                            ? `${symbol}${vehicle.basePrice?.toLocaleString()}`
                            : 'Data Unavailable'}
                    </span>
                </div>
            </div>
        );
    };

    if (variant === 'compact') {
        return (
            <div
                className={clsx(
                    'relative p-4 rounded-xl',
                    'bg-gradient-to-br from-dark-800/80 to-dark-900/80',
                    'border border-dark-600/50',
                    'backdrop-blur-sm',
                    isWinner && 'ring-2 ring-green-500/50',
                    className
                )}
            >
                {isWinner && (
                    <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                        Winner
                    </div>
                )}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                        <Car className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{displayName}</h3>
                        <p className="text-sm text-gray-400">{yearTrim}</p>
                    </div>
                    {score !== undefined && (
                        <div className="text-right">
                            <span className="text-2xl font-bold text-primary-400">{score}</span>
                            <span className="text-sm text-gray-500">/100</span>
                        </div>
                    )}
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="p-2 rounded-lg hover:bg-dark-700/50 text-gray-400 hover:text-white transition-colors"
                            aria-label="Remove vehicle"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={clsx(
                'relative overflow-hidden neo-card rounded-none bg-white',
                isWinner && 'border-green-600',
                className
            )}
        >
            <div className="relative h-32 bg-yellow-400 border-b-2 border-black p-6 flex items-end">
                {renderWinnerBadge()}
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="absolute top-4 right-4 z-20 p-2 bg-white text-black border-2 border-black hover:bg-red-500 hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        aria-label="Remove vehicle"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <div className="relative z-10 w-full">
                    <div className="w-20 h-20 bg-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 relative overflow-hidden">
                        {resolvedImage ? (
                            <Image
                                src={resolvedImage}
                                alt={vehicle.make}
                                fill
                                className="object-contain p-2"
                                onError={() => {
                                    if (!imageError) setImageError(true);
                                }}
                                unoptimized={true}
                            />
                        ) : (
                            <Car className="w-10 h-10 text-gray-400" />
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6">
                <h3 className="text-2xl font-black uppercase mb-1">{displayName}</h3>
                <p className="text-gray-600 font-bold mb-6 font-mono text-sm">{yearTrim}</p>

                {score !== undefined && (
                    <div className="mb-6 p-4 border-2 border-black bg-blue-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold uppercase">Score</span>
                            <span className="text-2xl font-black">{score}</span>
                        </div>
                        <div className="h-4 border-2 border-black bg-white rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 border-r-2 border-black"
                                style={{ width: `${score}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className="p-3 border-2 border-black bg-gray-50 hover:bg-yellow-50 transition-colors"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <stat.icon className="w-4 h-4 text-black" />
                                <span className="text-xs font-bold uppercase text-gray-500">
                                    {stat.label}
                                </span>
                            </div>
                            <p className="text-sm font-black text-black">{stat.value}</p>
                        </div>
                    ))}
                </div>
                {renderPrice()}
            </div>
        </div>
    );
}
