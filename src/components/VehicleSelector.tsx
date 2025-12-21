// ============================================
// Vehicle Selector Component
// Dropdown/Search to add vehicles to comparison
// ============================================

'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, X, Car, ChevronRight, ArrowLeft, Filter } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import type { NormalizedSpec } from '@/types/vehicle';
import { getBrandLogoUrl } from '@/lib/logos';
import { useVehicles } from '@/context/VehicleContext';
import { useSettings } from '@/context/SettingsContext';
import { useCompareStore } from '@/store/compare-store';
import { useToast } from '@/context/ToastContext';

interface VehicleSelectorProps {
    onSelect: (vehicle: NormalizedSpec) => void;
    className?: string;
    variant?: 'card' | 'input';
    placeholder?: string;
}

// Helper to extract unique values from specs
const getAvailableOptions = (specs: NormalizedSpec[]) => {
    const makes = Array.from(new Set(specs.map(v => v.make))).sort();
    const makeMap: Record<string, string[]> = {};

    specs.forEach(v => {
        if (!makeMap[v.make]) makeMap[v.make] = [];
        if (!makeMap[v.make].includes(v.model)) makeMap[v.make].push(v.model);
    });

    Object.keys(makeMap).forEach(key => makeMap[key].sort());

    return { makes, makeMap };
};

export function VehicleSelector({ onSelect, className, variant, placeholder }: VehicleSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'search' | 'browse'>('browse');
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<NormalizedSpec[]>([]);
    const [makeFilter, setMakeFilter] = useState('');
    const [sortOption, setSortOption] = useState<'relevance' | 'year_desc' | 'hp_desc' | 'price_asc'>('relevance');

    // Browse state
    const [selectedMake, setSelectedMake] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    // State management
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Use vehicles from context as primary source
    const { vehicles: contextVehicles, makes: contextMakes, models: contextModels } = useVehicles();
    const { settings } = useSettings();
    const { vehicles: selectedVehicles } = useCompareStore();
    const toast = useToast();

    const allVehicles = useMemo(() => contextVehicles, [contextVehicles]);

    const { makeMap } = useMemo(() => getAvailableOptions(allVehicles), [allVehicles]);

    // Sort makes alphabetically
    const makes = useMemo(() => {
        const filtered = [...contextMakes]
            .filter(make => make) // Filter out undefined makes
            .sort((a, b) => a.localeCompare(b));

        if (!makeFilter.trim()) return filtered;
        const lower = makeFilter.toLowerCase();
        return filtered.filter(make => make.toLowerCase().includes(lower));
    }, [contextMakes, makeFilter]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper: sort vehicles based on selected option
    const sortVehicles = useCallback((items: NormalizedSpec[]) => {
        switch (sortOption) {
            case 'year_desc':
                return [...items].sort((a, b) => (b.year || 0) - (a.year || 0));
            case 'hp_desc':
                return [...items].sort((a, b) => (b.horsepower || 0) - (a.horsepower || 0));
            case 'price_asc':
                return [...items].sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0));
            case 'relevance':
            default:
                return items;
        }
    }, [sortOption]);

    // Search logic
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        const lowerQuery = query.toLowerCase();

        const filtered = allVehicles.filter(v =>
            v.make.toLowerCase().includes(lowerQuery) ||
            v.model.toLowerCase().includes(lowerQuery) ||
            String(v.year).includes(lowerQuery)
        );

        const sorted = sortVehicles(filtered).slice(0, 20);
        setSuggestions(sorted);
    }, [query, allVehicles, sortVehicles]);

    // Focus the search input when opening the modal in search mode
    useEffect(() => {
        if (!isOpen) return;
        if (mode !== 'search') return;
        const t = setTimeout(() => {
            searchInputRef.current?.focus();
        }, 0);
        return () => clearTimeout(t);
    }, [isOpen, mode]);

    const handleSelect = (vehicle: NormalizedSpec) => {
        // Enforce comparison limit
        if (selectedVehicles.length >= settings.maxCompareVehicles) {
            toast.error(`You can only compare up to ${settings.maxCompareVehicles} vehicles at a time.`);
            return;
        }

        onSelect(vehicle);
        setIsOpen(false);
        resetState();
    };

    const resetState = () => {
        setQuery('');
        setSuggestions([]);
        setSelectedMake(null);
        setSelectedModel(null);
        setMode('browse');
        setMakeFilter('');
    };

    const handleBack = () => {
        if (selectedModel) setSelectedModel(null);
        else if (selectedMake) setSelectedMake(null);
        else setMode('browse');
    };

    // Derived lists for browsing
    // Fix: Merge available spec models with context models to ensure we show all options
    const browseModels = useMemo(() => {
        if (!selectedMake) return [];

        // 1. Get models from specs (for instant availability)
        const specModels = makeMap[selectedMake] || [];

        // 2. Get models from context (for broader browsing)
        const contextModelNames = contextModels || [];

        // 3. Merge and unique
        return Array.from(new Set([...specModels, ...contextModelNames])).sort();
    }, [selectedMake, makeMap, contextModels]);

    const browseVehicles = selectedMake && selectedModel
        ? allVehicles.filter(v => v.make === selectedMake && v.model === selectedModel)
        : [];

    // Get available years for the selected make/model
    const availableYears = useMemo(() => {
        if (!selectedMake || !selectedModel) return [];
        return Array.from(new Set(allVehicles
            .filter(v => v.make === selectedMake && v.model === selectedModel)
            .map(v => v.year)
        )).sort((a, b) => b - a);
    }, [selectedMake, selectedModel, allVehicles]);

    const handleInputClick = () => {
        setIsOpen(true);
        setMode('search');
    };

    const toggleBrowse = () => {
        setIsOpen(true);
        setMode('browse');
        setQuery('');
    };

    const SortControls = () => (
        <div className="flex items-center justify-end gap-2 mb-2 px-1">
            <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Sort by</span>
            <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                className="border border-gray-300 dark:border-dark-600 text-xs px-2 py-1 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            >
                <option value="relevance">Relevance</option>
                <option value="year_desc">Newest Year</option>
                <option value="hp_desc">Horsepower</option>
                <option value="price_asc">Lowest Price</option>
            </select>
        </div>
    );

    const BrowseContent = () => (
        <div className="space-y-1">
            {!selectedMake ? (
                // Make Selection
                <div className="space-y-2">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            value={makeFilter}
                            onChange={(e) => setMakeFilter(e.target.value)}
                            placeholder="Search make..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm font-medium text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                    {makes.map(make => (
                        <button
                            key={make}
                            onClick={() => setSelectedMake(make)}
                            className={clsx(
                                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all',
                                'bg-white border-gray-200 hover:bg-gray-100 hover:border-gray-400',
                                'dark:bg-dark-700/30 dark:border-dark-600/30 dark:hover:bg-dark-700 dark:hover:border-dark-500'
                            )}
                        >
                            <div className="mb-1 w-12 h-12 p-1 flex items-center justify-center">
                                <Image
                                    src={getBrandLogoUrl(make)}
                                    alt={make}
                                    width={48}
                                    height={48}
                                    className="object-contain filter invert brightness-0 sm:invert-0 sm:brightness-100 dark:invert"
                                    unoptimized={true}
                                />
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white uppercase">
                                {make}
                            </span>
                        </button>
                    ))}
                    </div>
                </div>
            ) : !selectedModel ? (
                // Model Selection
                <div className="space-y-1">
                    {browseModels.map(model => (
                        <button
                            key={model}
                            onClick={() => setSelectedModel(model)}
                            className="w-full flex items-center justify-between p-3 border-2 border-transparent rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-all text-left group"
                        >
                            <span className="font-medium uppercase text-gray-900 dark:text-white">{model}</span>
                            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white" />
                        </button>
                    ))}
                </div>
            ) : (
                // Year/Trim Selection
                <div className="space-y-1">
                    {browseVehicles.length > 0 ? (
                        browseVehicles.map(vehicle => (
                            <button
                                key={vehicle.id}
                                onClick={() => handleSelect(vehicle)}
                                className="w-full flex items-center gap-3 p-3 border-2 border-transparent rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-all text-left group"
                            >
                                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600 group-hover:bg-blue-100 dark:group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors">
                                    <Car className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                                </div>
                                <div>
                                    <div className="font-medium uppercase text-gray-900 dark:text-white">{vehicle.make} {vehicle.model}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {vehicle.year} • {vehicle.trim}
                                    </div>
                                </div>
                                <div className="ml-auto text-xs font-mono text-gray-500 dark:text-gray-400">
                                    {vehicle.horsepower}hp
                                </div>
                            </button>
                        ))
                    ) : (
                        // Fallback for models without detailed specs (show years)
                        availableYears.length > 0 ? availableYears.map((year: number) => (
                            <button
                                key={year}
                                onClick={() => handleSelect({
                                    id: `${selectedMake}-${selectedModel}-${year}`.toLowerCase().replace(/ /g, '-'),
                                    make: selectedMake!,
                                    model: selectedModel!,
                                    year: year,
                                    trim: 'Base',
                                    bodyStyle: 'Sedan',
                                    basePrice: 0,

                                    // Required nullable fields
                                    horsepower: null,
                                    torque: null,
                                    engineDisplacement: null,
                                    engineCylinders: null,
                                    engineConfiguration: null,
                                    fuelType: null,
                                    fuelCityMpg: null,
                                    fuelHighwayMpg: null,
                                    fuelCombinedMpg: null,
                                    transmission: null,
                                    transmissionSpeeds: null,
                                    drivetrain: null,
                                    doors: null,
                                    seatingCapacity: null,
                                    curbWeight: null,
                                    gvwr: null,
                                    payloadCapacity: null,
                                    towingCapacity: null,
                                    airbags: null,
                                    abs: null,
                                    esc: null,
                                    country: null,
                                    manufacturer: null
                                })}
                                className="w-full flex items-center gap-3 p-3 border-2 border-transparent rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-all text-left group"
                            >
                                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-600 group-hover:bg-blue-100 dark:group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors">
                                    <span className="font-bold text-xs text-gray-600 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-primary-400">{year}</span>
                                </div>
                                <div>
                                    <div className="font-medium uppercase text-gray-900 dark:text-white">{selectedMake} {selectedModel}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Select Year</div>
                                </div>
                            </button>
                        )) : null
                    )}
                </div>
            )}
        </div>
    );

    if (variant === 'input') {
        return (
            <div ref={wrapperRef} className={clsx('relative w-full', className)}>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setMode('search');
                            if (!isOpen) setIsOpen(true);
                        }}
                        onClick={handleInputClick}
                        placeholder={placeholder || "Search or browse vehicles..."}
                        className={clsx(
                            'w-full pl-12 pr-32 py-4 border-3 border-black bg-white',
                            'text-black font-bold placeholder-gray-400',
                            'focus:outline-none focus:shadow-[4px_4px_0px_0px_black]',
                            'transition-all duration-200'
                        )}
                    />

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                        <div className="h-6 w-px bg-gray-300 mx-1" />
                        <button
                            onClick={toggleBrowse}
                            className="flex items-center gap-1 px-3 py-1.5 border-2 border-black font-bold text-xs uppercase hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_0px_black] active:translate-y-[1px] active:shadow-none"
                            style={{ backgroundColor: settings.primaryColor }}
                        >
                            <Filter className="w-3 h-3" />
                            Browse
                        </button>
                    </div>
                </div>

                {isOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
                        role="button"
                        tabIndex={0}
                        aria-label="Close selector"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsOpen(false);
                                resetState();
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                                setIsOpen(false);
                                resetState();
                            }
                        }}
                    >
                        <div
                            className="w-full max-w-3xl bg-white dark:bg-dark-900 border-3 border-black text-gray-900 dark:text-white shadow-[8px_8px_0px_0px_black] rounded-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                            role="dialog"
                            aria-modal="true"
                        >
                            {/* Header for Back Button in Input Mode */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-800">
                                {mode === 'search' ? (
                                    <>
                                        <button
                                            onClick={() => { setMode('browse'); setQuery(''); }}
                                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-dark-700 text-gray-300 hover:text-white"
                                            aria-label="Go back"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 flex items-center gap-2">
                                            <div className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-full border border-gray-300 bg-white text-gray-900 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-100">
                                                <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                <input
                                                    type="text"
                                                    value={query}
                                                    onChange={(e) => setQuery(e.target.value)}
                                                    placeholder="Search by make, model, or year..."
                                                    className="flex-1 bg-transparent text-xs md:text-sm focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                                    ref={searchInputRef}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                resetState();
                                            }}
                                            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-dark-700 ml-1"
                                            aria-label="Close selector"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleBack}
                                            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-dark-700 text-gray-300 hover:text-white"
                                            aria-label="Go back"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 text-sm md:text-base font-medium text-gray-900 dark:text-white ml-1 uppercase tracking-wider truncate">
                                            {selectedModel ? `${selectedMake} ${selectedModel}` : selectedMake || 'Select Make'}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                resetState();
                                            }}
                                            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-white hover:bg-dark-700 ml-1"
                                            aria-label="Close selector"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4">
                                {mode === 'search' ? (
                                    <div className="space-y-1">
                                        <SortControls />
                                        {suggestions.length > 0 ? (
                                            suggestions.map(vehicle => (
                                                <button
                                                    key={vehicle.id}
                                                    onClick={() => handleSelect(vehicle)}
                                                    className="w-full flex items-center gap-3 p-3 border-2 border-transparent rounded-xl bg-white hover:bg-blue-50 hover:border-black dark:bg-dark-800 dark:hover:bg-dark-700 transition-all text-left group"
                                                >
                                                    <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 border-2 border-black flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-primary-500/20">
                                                        <Car className="w-5 h-5 text-black dark:text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-900 dark:text-white font-bold uppercase">{vehicle.make} {vehicle.model}</div>
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-bold">{vehicle.year} • {vehicle.trim}</div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : query ? (
                                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-bold">
                                                No vehicles found matching &quot;{query}&quot;
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-medium">
                                                Type to search...
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <BrowseContent />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div >
        );
    }

    // Default 'card' variant (Original UI)
    return (
        <div ref={wrapperRef} className={clsx('relative', className)}>
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className={clsx(
                        'flex flex-col items-center justify-center gap-3',
                        'w-full h-full min-h-[240px] p-6 rounded-2xl',
                        'bg-dark-800/50 hover:bg-dark-800',
                        'border-2 border-dashed border-dark-600 hover:border-primary-500/50',
                        'transition-all duration-200 group',
                        'cursor-pointer'
                    )}
                >
                    <div className="w-14 h-14 rounded-full bg-dark-700 group-hover:bg-primary-500/10 flex items-center justify-center transition-colors">
                        <Plus className="w-7 h-7 text-gray-400 group-hover:text-primary-400" />
                    </div>
                    <div className="text-center">
                        <span className="block text-lg font-semibold text-gray-300 group-hover:text-white">Add Vehicle</span>
                        <span className="text-sm text-gray-500">Compare specs side-by-side</span>
                    </div>
                </button>
            ) : (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div
                        className="w-full max-w-3xl bg-white dark:bg-dark-900 border-3 border-black text-gray-900 dark:text-white shadow-[8px_8px_0px_0px_black] rounded-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header Controls */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50 dark:border-dark-700 dark:bg-dark-800">
                            {mode === 'browse' && !selectedMake ? (
                                <>
                                    <button
                                        onClick={() => setMode('search')}
                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-gray-300 dark:hover:text-white"
                                        aria-label="Search vehicles"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 font-semibold text-sm md:text-base text-gray-900 dark:text-white">
                                        Select Make
                                    </div>
                                </>
                            ) : mode === 'search' ? (
                                <>
                                    <button
                                        onClick={() => { setMode('browse'); setQuery(''); }}
                                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                                        aria-label="Go back"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-full border border-gray-300 bg-white text-gray-900 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-100">
                                            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                            <input
                                                type="text"
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                placeholder="Search by make, model, or year..."
                                                className="flex-1 bg-transparent text-xs md:text-sm focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
                                                ref={searchInputRef}
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleBack}
                                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                                        aria-label="Go back"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex-1 font-medium text-sm md:text-base text-gray-900 dark:text-white px-1 truncate">
                                        {selectedModel ? `${selectedMake} ${selectedModel}` : selectedMake || 'Select Make'}
                                    </div>
                                </>
                            )}

                            <button
                                onClick={() => { setIsOpen(false); resetState(); }}
                                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-black hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-700"
                                aria-label="Close selector"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4">
                            {mode === 'search' ? (
                                <div className="space-y-1">
                                    <SortControls />
                                    {suggestions.length > 0 ? (
                                        suggestions.map(vehicle => (
                                            <button
                                                key={vehicle.id}
                                                onClick={() => handleSelect(vehicle)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-transparent bg-white hover:bg-gray-100 hover:border-black dark:bg-dark-800 dark:hover:bg-dark-700 transition-colors text-left group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors">
                                                    <Car className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                                </div>
                                                <div>
                                                    <div className="text-gray-900 dark:text-white font-medium">{vehicle.make} {vehicle.model}</div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">{vehicle.year} • {vehicle.trim}</div>
                                                </div>
                                            </button>
                                        ))
                                    ) : query ? (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            <p>No vehicles found matching &quot;{query}&quot;</p>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                            Type to search...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <BrowseContent />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
