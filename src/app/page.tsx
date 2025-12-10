// ============================================
// Home Page - AutoCompare Landing
// Premium design with vehicle search
// Uses local data from VehicleContext
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, BarChart2, FileText, Sparkles, Car, ChevronDown, Truck, CarFront } from 'lucide-react';
import { VehicleSelector } from '@/components/VehicleSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCompareStore } from '@/store/compare-store';
import { useVehicles } from '@/context/VehicleContext';
import type { NormalizedSpec } from '@/types/vehicle';
import { clsx } from 'clsx';

/**
 * Feature card data
 */
const FEATURES = [
    {
        icon: Zap,
        title: 'Smart Search',
        description: 'Find any vehicle instantly with fuzzy search. Just start typing!',
        color: 'from-amber-500/20 to-amber-600/10',
        iconColor: 'text-amber-400',
    },
    {
        icon: BarChart2,
        title: 'Spec Comparison',
        description: 'Side-by-side specs comparison with winner highlighting.',
        color: 'from-green-500/20 to-green-600/10',
        iconColor: 'text-green-400',
    },
    {
        icon: Sparkles,
        title: 'Key Insights',
        description: 'Get instant insights on which vehicle wins in each category.',
        color: 'from-primary-500/20 to-primary-600/10',
        iconColor: 'text-primary-400',
    },
    {
        icon: FileText,
        title: 'PDF Export',
        description: 'Download your comparison as a professional PDF report.',
        color: 'from-purple-500/20 to-purple-600/10',
        iconColor: 'text-purple-400',
    },
];


/**
 * Home Page Component
 */
export default function HomePage() {
    const router = useRouter();
    const { addVehicle, clearVehicles, reset } = useCompareStore();
    const { isLoaded } = useVehicles();

    // Selected vehicles state (use full specs from selector)
    const [selectedA, setSelectedA] = useState<NormalizedSpec | null>(null);
    const [selectedB, setSelectedB] = useState<NormalizedSpec | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Reset store on mount
    useEffect(() => {
        reset();
    }, [reset]);

    /**
     * Handle vehicle selection
     */
    const handleSelectVehicleA = (vehicle: NormalizedSpec) => {
        setSelectedA(vehicle);
    };

    const handleSelectVehicleB = (vehicle: NormalizedSpec) => {
        setSelectedB(vehicle);
    };

    /**
     * Handle compare button click
     * Uses local data - no API calls needed!
     */
    const handleCompare = async () => {
        if (!selectedA || !selectedB) {
            alert('Please select two vehicles to compare');
            return;
        }

        setIsLoading(true);

        try {
            // Set vehicles in store directly from selected specs
            clearVehicles();
            addVehicle(selectedA);
            addVehicle(selectedB);

            // Navigate to compare page
            router.push('/compare');

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to load vehicle data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle popular comparison click
     */
    // const handlePopularComparison = (comparison: any) => {
    //     // Get specs from local database
    //     const specA = getVehicleSpec(comparison.aId);
    //     const specB = getVehicleSpec(comparison.bId);

    //     if (specA && specB) {
    //         clearVehicles();
    //         addVehicle(specA);
    //         addVehicle(specB);
    //         router.push('/compare');
    //     } else {
    //         // Set as suggestions if specs not found
    //         setSelectedA({
    //             id: comparison.aId,
    //             displayName: comparison.a,
    //             make: comparison.a.split(' ')[0],
    //             model: comparison.a.split(' ').slice(1).join(' '),
    //             year: 2024,
    //         });
    //         setSelectedB({
    //             id: comparison.bId,
    //             displayName: comparison.b,
    //             make: comparison.b.split(' ')[0],
    //             model: comparison.b.split(' ').slice(1).join(' '),
    //             year: 2024,
    //         });
    //     }
    // };

    return (
        <div className="min-h-screen bg-neo-grid">
            {/* Theme Toggle - Fixed Position */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-4 overflow-hidden">
                <div className="relative max-w-6xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 border-2 border-black shadow-[4px_4px_0px_0px_black] mb-8 transform -rotate-2 hover:rotate-0 transition-transform">
                        <Sparkles className="w-4 h-4 text-black" />
                        <span className="text-sm font-black uppercase text-black">Auto Compare</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase leading-tight tracking-tight">
                        <span className="bg-black text-white px-4 py-1 transform skew-x-[-10deg] inline-block">Compare</span>
                        <br />
                        <span className="text-black">Like Never Before</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl font-bold text-gray-600 max-w-2xl mx-auto mb-12 border-l-4 border-black pl-4 text-left md:text-center md:border-l-0 md:pl-0">
                        Find your perfect vehicle by comparing specs, fuel economy, pricing, and more.
                        Get instant insights to make the right choice.
                    </p>

                    {/* Search Section */}
                    <div className="max-w-4xl mx-auto">
                        <div className="p-8 bg-white border-3 border-black shadow-[8px_8px_0px_0px_black]">
                            {/* Loading state */}
                            {!isLoaded && (
                                <div className="text-center py-4 mb-4">
                                    <div className="inline-flex items-center gap-2 text-black font-bold">
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        <span>Loading vehicle database...</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-8 mb-8 relative">
                                {/* Vehicle A Search */}
                                <div>
                                    <div className="mb-2 font-black uppercase text-left text-black">First Vehicle</div>
                                    <VehicleSelector
                                        variant="input"
                                        placeholder="E.G., FORD MAVERICK 2025"
                                        onSelect={handleSelectVehicleA}
                                        className="w-full"
                                    />
                                    {selectedA && (
                                        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-green-600 bg-green-100 p-2 border-2 border-black">
                                            <Car className="w-4 h-4" />
                                            <span>{`${selectedA.make} ${selectedA.model} ${selectedA.year}`}</span>
                                        </div>
                                    )}
                                </div>

                                {/* VS Divider */}
                                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-400 border-3 border-black items-center justify-center z-10 shadow-[4px_4px_0px_0px_black] transform rotate-12">
                                    <span className="text-xl font-black text-black">VS</span>
                                </div>

                                {/* Vehicle B Search */}
                                <div>
                                    <div className="mb-2 font-black uppercase text-left text-black">Second Vehicle</div>
                                    <VehicleSelector
                                        variant="input"
                                        placeholder="E.G., TOYOTA TACOMA 2025"
                                        onSelect={handleSelectVehicleB}
                                        className="w-full"
                                    />
                                    {selectedB && (
                                        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-green-600 bg-green-100 p-2 border-2 border-black">
                                            <Car className="w-4 h-4" />
                                            <span>{`${selectedB.make} ${selectedB.model} ${selectedB.year}`}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Compare Button */}
                            <button
                                onClick={handleCompare}
                                disabled={!selectedA || !selectedB || isLoading || !isLoaded}
                                className={clsx(
                                    'w-full flex items-center justify-center gap-3',
                                    'px-8 py-4 border-3 border-black',
                                    'bg-blue-600 text-white text-xl font-black uppercase tracking-wider',
                                    'shadow-[6px_6px_0px_0px_black]',
                                    'transition-all duration-200',
                                    'hover:bg-blue-500 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_black]',
                                    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400'
                                )}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>LOADING...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>COMPARE NOW</span>
                                        <ArrowRight className="w-6 h-6" />
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <ChevronDown className="w-8 h-8 text-black" />
                </div>
            </section>

            {/* Popular Comparisons Section */}
            <section className="py-20 px-4 bg-white dark:bg-gray-900 border-t-4 border-black dark:border-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase">
                            <span className="bg-yellow-400 text-black px-3 py-1">Popular</span> Comparisons
                        </h2>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                            See what other car buyers are comparing
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { a: 'Toyota Camry', b: 'Honda Accord', category: 'Sedans' },
                            { a: 'Ford F-150', b: 'Chevrolet Silverado', category: 'Trucks' },
                            { a: 'Tesla Model 3', b: 'BMW 3 Series', category: 'Luxury' },
                            { a: 'Toyota RAV4', b: 'Honda CR-V', category: 'SUVs' },
                            { a: 'Ford Mustang', b: 'Chevrolet Camaro', category: 'Sports' },
                            { a: 'Hyundai IONIQ 6', b: 'Tesla Model 3', category: 'Electric' },
                        ].map((comparison, index) => (
                            <div
                                key={index}
                                className="p-5 bg-gray-50 dark:bg-gray-800 border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_black] dark:shadow-[4px_4px_0px_0px_white] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_black] dark:hover:shadow-[6px_6px_0px_0px_white] transition-all cursor-pointer"
                            >
                                <span className="inline-block px-2 py-1 bg-yellow-400 text-black text-xs font-bold uppercase mb-3">
                                    {comparison.category}
                                </span>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-sm">{comparison.a}</span>
                                    <span className="text-xs font-black bg-black text-white dark:bg-white dark:text-black px-2 py-1">VS</span>
                                    <span className="font-bold text-sm">{comparison.b}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 px-4 bg-gray-100 dark:bg-gray-800 border-t-4 border-black dark:border-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black mb-4 uppercase">
                            How It <span className="bg-blue-600 text-white px-3 py-1">Works</span>
                        </h2>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                            Compare vehicles in 3 simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '1', title: 'Select Vehicles', desc: 'Search and select up to 4 vehicles you want to compare', icon: Car },
                            { step: '2', title: 'View Comparison', desc: 'See detailed side-by-side specs with visual charts', icon: BarChart2 },
                            { step: '3', title: 'Make Decision', desc: 'Export results to PDF and share with others', icon: FileText },
                        ].map((item, index) => (
                            <div key={index} className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 bg-yellow-400 border-3 border-black dark:border-white shadow-[4px_4px_0px_0px_black] dark:shadow-[4px_4px_0px_0px_white] flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform">
                                    <span className="text-3xl font-black text-black">{item.step}</span>
                                </div>
                                <h3 className="text-xl font-black uppercase mb-2">{item.title}</h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 bg-black text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-black uppercase mb-3">
                            Why <span className="bg-yellow-400 text-black px-2">AutoCompare</span>?
                        </h2>
                        <p className="text-sm md:text-base text-gray-400 font-medium">
                            Production-ready stack with real features for automotive websites and dealers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                        <div className="p-4 border-2 border-yellow-400 bg-black/40">
                            <h3 className="text-lg font-black mb-2">Next.js 14 + MySQL</h3>
                            <p className="text-sm text-gray-300">
                                Modern App Router architecture with MySQL database and connection pooling.
                            </p>
                        </div>
                        <div className="p-4 border-2 border-yellow-400 bg-black/40">
                            <h3 className="text-lg font-black mb-2">Full Admin Panel</h3>
                            <p className="text-sm text-gray-300">
                                Secure login, CRUD for vehicles, bulk delete, and CSV import tools.
                            </p>
                        </div>
                        <div className="p-4 border-2 border-yellow-400 bg-black/40">
                            <h3 className="text-lg font-black mb-2">Smart Comparison Engine</h3>
                            <p className="text-sm text-gray-300">
                                Normalized specs, winner highlighting, and interactive charts with Recharts.
                            </p>
                        </div>
                        <div className="p-4 border-2 border-yellow-400 bg-black/40">
                            <h3 className="text-lg font-black mb-2">PDF Export & Dark Mode</h3>
                            <p className="text-sm text-gray-300">
                                One-click PDF reports plus built-in light/dark themes with persistence.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4 bg-yellow-50 dark:bg-gray-900 border-t-4 border-black dark:border-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase text-black">
                            Everything You Need to <span className="bg-black text-white px-2">Compare</span>
                        </h2>
                        <p className="text-xl font-bold text-gray-600 max-w-2xl mx-auto">
                            Our powerful comparison tools help you make informed decisions
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {FEATURES.map((feature, index) => (
                            <div
                                key={index}
                                className={clsx(
                                    'p-6 bg-white border-3 border-black',
                                    'shadow-[6px_6px_0px_0px_black]',
                                    'hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_black]',
                                    'transition-all duration-200'
                                )}
                            >
                                <div className={clsx(
                                    'w-14 h-14 border-2 border-black flex items-center justify-center mb-4',
                                    'bg-yellow-300 shadow-[3px_3px_0px_0px_black]'
                                )}>
                                    <feature.icon className="w-7 h-7 text-black" />
                                </div>
                                <h3 className="text-xl font-black text-black uppercase mb-2">{feature.title}</h3>
                                <p className="text-sm font-medium text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* Footer */}
            <footer className="py-10 px-4 bg-black text-white">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-400 border-2 border-white">
                            <Car className="w-6 h-6 text-black" />
                        </div>
                        <span className="text-2xl font-black uppercase tracking-wider">AutoCompare</span>
                    </div>
                    <p className="text-sm font-mono text-gray-400">
                        © {new Date().getFullYear()} AUTOCOMPARE
                    </p>
                </div>
            </footer>
        </div>
    );
}
