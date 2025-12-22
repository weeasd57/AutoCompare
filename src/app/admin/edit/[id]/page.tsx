'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useVehicles } from '@/context/VehicleContext';
import { getAdminAuthHeaders, isDemoAdminToken } from '@/lib/admin-client';

interface EditFormState {
    make: string;
    model: string;
    year: number | string;
    trim: string;
    base_price: string;
    horsepower: string;
    engine_cylinders: string;
    fuel_combined_mpg: string;
    drivetrain: string;
    seating_capacity: string;
    fuel_type: string;
    body_style: string;
    country: string;
    image_url: string;
}

export default function EditVehiclePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const vehicleId = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<EditFormState | null>(null);
    const { makes: existingMakes } = useVehicles();
    const [imageFiles, setImageFiles] = useState<FileList | null>(null);

    // Auth guard
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            router.push('/admin/login');
            return;
        }
        if (isDemoAdminToken(token)) {
            router.push('/admin/dashboard');
        }
    }, [router]);

    // Load vehicle data
    useEffect(() => {
        async function loadVehicle() {
            if (!vehicleId) return;
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`/api/vehicles/${vehicleId}`);
                if (!res.ok) throw new Error('Failed to load vehicle');

                const data = await res.json();
                const mapField = (val: any, fallback: any = '') =>
                    val != null ? String(val) : fallback;

                setFormData({
                    make: data.make || '',
                    model: data.model || '',
                    year: data.year ?? new Date().getFullYear(),
                    trim: data.trim || '',
                    base_price: mapField(data.base_price),
                    horsepower: mapField(data.horsepower),
                    engine_cylinders: mapField(data.engine_cylinders),
                    fuel_combined_mpg: mapField(data.fuel_combined_mpg),
                    drivetrain: data.drivetrain || '',
                    seating_capacity: mapField(data.seating_capacity),
                    fuel_type: data.fuel_type || 'Gasoline',
                    body_style: data.body_style || 'Sedan',
                    country: data.country || 'USA',
                    image_url: '',
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load vehicle');
            } finally {
                setLoading(false);
            }
        }

        loadVehicle();
    }, [vehicleId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!formData) return;
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const extractSourceUrls = (raw: string) => {
        return String(raw || '')
            .split(/[|\n\r]+/g)
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((s) => /^https?:\/\//i.test(s));
    };

    const uploadVehicleImages = async (id: string) => {
        if (!formData) return;

        const files = imageFiles ? Array.from(imageFiles) : [];
        const sourceUrls = extractSourceUrls(formData.image_url);

        if (files.length === 0 && sourceUrls.length === 0) return;

        await fetch(`/api/vehicles/${encodeURIComponent(id)}/images`, {
            method: 'DELETE',
            headers: {
                ...getAdminAuthHeaders(),
            },
        }).catch(() => {});

        const limitedFiles = files.slice(0, 5);
        const remaining = Math.max(0, 5 - limitedFiles.length);
        const limitedUrls = sourceUrls.slice(0, remaining);

        const fileUploads = limitedFiles.map((file, sortOrder) => {
            const fd = new FormData();
            fd.set('file', file);
            fd.set('sortOrder', String(sortOrder));
            return fetch(`/api/vehicles/${encodeURIComponent(id)}/images`, {
                method: 'POST',
                headers: {
                    ...getAdminAuthHeaders(),
                },
                body: fd,
            });
        });

        const urlUploads = limitedUrls.map((sourceUrl, idx) => {
            const sortOrder = limitedFiles.length + idx;
            return fetch(`/api/vehicles/${encodeURIComponent(id)}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                body: JSON.stringify({ sourceUrl, sortOrder }),
            });
        });

        await Promise.allSettled([...fileUploads, ...urlUploads]);
    };

    const broadcastVehiclesUpdated = () => {
        try {
            localStorage.setItem('autocompare_vehicles_updated_at', String(Date.now()));
        } catch {}
        window.dispatchEvent(new Event('autocompare-vehicles-updated'));
    };

    const clearImages = async () => {
        setError(null);
        try {
            await fetch(`/api/vehicles/${encodeURIComponent(vehicleId)}/images`, {
                method: 'DELETE',
                headers: {
                    ...getAdminAuthHeaders(),
                },
            });
            setImageFiles(null);
            setFormData((prev) => (prev ? { ...prev, image_url: '' } : prev));
            broadcastVehiclesUpdated();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear images');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        setSaving(true);
        setError(null);

        try {
            // Normalize make similar to AddVehicle (reuse existing brand casing)
            const rawMake = String(formData.make || '').trim();
            const normalizedMakeBase = rawMake.replace(/\s+/g, ' ');
            const existingMatch = existingMakes.find(
                (m) => m.toLowerCase() === normalizedMakeBase.toLowerCase()
            );
            const finalMake =
                existingMatch ||
                normalizedMakeBase
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');

            const res = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                body: JSON.stringify({
                    make: finalMake,
                    model: formData.model,
                    year: Number(formData.year),
                    trim: formData.trim,
                    base_price: formData.base_price ? Number(formData.base_price) : null,
                    horsepower: formData.horsepower ? Number(formData.horsepower) : null,
                    engine_cylinders: formData.engine_cylinders
                        ? Number(formData.engine_cylinders)
                        : null,
                    fuel_combined_mpg: formData.fuel_combined_mpg
                        ? Number(formData.fuel_combined_mpg)
                        : null,
                    drivetrain: formData.drivetrain || null,
                    seating_capacity: formData.seating_capacity
                        ? Number(formData.seating_capacity)
                        : null,
                    fuel_type: formData.fuel_type,
                    body_style: formData.body_style,
                    country: formData.country,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update vehicle');
            }

            await uploadVehicleImages(vehicleId);
            broadcastVehiclesUpdated();

            router.push('/admin/dashboard');
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to update vehicle');
            setSaving(false);
        }
    };

    if (loading || !formData) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 font-sans flex items-center justify-center">
                <p className="text-xl font-black">Loading vehicle...</p>
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
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black">
                        Edit Vehicle
                    </h1>
                    <span className="ml-auto text-xs font-mono text-gray-500 border border-gray-300 px-2 py-1 rounded">
                        ID: {vehicleId}
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="neo-card bg-white p-8 text-black">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-900 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold border-b-2 border-gray-100 pb-2">
                                Basic Info
                            </h3>

                            <div>
                                <label
                                    htmlFor="make"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Make
                                </label>
                                <input
                                    id="make"
                                    name="make"
                                    required
                                    value={formData.make}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="model"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Model
                                </label>
                                <input
                                    id="model"
                                    name="model"
                                    required
                                    value={formData.model}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="year"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Year
                                    </label>
                                    <input
                                        id="year"
                                        type="number"
                                        name="year"
                                        required
                                        value={formData.year}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="trim"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Trim
                                    </label>
                                    <input
                                        id="trim"
                                        name="trim"
                                        value={formData.trim}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Specs */}
                        <div className="space-y-4">
                            <h3 className="font-bold border-b-2 border-gray-100 pb-2">
                                Specifications
                            </h3>

                            <div>
                                <label
                                    htmlFor="base_price"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Price ($)
                                </label>
                                <input
                                    id="base_price"
                                    type="number"
                                    name="base_price"
                                    value={formData.base_price}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="horsepower"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Horsepower
                                    </label>
                                    <input
                                        id="horsepower"
                                        type="number"
                                        name="horsepower"
                                        value={formData.horsepower}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="engine_cylinders"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Cylinders
                                    </label>
                                    <input
                                        id="engine_cylinders"
                                        type="number"
                                        name="engine_cylinders"
                                        value={formData.engine_cylinders}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="fuel_combined_mpg"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Combined MPG
                                    </label>
                                    <input
                                        id="fuel_combined_mpg"
                                        type="number"
                                        name="fuel_combined_mpg"
                                        value={formData.fuel_combined_mpg}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="seating_capacity"
                                        className="block text-sm font-bold uppercase mb-1"
                                    >
                                        Seats
                                    </label>
                                    <input
                                        id="seating_capacity"
                                        type="number"
                                        name="seating_capacity"
                                        value={formData.seating_capacity}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="drivetrain"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Drivetrain
                                </label>
                                <select
                                    id="drivetrain"
                                    name="drivetrain"
                                    value={formData.drivetrain}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white"
                                >
                                    <option value="">Select...</option>
                                    <option value="FWD">FWD</option>
                                    <option value="RWD">RWD</option>
                                    <option value="AWD">AWD</option>
                                    <option value="4WD">4WD</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="image_url"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Import Image URL(s)
                                </label>
                                <input
                                    id="image_url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="image_files"
                                    className="block text-sm font-bold uppercase mb-1"
                                >
                                    Upload Images
                                </label>
                                <input
                                    id="image_files"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setImageFiles(e.target.files)}
                                    className="w-full p-2 border-2 border-black bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={clearImages}
                                    className="px-4 py-2 bg-red-500 text-white font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Images
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t-2 border-gray-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto px-8 py-3 bg-blue-500 text-white font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="w-5 h-5" /> Update Vehicle
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
