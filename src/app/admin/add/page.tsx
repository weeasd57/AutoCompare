'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useVehicles } from '@/context/VehicleContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AddVehicle() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { makes: existingMakes } = useVehicles();

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
        }
    }, [router]);

    // Form Fields (Basic Set for Demo)
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        trim: '',
        base_price: '',
        horsepower: '',
        engine_cylinders: '',
        fuel_combined_mpg: '',
        drivetrain: '',
        seating_capacity: '',
        fuel_type: 'Gasoline',
        body_style: 'Sedan',
        country: 'USA',
        image_url: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Normalize make to reuse existing brands (case-insensitive)
            const rawMake = String(formData.make || '').trim();
            const normalizedMakeBase = rawMake.replace(/\s+/g, ' ');
            const existingMatch = existingMakes.find(
                (m) => m.toLowerCase() === normalizedMakeBase.toLowerCase()
            );
            const finalMake = existingMatch || normalizedMakeBase
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            // 1. Generate ID (Slug)
            const id = `${finalMake}-${formData.model}-${formData.year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

            const imageUrl = formData.image_url || null;

            // 2. Insert Record via API
            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    make: finalMake,
                    model: formData.model,
                    year: Number(formData.year),
                    trim: formData.trim,
                    base_price: Number(formData.base_price) || 0,
                    horsepower: Number(formData.horsepower) || 0,
                    engine_cylinders: Number(formData.engine_cylinders) || 0,
                    fuel_combined_mpg: formData.fuel_combined_mpg ? Number(formData.fuel_combined_mpg) : null,
                    drivetrain: formData.drivetrain || null,
                    seating_capacity: formData.seating_capacity ? Number(formData.seating_capacity) : null,
                    fuel_type: formData.fuel_type,
                    body_style: formData.body_style,
                    country: formData.country,
                    image_url: imageUrl
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add vehicle');
            }

            // Success
            router.push('/admin/dashboard');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add vehicle');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neo-grid p-8 font-sans text-black">
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/dashboard" className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors text-black">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black">
                        Add New Vehicle
                    </h1>
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
                                <input name="make" required value={formData.make} onChange={handleChange} className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none" placeholder="Ford" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold uppercase mb-1">Model</label>
                                <input name="model" required value={formData.model} onChange={handleChange} className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none" placeholder="F-150" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Year</label>
                                    <input type="number" name="year" required value={formData.year} onChange={handleChange} className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Trim</label>
                                    <input name="trim" value={formData.trim} onChange={handleChange} className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none" placeholder="XLT" />
                                </div>
                            </div>
                        </div>

                        {/* Specs */}
                        <div className="space-y-4">
                            <h3 className="font-bold border-b-2 border-gray-100 pb-2">Specifications</h3>

                            <div>
                                <label className="block text-sm font-bold uppercase mb-1">Price ($)</label>
                                <input type="number" name="base_price" required value={formData.base_price} onChange={handleChange} className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Horsepower</label>
                                    <input type="number" name="horsepower" value={formData.horsepower} onChange={handleChange} className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase mb-1">Cylinders</label>
                                    <input type="number" name="engine_cylinders" value={formData.engine_cylinders} onChange={handleChange} className="w-full p-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
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
                            disabled={loading}
                            className="w-full md:w-auto px-8 py-3 bg-green-500 text-white font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : <><Save className="w-5 h-5" /> Save Vehicle</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
