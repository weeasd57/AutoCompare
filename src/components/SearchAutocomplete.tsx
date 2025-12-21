// ============================================
// Search Autocomplete Component
// Smart vehicle search with fuzzy matching
// Uses local data from VehicleContext
// ============================================

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2, Car } from 'lucide-react';
import { useVehicles } from '@/context/VehicleContext';
import type { VehicleSuggestion } from '@/types/vehicle';
import { clsx } from 'clsx';

interface SearchAutocompleteProps {
    placeholder?: string;
    label?: string;
    onSelect: (suggestion: VehicleSuggestion) => void;
    className?: string;
    disabled?: boolean;
    initialValue?: string;
}

/**
 * Debounce hook for search input
 */
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * SearchAutocomplete Component
 * Provides fuzzy search for vehicles with dropdown suggestions
 * Uses local data from VehicleContext - no API calls needed
 */
export function SearchAutocomplete({
    placeholder = 'Search for a vehicle...',
    label,
    onSelect,
    className,
    disabled = false,
    initialValue = '',
}: SearchAutocompleteProps) {
    // Get search function from context
    const { searchVehicles, isLoaded } = useVehicles();

    // State
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState<VehicleSuggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Debounced query for search
    const debouncedQuery = useDebounce(query, 150); // Faster since local search

    /**
     * Search vehicles using local data
     */
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2 || !isLoaded) {
            setSuggestions([]);
            return;
        }

        // Use local search - no API calls!
        const results = searchVehicles(debouncedQuery, 8);
        // Transform NormalizedSpec to VehicleSuggestion
        const suggestions: VehicleSuggestion[] = results.map(vehicle => ({
            id: vehicle.id,
            displayName: `${vehicle.make} ${vehicle.model} ${vehicle.year}${vehicle.trim ? ` ${vehicle.trim}` : ''}`,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            trim: vehicle.trim ?? undefined,
        }));
        setSuggestions(suggestions);
    }, [debouncedQuery, searchVehicles, isLoaded]);

    /**
     * Handle input change
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(true);
        setSelectedIndex(-1);
    };

    /**
     * Handle suggestion selection
     */
    const handleSelect = (suggestion: VehicleSuggestion) => {
        setQuery(suggestion.displayName);
        setSuggestions([]);
        setIsOpen(false);
        onSelect(suggestion);
    };

    /**
     * Handle keyboard navigation
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;

            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                break;

            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;

            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    /**
     * Handle click outside to close dropdown
     */
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Clear input
     */
    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div className={clsx('relative w-full', className)}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {label}
                </label>
            )}

            {/* Input container */}
            <div className="relative">
                {/* Search icon */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {!isLoaded ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </div>

                {/* Input field */}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled || !isLoaded}
                    className={clsx(
                        'w-full pl-12 pr-12 py-4 rounded-xl',
                        'bg-dark-800/80 backdrop-blur-sm',
                        'border border-dark-600/50',
                        'text-white placeholder-gray-500',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
                        'transition-all duration-200',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        isOpen && suggestions.length > 0 && 'rounded-b-none border-b-0'
                    )}
                    aria-label={label || 'Search vehicles'}
                    aria-expanded={isOpen && suggestions.length > 0}
                    aria-autocomplete="list"
                    aria-controls="search-suggestions"
                    role="combobox"
                />

                {/* Clear button */}
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Suggestions dropdown */}
            {isOpen && (query.length >= 2 || suggestions.length > 0) && (
                <div
                    ref={dropdownRef}
                    className={clsx(
                        'absolute z-50 w-full',
                        'bg-dark-800/95 backdrop-blur-md',
                        'border border-dark-600/50 border-t-0',
                        'rounded-b-xl',
                        'shadow-2xl shadow-black/50',
                        'max-h-80 overflow-y-auto',
                        'animate-fade-in'
                    )}
                    role="listbox"
                    id="search-suggestions"
                >
                    {/* No results */}
                    {suggestions.length === 0 && query.length >= 2 && (
                        <div className="px-4 py-8 text-center text-gray-400">
                            <Car className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No vehicles found for &quot;{query}&quot;</p>
                            <p className="text-sm mt-1">Try a different search term</p>
                        </div>
                    )}

                    {/* Suggestions list */}
                    {suggestions.length > 0 && (
                        <ul className="py-2">
                            {suggestions.map((suggestion, index) => (
                                <li key={suggestion.id}>
                                    <button
                                        onClick={() => handleSelect(suggestion)}
                                        className={clsx(
                                            'w-full px-4 py-3 text-left',
                                            'flex items-center gap-3',
                                            'transition-colors duration-150',
                                            selectedIndex === index
                                                ? 'bg-primary-500/20 text-white'
                                                : 'text-gray-300 hover:bg-dark-700/50 hover:text-white'
                                        )}
                                        role="option"
                                        aria-selected={selectedIndex === index}
                                    >
                                        {/* Vehicle icon */}
                                        <div className={clsx(
                                            'w-10 h-10 rounded-lg flex items-center justify-center',
                                            'bg-gradient-to-br from-primary-500/20 to-primary-600/10',
                                            'border border-primary-500/20'
                                        )}>
                                            <Car className="w-5 h-5 text-primary-400" />
                                        </div>

                                        {/* Vehicle info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">
                                                {suggestion.displayName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {suggestion.make} • {suggestion.year}
                                            </p>
                                        </div>

                                        {/* Match score indicator */}
                                        {suggestion.score !== undefined && suggestion.score < 0.3 && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                                Best Match
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
