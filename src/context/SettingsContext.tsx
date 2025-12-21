'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppSettings {
    siteName: string;
    siteDescription: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    primaryColor: string;
    enableComparison: boolean;
    maxCompareVehicles: number;
    showPrices: boolean;
    currency: string;
    enableExportShareButton: boolean;
    homeHeroImageUrl: string;
}

const defaultSettings: AppSettings = {
    siteName: 'AutoCompare',
    siteDescription: 'Compare vehicles side by side',
    seoTitle: 'AutoCompare - Smart Vehicle Comparison',
    seoDescription: 'Compare vehicles side-by-side with smart insights. Find the perfect car by comparing specs, fuel economy, pricing, and more.',
    seoKeywords: 'car comparison, vehicle specs, auto compare, car buying, vehicle comparison tool',
    primaryColor: '#facc15',
    enableComparison: true,
    maxCompareVehicles: 4,
    showPrices: true,
    currency: 'USD',
    enableExportShareButton: false,
    homeHeroImageUrl: '',
};

interface SettingsContextType {
    settings: AppSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    loading: true,
    refreshSettings: async () => { },
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings', { cache: 'no-store' });
            const data = await res.json();

            if (res.ok && Object.keys(data).length > 0) {
                const newSettings = { ...defaultSettings };

                // Map API response to settings object
                if (data.siteName) newSettings.siteName = data.siteName;
                if (data.siteDescription) newSettings.siteDescription = data.siteDescription;
                if (data.seoTitle) newSettings.seoTitle = data.seoTitle;
                if (data.seoDescription) newSettings.seoDescription = data.seoDescription;
                if (data.seoKeywords) newSettings.seoKeywords = data.seoKeywords;
                if (data.primaryColor) newSettings.primaryColor = data.primaryColor;
                if (data.currency) newSettings.currency = data.currency;
                if (data.homeHeroImageUrl) newSettings.homeHeroImageUrl = data.homeHeroImageUrl;

                // Parse booleans/numbers safely
                if (data.enableComparison !== undefined) {
                    newSettings.enableComparison = [true, 'true', 1].includes(data.enableComparison);
                }
                if (data.showPrices !== undefined) {
                    newSettings.showPrices = [true, 'true', 1].includes(data.showPrices);
                }
                if (data.enableExportShareButton !== undefined) {
                    newSettings.enableExportShareButton = [true, 'true', 1].includes(data.enableExportShareButton);
                }
                if (data.maxCompareVehicles) {
                    newSettings.maxCompareVehicles = Number(data.maxCompareVehicles);
                }

                setSettings(newSettings);
            }
        } catch (err) {
            console.error('Failed to load global settings', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const onSettingsUpdated = () => {
            void fetchSettings();
        };

        const onStorage = (e: StorageEvent) => {
            if (e.key === 'autocompare_settings_updated_at') {
                void fetchSettings();
            }
        };

        window.addEventListener('autocompare-settings-updated', onSettingsUpdated as EventListener);
        window.addEventListener('storage', onStorage);

        return () => {
            window.removeEventListener('autocompare-settings-updated', onSettingsUpdated as EventListener);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
