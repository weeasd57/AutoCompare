'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { NormalizedSpec } from '@/types/vehicle';

interface VehicleContextType {
    vehicles: NormalizedSpec[];
    makes: string[];
    models: string[];
    selectedMake: string;
    selectedModel: string;
    selectedYear: string;
    setSelectedMake: (make: string) => void;
    setSelectedModel: (model: string) => void;
    setSelectedYear: (year: string) => void;
    getSuggestions: (query: string) => NormalizedSpec[];
    searchVehicles: (query: string, limit?: number) => NormalizedSpec[];
    getVehicle: (id: string, year?: number) => NormalizedSpec | undefined;
    getVehicleSpec: (id: string, year?: number) => NormalizedSpec | undefined;
    getYearsForModel: (make: string, model: string) => number[];
    loading: boolean;
    isLoaded: boolean;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
    const [vehicles, setVehicles] = useState<NormalizedSpec[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedMake, setSelectedMake] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

    // Fetch data from API (MySQL backend)
    useEffect(() => {
        async function loadVehicles() {
            try {
                const res = await fetch('/api/vehicles', { cache: 'no-store' });
                if (!res.ok) {
                    throw new Error('Failed to load vehicles');
                }
                const data: NormalizedSpec[] = await res.json();
                setVehicles(data);
            } catch (err) {
                console.error('Failed to load vehicle data', err);
            } finally {
                setLoading(false);
            }
        }

        loadVehicles();
    }, []);

    useEffect(() => {
        const onVehiclesUpdated = () => {
            setLoading(true);
            fetch('/api/vehicles', { cache: 'no-store' })
                .then(async (res) => {
                    if (!res.ok) throw new Error('Failed to load vehicles');
                    const data: NormalizedSpec[] = await res.json();
                    setVehicles(data);
                })
                .catch((err) => {
                    console.error('Failed to reload vehicle data', err);
                })
                .finally(() => {
                    setLoading(false);
                });
        };

        const onStorage = (e: StorageEvent) => {
            if (e.key === 'autocompare_vehicles_updated_at') {
                onVehiclesUpdated();
            }
        };

        window.addEventListener('autocompare-vehicles-updated', onVehiclesUpdated as EventListener);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener(
                'autocompare-vehicles-updated',
                onVehiclesUpdated as EventListener
            );
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    // Derived Data for Dropdowns
    // Only show Makes that exist in our loaded vehicle list
    const makes = Array.from(new Set(vehicles.map((v) => v.make))).sort();

    // Only show Models for the selected Make
    const models = selectedMake
        ? Array.from(
              new Set(vehicles.filter((v) => v.make === selectedMake).map((v) => v.model))
          ).sort()
        : [];

    const getYearsForModel = (make: string, model: string) => {
        return vehicles
            .filter((v) => v.make === make && v.model === model)
            .map((v) => v.year)
            .sort((a, b) => b - a);
    };

    const getSuggestions = (query: string) => {
        if (!query || query.length < 2) return [];
        const lowerQuery = query.toLowerCase();

        return vehicles
            .filter(
                (v) =>
                    v.make.toLowerCase().includes(lowerQuery) ||
                    v.model.toLowerCase().includes(lowerQuery) ||
                    `${v.make} ${v.model}`.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 8);
    };

    const searchVehicles = (query: string, limit: number = 10) => {
        const results = getSuggestions(query);
        if (!limit || limit <= 0) return results;
        return results.slice(0, limit);
    };

    const getVehicle = (id: string, year?: number) => {
        // ID lookup strategy:
        // 1. Direct match
        const direct = vehicles.find((v) => v.id === id);
        if (direct) return direct;

        // 2. Loose match for legacy URLs or partials (fallback)
        return vehicles.find((v) => v.id.includes(id) && (!year || v.year === year));
    };

    const getVehicleSpec = (id: string, year?: number) => {
        return getVehicle(id, year);
    };

    const isLoaded = !loading;

    return (
        <VehicleContext.Provider
            value={{
                vehicles,
                makes,
                models,
                selectedMake,
                selectedModel,
                selectedYear,
                setSelectedMake,
                setSelectedModel,
                setSelectedYear,
                getSuggestions,
                searchVehicles,
                getVehicle,
                getVehicleSpec,
                getYearsForModel,
                loading,
                isLoaded,
            }}
        >
            {children}
        </VehicleContext.Provider>
    );
}

export function useVehicles() {
    const context = useContext(VehicleContext);
    if (!context) {
        throw new Error('useVehicles must be used within a VehicleProvider');
    }
    return context;
}

export function generateSpecFromSuggestion(suggestion: string): NormalizedSpec {
    // Parse suggestion like "Toyota Camry 2024" into a spec
    const parts = suggestion.split(' ');
    const year = parts[parts.length - 1];
    const model = parts[parts.length - 2];
    const make = parts.slice(0, parts.length - 2).join(' ');

    return {
        id: `${make.toLowerCase()}-${model.toLowerCase()}-${year}`,
        make,
        model,
        year: parseInt(year),
        trim: '',
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
        bodyStyle: null,
        doors: null,
        seatingCapacity: null,
        curbWeight: null,
        gvwr: null,
        payloadCapacity: null,
        towingCapacity: null,
        airbags: null,
        abs: null,
        esc: null,
        basePrice: null,
        country: null,
        manufacturer: null,
    };
}
