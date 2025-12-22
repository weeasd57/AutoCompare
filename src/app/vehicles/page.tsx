'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Car } from 'lucide-react';
import { useVehicles } from '@/context/VehicleContext';
import { useSettings } from '@/context/SettingsContext';
import type { NormalizedSpec } from '@/types/vehicle';
import { getBrandLogoUrl } from '@/lib/logos';
import { GoogleAdSlot } from '@/components/GoogleAdSlot';

export default function VehiclesPage() {
    const { vehicles, loading, isLoaded } = useVehicles();
    const { settings } = useSettings();
    const [query, setQuery] = useState('');
    const [filterMake, setFilterMake] = useState<string>('');
    const [filterBodyStyle, setFilterBodyStyle] = useState<string>('');
    const [filterYear, setFilterYear] = useState<string>('');
    const [page, setPage] = useState(1);

    const adsenseVehiclesSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_VEHICLES;

    const PAGE_SIZE = 12;

    const makes = useMemo(
        () => Array.from(new Set(vehicles.map((v: NormalizedSpec) => v.make))).sort(),
        [vehicles]
    );

    const bodyStyles = useMemo(
        () =>
            Array.from(
                new Set(vehicles.map((v: NormalizedSpec) => v.bodyStyle).filter(Boolean))
            ).sort() as string[],
        [vehicles]
    );

    const years = useMemo(
        () =>
            Array.from(new Set(vehicles.map((v: NormalizedSpec) => v.year))).sort((a, b) => b - a),
        [vehicles]
    );

    const filteredVehicles = useMemo(() => {
        let list = vehicles as NormalizedSpec[];

        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(
                (v: NormalizedSpec) =>
                    v.make.toLowerCase().includes(q) ||
                    v.model.toLowerCase().includes(q) ||
                    String(v.year).includes(q)
            );
        }

        if (filterMake) {
            list = list.filter((v) => v.make === filterMake);
        }

        if (filterBodyStyle) {
            list = list.filter((v) => (v.bodyStyle || '') === filterBodyStyle);
        }

        if (filterYear) {
            list = list.filter((v) => String(v.year) === filterYear);
        }

        return list;
    }, [vehicles, query, filterMake, filterBodyStyle, filterYear]);

    const sortedVehicles = useMemo(() => {
        return [...filteredVehicles].sort((a, b) => {
            if (a.make === b.make) {
                if (a.model === b.model) {
                    return (b.year || 0) - (a.year || 0);
                }
                return a.model.localeCompare(b.model);
            }
            return a.make.localeCompare(b.make);
        });
    }, [filteredVehicles]);

    const totalPages = Math.max(1, Math.ceil(sortedVehicles.length / PAGE_SIZE));

    const paginatedVehicles = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return sortedVehicles.slice(start, start + PAGE_SIZE);
    }, [sortedVehicles, page]);

    useEffect(() => {
        setPage(1);
    }, [query, filterMake, filterBodyStyle, filterYear]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const isLoading = loading || !isLoaded;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <section className="max-w-6xl mx-auto px-4 py-10">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black uppercase text-black dark:text-white mb-2">
                            All Vehicles
                        </h1>
                        <p className="text-sm md:text-base font-medium text-gray-600 dark:text-gray-400">
                            Browse the full database of vehicles available for comparison.
                        </p>
                    </div>

                    {adsenseVehiclesSlot && (
                        <div className="mb-6">
                            <GoogleAdSlot slot={adsenseVehiclesSlot} />
                        </div>
                    )}

                    <div className="w-full sm:w-72 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by make, model, or year..."
                            className="w-full pl-9 pr-3 py-2 rounded-none border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                    </div>
                </header>

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                    <select
                        value={filterMake}
                        onChange={(e) => setFilterMake(e.target.value)}
                        className="border-2 border-black dark:border-white bg-white dark:bg-gray-900 px-2 py-2 font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                        <option value="">All Makes</option>
                        {makes.map((make) => (
                            <option key={make} value={make}>
                                {make}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterBodyStyle}
                        onChange={(e) => setFilterBodyStyle(e.target.value)}
                        className="border-2 border-black dark:border-white bg-white dark:bg-gray-900 px-2 py-2 font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                        <option value="">All Body Styles</option>
                        {bodyStyles.map((style) => (
                            <option key={style} value={style}>
                                {style}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="border-2 border-black dark:border-white bg-white dark:bg-gray-900 px-2 py-2 font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                        <option value="">All Years</option>
                        {years.map((year) => (
                            <option key={year} value={String(year)}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                {isLoading && (
                    <div className="py-10 flex justify-center">
                        <div className="inline-flex items-center gap-2 text-black dark:text-white font-bold">
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Loading vehicles...</span>
                        </div>
                    </div>
                )}

                {!isLoading && sortedVehicles.length === 0 && (
                    <div className="py-16 text-center text-gray-500 dark:text-gray-400 font-medium">
                        No vehicles found. Try adjusting your search.
                    </div>
                )}

                {!isLoading && sortedVehicles.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedVehicles.map((vehicle) => {
                                const rawImage = vehicle.imageUrl || '';
                                const primaryImage = rawImage
                                    ? String(rawImage)
                                          .split('|')
                                          .map((s) => s.trim())
                                          .filter(Boolean)[0] || null
                                    : null;

                                return (
                                    <Link
                                        key={vehicle.id}
                                        href={`/vehicles/${encodeURIComponent(vehicle.id)}`}
                                        className="group block border-3 border-black dark:border-white bg-white dark:bg-gray-900 shadow-[6px_6px_0px_0px_black] dark:shadow-[6px_6px_0px_0px_white] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_black] dark:hover:shadow-[10px_10px_0px_0px_white] transition-all p-4"
                                    >
                                        <div className="mb-3 relative w-full h-40 border-2 border-black bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                                            {primaryImage ? (
                                                <Image
                                                    src={primaryImage}
                                                    alt={`${vehicle.make} ${vehicle.model}`}
                                                    fill
                                                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <Image
                                                    src={getBrandLogoUrl(vehicle.make)}
                                                    alt={vehicle.make}
                                                    width={120}
                                                    height={80}
                                                    className="object-contain p-2"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-black uppercase bg-black text-white px-2 py-1">
                                                {vehicle.make}
                                            </span>
                                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                                {vehicle.year}
                                            </span>
                                        </div>
                                        <div className="mb-3">
                                            <h2 className="text-lg font-black uppercase text-black dark:text-white truncate">
                                                {vehicle.model}
                                            </h2>
                                            {vehicle.trim && (
                                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1 truncate">
                                                    {vehicle.trim}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-1">
                                                <Car className="w-4 h-4" />
                                                <span>{vehicle.bodyStyle || 'Body style N/A'}</span>
                                            </div>
                                            {settings.showPrices &&
                                                vehicle.basePrice &&
                                                vehicle.basePrice > 0 && (
                                                    <span>
                                                        {settings.currency === 'USD'
                                                            ? '$'
                                                            : settings.currency === 'EUR'
                                                              ? '€'
                                                              : settings.currency === 'GBP'
                                                                ? '£'
                                                                : settings.currency === 'SAR'
                                                                  ? 'SAR '
                                                                  : ''}
                                                        {vehicle.basePrice.toLocaleString()}
                                                    </span>
                                                )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <div>
                                Page {page} of {totalPages} • Showing {paginatedVehicles.length} of{' '}
                                {sortedVehicles.length} vehicles
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:-translate-x-0.5 transition-transform"
                                >
                                    Previous
                                </button>
                                <div className="px-3 py-2 border-2 border-dashed border-black dark:border-white">
                                    {page}
                                </div>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:-translate-x-0.5 transition-transform"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
