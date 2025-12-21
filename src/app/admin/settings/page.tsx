"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Settings,
    Database,
    Download,
    Upload,
    Palette,
    ChevronLeft,
    Save,
    AlertCircle,
    CheckCircle,
    Loader2,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { getAdminAuthHeaders, isDemoAdminToken } from '@/lib/admin-client';

interface SettingsState {
    siteName: string;
    siteDescription: string;
    primaryColor: string;
    enableComparison: boolean;
    maxCompareVehicles: number;
    showPrices: boolean;
    currency: string;
    enableExportShareButton: boolean;
    homeHeroImageUrl: string;
}

const defaultSettings: SettingsState = {
    siteName: 'AutoCompare',
    siteDescription: 'Compare vehicles side by side',
    primaryColor: '#facc15',
    enableComparison: true,
    maxCompareVehicles: 4,
    showPrices: true,
    currency: 'USD',
    enableExportShareButton: false,
    homeHeroImageUrl: '',
};
export default function AdminSettings() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingSample, setLoadingSample] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const toast = useToast();
    const [settings, setSettings] = useState<SettingsState>(defaultSettings);
    const [stats, setStats] = useState({ vehicles: 0, comparisons: 0 });
    const heroFileInputRef = useRef<HTMLInputElement | null>(null);
    const [heroUploading, setHeroUploading] = useState(false);
    const [heroPreviewBust, setHeroPreviewBust] = useState<number>(0);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        setIsDemo(isDemoAdminToken(token));

        // Load settings from API
        fetchSettings();

        // Load stats
        fetchStats();
    }, [router]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/vehicles');
            const data = await res.json();
            setStats({
                vehicles: Array.isArray(data) ? data.length : 0,
                comparisons: parseInt(localStorage.getItem('comparison_count') || '0', 10),
            });
        } catch (err) {
            console.error('Failed to fetch stats', err);
        }
    };

    const handleHeroImageSelected = async (file: File | null) => {
        if (!file) return;

        if (isDemo) {
            toast.error('Demo admin is read-only');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setHeroUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/settings/hero-image', {
                method: 'POST',
                headers: {
                    ...getAdminAuthHeaders(),
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to upload hero image');
            }

            if (data.imageUrl) {
                const url = String(data.imageUrl);
                setSettings(prev => ({ ...prev, homeHeroImageUrl: url }));
                setHeroPreviewBust(Date.now());
                try {
                    localStorage.setItem('autocompare_settings_updated_at', String(Date.now()));
                } catch {}
                window.dispatchEvent(new Event('autocompare-settings-updated'));
            }

            toast.success('Hero image updated successfully');
        } catch (err: any) {
            console.error('Hero image upload failed', err);
            toast.error(err?.message || 'Failed to upload hero image');
        } finally {
            setHeroUploading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (res.ok && Object.keys(data).length > 0) {
                // specific keys type safe assignment
                const newSettings = { ...defaultSettings };
                if (data.siteName) newSettings.siteName = data.siteName;
                if (data.siteDescription) newSettings.siteDescription = data.siteDescription;
                if (data.primaryColor) newSettings.primaryColor = data.primaryColor;
                if (data.currency) newSettings.currency = data.currency;

                // Handle booleans/numbers that might come as strings if not parsed correctly (though API tries to parse)
                if (data.enableComparison !== undefined) newSettings.enableComparison = [true, 'true', 1].includes(data.enableComparison);
                if (data.showPrices !== undefined) newSettings.showPrices = [true, 'true', 1].includes(data.showPrices);
                if (data.enableExportShareButton !== undefined) {
                    newSettings.enableExportShareButton = [true, 'true', 1].includes(data.enableExportShareButton);
                }
                if (data.homeHeroImageUrl) newSettings.homeHeroImageUrl = data.homeHeroImageUrl;
                if (data.maxCompareVehicles) newSettings.maxCompareVehicles = Number(data.maxCompareVehicles);

                setSettings(newSettings);
            }
        } catch (err) {
            console.error('Failed to load settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (isDemo) {
            toast.error('Demo admin is read-only');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast.success('Settings saved to database successfully!');
            } else {
                throw new Error('Failed to save');
            }
        } catch (err) {
            toast.error('Failed to save settings');
        }
        setSaving(false);
    };

    const handleLoadSampleData = async () => {
        if (isDemo) {
            toast.error('Demo admin is read-only');
            return;
        }
        setLoadingSample(true);

        try {
            const res = await fetch('/api/sample-data', {
                method: 'POST',
                headers: {
                    ...getAdminAuthHeaders(),
                },
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                fetchStats();
            } else {
                toast.error(data.error || 'Failed to load sample data');
            }
        } catch (err) {
            toast.error('Network error loading sample data');
        }

        setLoadingSample(false);
    };

    const handleClearData = async () => {
        if (isDemo) {
            toast.error('Demo admin is read-only');
            return;
        }
        if (!confirm('Are you sure you want to delete ALL vehicles? This cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch('/api/vehicles/clear', {
                method: 'DELETE',
                headers: {
                    ...getAdminAuthHeaders(),
                },
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('All vehicles deleted successfully');
                fetchStats();
            } else {
                toast.error(data.error || 'Failed to clear data');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-bold text-xl">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                Loading Settings...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neo-grid p-8 font-sans text-black">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/admin/dashboard"
                        className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                            Settings
                        </h1>
                        <p className="text-gray-500 font-medium">Manage your AutoCompare configuration</p>
                        {isDemo && (
                            <p className="text-xs font-bold uppercase text-orange-600 mt-1">
                                Demo admin (read-only)
                            </p>
                        )}
                    </div>
                    <div className="ml-auto" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Database Stats */}
                    <div className="neo-card bg-white p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500 border-2 border-black flex items-center justify-center">
                                <Database className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-black uppercase">Database</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
                                <span className="font-bold">Total Vehicles</span>
                                <span className="text-2xl font-black text-blue-600">{stats.vehicles}</span>
                            </div>

                            <button
                                onClick={handleLoadSampleData}
                                disabled={loadingSample || isDemo}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                            >
                                {loadingSample ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Download className="w-5 h-5" />
                                )}
                                Load Sample Data
                            </button>

                            <button
                                onClick={handleClearData}
                                disabled={isDemo}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                                Clear All Data
                            </button>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="neo-card bg-white p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-500 border-2 border-black flex items-center justify-center">
                                <Palette className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-black uppercase">Appearance</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="siteName" className="block text-sm font-bold uppercase mb-1">
                                    Site Name
                                </label>
                                <input
                                    id="siteName"
                                    type="text"
                                    value={settings.siteName}
                                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                    disabled={isDemo}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="primaryColor" className="block text-sm font-bold uppercase mb-1">
                                    Primary Color
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="primaryColor"
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        disabled={isDemo}
                                        className="w-12 h-10 border-2 border-black cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        disabled={isDemo}
                                        className="flex-1 p-2 border-2 border-black font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="currency" className="block text-sm font-bold uppercase mb-1">
                                    Currency
                                </label>
                                <select
                                    id="currency"
                                    value={settings.currency}
                                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    disabled={isDemo}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="SAR">SAR</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="homeHeroImageFile" className="block text-sm font-bold uppercase mb-1">
                                    Home Hero Image (PNG)
                                </label>
                                <div className="space-y-3">
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => {
                                            if (isDemo) return;
                                            heroFileInputRef.current?.click();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                if (isDemo) return;
                                                heroFileInputRef.current?.click();
                                            }
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (isDemo) return;
                                            const file = e.dataTransfer.files?.[0];
                                            if (file) {
                                                void handleHeroImageSelected(file);
                                            }
                                        }}
                                        className="border-2 border-dashed border-gray-300 hover:border-yellow-400 p-4 text-center cursor-pointer transition-colors bg-gray-50"
                                    >
                                        <input
                                            id="homeHeroImageFile"
                                            ref={heroFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={isDemo}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                void handleHeroImageSelected(file);
                                            }}
                                        />

                                        {settings.homeHeroImageUrl ? (
                                            <div className="space-y-1">
                                                <p className="font-bold text-sm">Drop a new image here or click to change</p>
                                                <p className="text-xs text-gray-500 break-all">Current URL: {settings.homeHeroImageUrl}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="font-bold text-sm">Drop hero PNG here or click to upload</p>
                                                <p className="text-xs text-gray-500">Recommended transparent PNG with wide aspect ratio.</p>
                                            </>
                                        )}

                                        {heroUploading && (
                                            <div className="mt-2 inline-flex items-center justify-center gap-2 text-xs text-gray-700">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Uploading image...</span>
                                            </div>
                                        )}
                                    </div>

                                    {settings.homeHeroImageUrl && (
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-32 h-20 border-2 border-black bg-gray-100 overflow-hidden">
                                                <Image
                                                    src={
                                                        heroPreviewBust
                                                            ? (settings.homeHeroImageUrl.includes('?')
                                                                ? `${settings.homeHeroImageUrl}&t=${heroPreviewBust}`
                                                                : `${settings.homeHeroImageUrl}?t=${heroPreviewBust}`)
                                                            : settings.homeHeroImageUrl
                                                    }
                                                    alt="Home hero preview"
                                                    fill
                                                    sizes="128px"
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Preview of the current hero image as it will appear on the home page.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Settings */}
                    <div className="neo-card bg-white p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-yellow-500 border-2 border-black flex items-center justify-center">
                                <Settings className="w-5 h-5 text-black" />
                            </div>
                            <h2 className="text-xl font-black uppercase">Comparison</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="maxCompare" className="block text-sm font-bold uppercase mb-1">
                                    Max Vehicles to Compare
                                </label>
                                <input
                                    id="maxCompare"
                                    type="number"
                                    min="2"
                                    max="10"
                                    value={settings.maxCompareVehicles}
                                    onChange={(e) =>
                                        setSettings({ ...settings, maxCompareVehicles: parseInt(e.target.value, 10) })
                                    }
                                    disabled={isDemo}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black">
                                <input
                                    id="showPrices"
                                    type="checkbox"
                                    checked={settings.showPrices}
                                    onChange={(e) => setSettings({ ...settings, showPrices: e.target.checked })}
                                    disabled={isDemo}
                                    className="w-5 h-5 accent-yellow-500"
                                />
                                <label htmlFor="showPrices" className="font-bold">
                                    Show Prices
                                </label>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black">
                                <input
                                    id="enableExportShareButton"
                                    type="checkbox"
                                    checked={settings.enableExportShareButton}
                                    onChange={(e) => setSettings({ ...settings, enableExportShareButton: e.target.checked })}
                                    disabled={isDemo}
                                    className="w-5 h-5 accent-yellow-500"
                                />
                                <label htmlFor="enableExportShareButton" className="font-bold">
                                    Enable Export Share Button
                                </label>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-black">
                                <input
                                    id="enableComparison"
                                    type="checkbox"
                                    checked={settings.enableComparison}
                                    onChange={(e) => setSettings({ ...settings, enableComparison: e.target.checked })}
                                    disabled={isDemo}
                                    className="w-5 h-5 accent-yellow-500"
                                />
                                <label htmlFor="enableComparison" className="font-bold">
                                    Enable Comparison Feature
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Import/Export */}
                    <div className="neo-card bg-white p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-500 border-2 border-black flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-black uppercase">Data Management</h2>
                        </div>

                        <div className="space-y-4">
                            {!isDemo ? (
                                <Link
                                    href="/admin/import"
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                >
                                    <Upload className="w-5 h-5" />
                                    Import CSV
                                </Link>
                            ) : (
                                <div className="w-full flex items-center justify-center gap-2 py-3 bg-white font-bold uppercase border-2 border-black opacity-50 cursor-not-allowed">
                                    <Upload className="w-5 h-5" />
                                    Import CSV
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    window.location.href = '/api/vehicles/export';
                                }}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8">
                    <button
                        onClick={handleSave}
                        disabled={saving || isDemo}
                        className="w-full md:w-auto px-8 py-3 bg-yellow-400 text-black font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
