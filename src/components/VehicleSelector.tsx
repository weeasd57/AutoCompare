// ============================================
// Vehicle Selector Component
// Dropdown/Search to add vehicles to comparison
// ============================================

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, X, Car, ChevronRight, ArrowLeft, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import type { NormalizedSpec } from '@/types/vehicle';
import { getBrandLogoUrl } from '@/lib/logos';
import { useVehicles } from '@/context/VehicleContext';

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

    // Browse state
    const [selectedMake, setSelectedMake] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    // State management
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Use vehicles from context as primary source
    const { vehicles: contextVehicles, makes: contextMakes, models: contextModels } = useVehicles();

    const allVehicles = useMemo(() => contextVehicles, [contextVehicles]);

    const { makeMap } = useMemo(() => getAvailableOptions(allVehicles), [allVehicles]);

    // Sort makes alphabetically
    const makes = useMemo(() => {
        return [...contextMakes]
            .filter(make => make) // Filter out undefined makes
            .sort((a, b) => a.localeCompare(b));
    }, [contextMakes]);

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
        ).slice(0, 10);

        setSuggestions(filtered);
    }, [query, allVehicles]);

    const handleSelect = (vehicle: NormalizedSpec) => {
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
    }, [selectedMake, makeMap, contextMakes, contextModels]);

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

    const BrowseContent = () => (
        <div className="space-y-1">
            {!selectedMake ? (
                // Make Selection
                <div className="grid grid-cols-2 gap-2">
                    {makes.map(make => (
                        <button
                            key={make}
                            onClick={() => setSelectedMake(make)}
                            className={clsx(
                                "flex items-center gap-3 p-3 border-2 transition-all text-left",
                                variant === 'input'
                                    ? "bg-white border-gray-200 hover:border-black hover:bg-yellow-50 hover:shadow-[2px_2px_0px_0px_black]"
                                    : "flex-col p-4 rounded-xl bg-dark-700/30 hover:bg-dark-700 border-dark-600/30 hover:border-dark-500 text-center"
                            )}
                        >
                            <div className={clsx(
                                "flex items-center justify-center",
                                variant === 'input' ? "w-8 h-8" : "mb-2 w-12 h-12 p-1"
                            )}>
                                {/* Use object for faster loading/error handling */}
                                <img
                                    src={getBrandLogoUrl(make)}
                                    alt={make}
                                    className={clsx(
                                        "w-full h-full object-contain",
                                        variant !== 'input' && "filter invert brightness-0 sm:invert-0 sm:brightness-100 dark:invert"
                                    )}
                                    onError={(e) => {
                                        // Fallback to text circle
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                                <div className="hidden w-8 h-8 rounded-full bg-gray-100 border border-black flex items-center justify-center font-black text-black text-xs">
                                    {make[0]}
                                </div>
                            </div>
                            <span className={clsx(
                                "font-medium",
                                variant === 'input' ? "text-black uppercase font-bold" : "text-sm text-gray-300 group-hover:text-white"
                            )}>{make}</span>
                        </button>
                    ))}
                </div>
            ) : !selectedModel ? (
                // Model Selection
                <div className="space-y-1">
                    {browseModels.map(model => (
                        <button
                            key={model}
                            onClick={() => setSelectedModel(model)}
                            className={clsx(
                                "w-full flex items-center justify-between p-3 border-2 border-transparent transition-all text-left group",
                                variant === 'input'
                                    ? "hover:border-black hover:bg-gray-100"
                                    : "rounded-xl hover:bg-dark-700"
                            )}
                        >
                            <span className={clsx(
                                "font-medium uppercase",
                                variant === 'input' ? "text-black font-bold" : "text-white"
                            )}>{model}</span>
                            <ChevronRight className={clsx("w-4 h-4", variant === 'input' ? "text-black" : "text-gray-600 group-hover:text-white")} />
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
                                className={clsx(
                                    "w-full flex items-center gap-3 p-3 border-2 border-transparent transition-all text-left group",
                                    variant === 'input'
                                        ? "hover:bg-green-50 hover:border-black"
                                        : "rounded-xl hover:bg-dark-700"
                                )}
                            >
                                <div className={clsx(
                                    "w-10 h-10 flex items-center justify-center transition-colors",
                                    variant === 'input'
                                        ? "bg-white border-2 border-black group-hover:bg-green-200"
                                        : "rounded-lg bg-dark-600 group-hover:bg-primary-500/20 group-hover:text-primary-400"
                                )}>
                                    <Car className={clsx("w-5 h-5", variant === 'input' ? "text-black" : "text-gray-400")} />
                                </div>
                                <div>
                                    <div className={clsx(
                                        "font-medium uppercase",
                                        variant === 'input' ? "text-black font-bold" : "text-white"
                                    )}>{vehicle.make} {vehicle.model}</div>
                                    <div className={clsx("text-xs", variant === 'input' ? "text-gray-500 font-bold" : "text-gray-400")}>
                                        {vehicle.year} • {vehicle.trim}
                                    </div>
                                </div>
                                <div className="ml-auto text-xs font-mono text-gray-500">
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
                                    trim: 'Base', // Fallback
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
                                className={clsx(
                                    "w-full flex items-center gap-3 p-3 border-2 border-transparent transition-all text-left group",
                                    variant === 'input'
                                        ? "hover:bg-yellow-50 hover:border-black"
                                        : "rounded-xl hover:bg-dark-700"
                                )}
                            >
                                <div className={clsx(
                                    "w-10 h-10 flex items-center justify-center transition-colors",
                                    variant === 'input'
                                        ? "bg-white border-2 border-black group-hover:bg-yellow-200"
                                        : "rounded-lg bg-dark-600 group-hover:bg-primary-500/20 group-hover:text-primary-400"
                                )}>
                                    <span className={clsx(
                                        "font-bold text-xs",
                                        variant === 'input' ? "text-black" : "text-gray-400 group-hover:text-primary-400"
                                    )}>{year}</span>
                                </div>
                                <div>
                                    <div className={clsx(
                                        "font-medium uppercase",
                                        variant === 'input' ? "text-black font-bold" : "text-white"
                                    )}>{selectedMake} {selectedModel}</div>
                                    <div className={clsx("text-xs", variant === 'input' ? "text-gray-500 font-bold" : "text-gray-400")}>Select Year</div>
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
                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400 border-2 border-black font-bold text-xs uppercase hover:bg-yellow-300 transition-colors shadow-[2px_2px_0px_0px_black] active:translate-y-[1px] active:shadow-none"
                        >
                            <Filter className="w-3 h-3" />
                            Browse
                        </button>
                    </div>
                </div>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border-3 border-black shadow-[8px_8px_0px_0px_black] max-h-[400px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                        {/* Header for Back Button in Input Mode */}
                        {(selectedMake || mode === 'search') && (
                            <div className="flex items-center gap-2 p-3 border-b-2 border-black bg-gray-50">
                                <button
                                    onClick={mode === 'search' ? () => { setMode('browse'); setQuery(''); } : handleBack}
                                    className="flex items-center gap-1 text-sm font-bold uppercase text-black hover:text-blue-600"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <div className="text-sm font-medium text-gray-500 ml-auto uppercase tracking-wider">
                                    {mode === 'search' ? 'Search Results' : selectedModel ? `${selectedMake} ${selectedModel}` : selectedMake || 'Select Make'}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {mode === 'search' ? (
                                <div className="space-y-1">
                                    {suggestions.length > 0 ? (
                                        suggestions.map(vehicle => (
                                            <button
                                                key={vehicle.id}
                                                onClick={() => handleSelect(vehicle)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 border-2 border-transparent hover:border-black transition-all text-left group"
                                            >
                                                <div className="w-10 h-10 bg-gray-100 border-2 border-black flex items-center justify-center group-hover:bg-blue-200">
                                                    <Car className="w-5 h-5 text-black" />
                                                </div>
                                                <div>
                                                    <div className="text-black font-bold uppercase">{vehicle.make} {vehicle.model}</div>
                                                    <div className="text-xs text-gray-500 font-bold">{vehicle.year} • {vehicle.trim}</div>
                                                </div>
                                            </button>
                                        ))
                                    ) : query ? (
                                        <div className="p-8 text-center text-gray-500 font-bold">
                                            No vehicles found matching "{query}"
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 font-medium">
                                            Type to search...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <BrowseContent />
                            )}
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
                <div className="w-full h-full min-h-[350px] bg-dark-800 border border-dark-600 rounded-2xl p-4 shadow-xl flex flex-col">
                    {/* Header Controls */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dark-700">
                        {(selectedMake || mode === 'search') ? (
                            <button
                                onClick={mode === 'search' ? () => { setMode('browse'); setQuery(''); } : handleBack}
                                className="p-1 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <Search className="w-5 h-5 text-gray-400 ml-1" />
                        )}

                        {mode === 'browse' && !selectedMake ? (
                            <div className="flex-1 flex gap-2">
                                <button className="flex-1 text-left font-medium text-white px-2">Select Make</button>
                                <button onClick={() => setMode('search')} className="p-1 text-gray-400 hover:text-white">
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        ) : mode === 'browse' ? (
                            <div className="flex-1 font-medium text-white px-2">
                                {selectedMake} {selectedModel ? `/ ${selectedModel}` : ''}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search make or model..."
                                className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder-gray-500 text-sm"
                                autoFocus
                            />
                        )}

                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {mode === 'search' ? (
                            <div className="space-y-1">
                                {suggestions.length > 0 ? (
                                    suggestions.map(vehicle => (
                                        <button
                                            key={vehicle.id}
                                            onClick={() => handleSelect(vehicle)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-dark-700 transition-colors text-left group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors">
                                                <Car className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{vehicle.make} {vehicle.model}</div>
                                                <div className="text-xs text-gray-500">{vehicle.year} • {vehicle.trim}</div>
                                            </div>
                                        </button>
                                    ))
                                ) : query ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <p>No vehicles found matching "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500">
                                        Type to search...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <BrowseContent />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
