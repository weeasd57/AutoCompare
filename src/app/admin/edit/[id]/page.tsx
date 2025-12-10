'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useVehicles } from '@/context/VehicleContext';
import { ThemeToggle } from '@/components/ThemeToggle';

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

    // Auth guard
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            router.push('/admin/login');
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
                if (!res.ok) {
                    throw new Error('Failed to load vehicle');
                }
                const data: any = await res.json();

                const nextForm: EditFormState = {
                    make: data.make || '',
                    model: data.model || '',
                    year: data.year ?? new Date().getFullYear(),
                    trim: data.trim || '',
                    base_price: data.base_price != null ? String(data.base_price) : '',
                    horsepower: data.horsepower != null ? String(data.horsepower) : '',
                    engine_cylinders: data.engine_cylinders != null ? String(data.engine_cylinders) : '',
                    fuel_combined_mpg: data.fuel_combined_mpg != null ? String(data.fuel_combined_mpg) : '',
                    drivetrain: data.drivetrain || '',
                    seating_capacity: data.seating_capacity != null ? String(data.seating_capacity) : '',
                    fuel_type: data.fuel_type || 'Gasoline',
                    body_style: data.body_style || 'Sedan',
                    country: data.country || 'USA',
                    image_url: data.image_url || '',
                };

                setFormData(nextForm);
            } catch (err) {
                console.error(err);
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
            const finalMake = existingMatch || normalizedMakeBase
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            const res = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    make: finalMake,
                    model: formData.model,
                    year: Number(formData.year),
                    trim: formData.trim,
                    base_price: formData.base_price ? Number(formData.base_price) : null,
                    horsepower: formData.horsepower ? Number(formData.horsepower) : null,
                    engine_cylinders: formData.engine_cylinders ? Number(formData.engine_cylinders) : null,
                    fuel_combined_mpg: formData.fuel_combined_mpg ? Number(formData.fuel_combined_mpg) : null,
                    drivetrain: formData.drivetrain || null,
                    seating_capacity: formData.seating_capacity ? Number(formData.seating_capacity) : null,
                    fuel_type: formData.fuel_type,
                    body_style: formData.body_style,
                    country: formData.country,
                    image_url: formData.image_url || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update vehicle');
            }

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
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>
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
                            <h3 className="font-bold border-b-2 border-gray-100 pb-2">Basic Info</h3>

                            <div>
                                <label className="block text-sm font-bold uppercase mb-1">Make</label>
                                <input
                                    name="make"
                                    required
                                    value={formData.make}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold uppercase mb-1">Model</label>
                                <input
                                    name="model"
                                    required
                                    value={formData.model}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Year</label>
                                    <input
                                        type="number"
                                        name="year"
                                        required
                                        value={formData.year}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Trim</label>
                                    <input
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
                            <h3 className="font-bold border-b-2 border-gray-100 pb-2">Specifications</h3>

                            <div>
                                <label className="block text-sm font-bold uppercase mb-1">Price ($)</label>
                                <input
                                    type="number"
                                    name="base_price"
                                    value={formData.base_price}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Horsepower</label>
                                    <input
                                        type="number"
                                        name="horsepower"
                                        value={formData.horsepower}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Cylinders</label>
                                    <input
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
                                    <label className="block text-sm font-bold uppercase mb-1">Combined MPG</label>
                                    <input
                                        type="number"
                                        name="fuel_combined_mpg"
                                        value={formData.fuel_combined_mpg}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Seats</label>
                                    <input
                                        type="number"
                                        name="seating_capacity"
                                        value={formData.seating_capacity}
                                        onChange={handleChange}
                                        className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold uppercase mb-1">Drivetrain</label>
                                <select
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
                                <label className="block text-sm font-bold uppercase mb-1">Image URL</label>
                                <input
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t-2 border-gray-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto px-8 py-3 bg-blue-500 text-white font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : <><Save className="w-5 h-5" /> Update Vehicle</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
