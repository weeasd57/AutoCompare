'use client';

import { useMemo, useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Fuel, Zap, Settings, Users } from 'lucide-react';
import { useVehicles } from '@/context/VehicleContext';
import { useSettings } from '@/context/SettingsContext';
import { getBrandLogoUrl } from '@/lib/logos';
import { getPrimaryVehicleImageUrl } from '@/lib/vehicle-images';

const ContentHeader = ({ displayName, yearTrim, vehicle, settings }: any) => (
    <div>
        <h1 className="text-3xl md:text-4xl font-black uppercase text-black dark:text-white mb-2">
            {displayName}
        </h1>
        <p className="text-sm md:text-base font-mono text-gray-700 dark:text-gray-300 mb-4">
            {yearTrim}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <InfoBadge
                icon={Zap}
                label="Horsepower"
                value={vehicle.horsepower ? `${vehicle.horsepower} hp` : 'N/A'}
            />
            <InfoBadge
                icon={Fuel}
                label="Combined MPG"
                value={vehicle.fuelCombinedMpg ? `${vehicle.fuelCombinedMpg} mpg` : 'N/A'}
            />
            <InfoBadge icon={Settings} label="Drivetrain" value={vehicle.drivetrain || 'N/A'} />
            <InfoBadge
                icon={Users}
                label="Seats"
                value={vehicle.seatingCapacity ? `${vehicle.seatingCapacity}` : 'N/A'}
            />
        </div>

        {settings.showPrices && vehicle.basePrice && vehicle.basePrice > 0 && (
            <div className="inline-flex items-baseline gap-2 px-4 py-3 border-3 border-black dark:border-white bg-yellow-300 text-black shadow-[5px_5px_0px_0px_black]">
                <span className="text-xs font-black uppercase tracking-wide">Starting at</span>
                <span className="text-2xl font-black">
                    {settings.currency === 'USD'
                        ? '$'
                        : settings.currency === 'EUR'
                          ? '€'
                          : settings.currency === 'GBP'
                            ? '£'
                            : settings.currency === 'SAR'
                              ? 'SAR '
                              : ''}
                    {vehicle.basePrice.toLocaleString()}
                </span>
            </div>
        )}
    </div>
);

const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="inline-flex items-center gap-2 text-black dark:text-white font-bold">
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading vehicle...</span>
        </div>
    </div>
);

const NotFoundScreen = () => (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center px-4">
        <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
            Vehicle not found.
        </p>
        <Link
            href="/vehicles"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-black dark:text-white font-bold uppercase text-xs shadow-[3px_3px_0px_0px_black] dark:shadow-[3px_3px_0px_0px_white] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_black] dark:hover:shadow-[5px_5px_0px_0px_white] transition-all"
        >
            <ArrowLeft className="w-4 h-4" />
            Back to vehicles
        </Link>
    </div>
);

const VehicleGallery = ({
    images,
    activeImageIndex,
    setActiveImageIndex,
    displayName,
    activeImage,
}: any) => (
    <div className="relative flex flex-col items-center gap-4">
        <div
            className="absolute -inset-4 bg-gradient-to-tr from-yellow-300/40 via-transparent to-blue-400/30 rounded-[2rem] blur-2xl"
            aria-hidden="true"
        />
        <div className="relative border-4 border-black dark:border-white rounded-[2rem] bg-white/80 dark:bg-gray-900/80 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden w-full max-w-md">
            <div className="relative w-full h-56 sm:h-72 md:h-80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <Image
                    src={activeImage}
                    alt={displayName}
                    width={640}
                    height={360}
                    className="w-full h-full object-contain p-4 sm:p-6"
                    unoptimized={true}
                />
            </div>
        </div>
        {images.length > 1 && (
            <div className="w-full max-w-md">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-2">
                    {images.map((img: string, index: number) => (
                        <button
                            key={`${img}-${index}`}
                            type="button"
                            onClick={() => setActiveImageIndex(index)}
                            className={
                                'relative h-16 w-24 sm:h-20 sm:w-28 border-2 border-black overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 ' +
                                (index === activeImageIndex ? 'ring-2 ring-yellow-400' : '')
                            }
                        >
                            <Image
                                src={img}
                                alt={`${displayName} ${index + 1}`}
                                fill
                                sizes="120px"
                                className="object-cover"
                                unoptimized
                            />
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const formatSpec = (value: any, unit: string = '') => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return `${value}${unit ? ' ' + unit : ''}`;
};

const VehicleSpecs = ({ vehicle }: any) => (
    <section className="mb-12">
        <h2 className="text-2xl font-black uppercase text-black dark:text-white mb-4">
            Specifications
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
            <SpecCard
                title="Engine & Performance"
                items={[
                    ['Engine Displacement', formatSpec(vehicle.engineDisplacement, 'L')],
                    ['Cylinders', formatSpec(vehicle.engineCylinders)],
                    ['Configuration', formatSpec(vehicle.engineConfiguration)],
                    ['Fuel Type', formatSpec(vehicle.fuelType)],
                    ['Horsepower', formatSpec(vehicle.horsepower, 'hp')],
                    ['Torque', formatSpec(vehicle.torque, 'Nm')],
                ]}
            />
            <SpecCard
                title="Fuel Economy & Drivetrain"
                items={[
                    ['City MPG', formatSpec(vehicle.fuelCityMpg, 'mpg')],
                    ['Highway MPG', formatSpec(vehicle.fuelHighwayMpg, 'mpg')],
                    ['Combined MPG', formatSpec(vehicle.fuelCombinedMpg, 'mpg')],
                    ['Transmission', formatSpec(vehicle.transmission)],
                    ['Transmission Speeds', formatSpec(vehicle.transmissionSpeeds)],
                    ['Drivetrain', formatSpec(vehicle.drivetrain)],
                ]}
            />
            <SpecCard
                title="Dimensions & Capacity"
                items={[
                    ['Body Style', formatSpec(vehicle.bodyStyle)],
                    ['Doors', formatSpec(vehicle.doors)],
                    ['Seating Capacity', formatSpec(vehicle.seatingCapacity)],
                    ['Curb Weight', formatSpec(vehicle.curbWeight, 'lbs')],
                    ['GVWR', formatSpec(vehicle.gvwr, 'lbs')],
                    ['Payload Capacity', formatSpec(vehicle.payloadCapacity, 'lbs')],
                    ['Towing Capacity', formatSpec(vehicle.towingCapacity, 'lbs')],
                ]}
            />
            <SpecCard
                title="Safety & Other"
                items={[
                    ['Airbags', formatSpec(vehicle.airbags)],
                    ['ABS', formatSpec(vehicle.abs)],
                    ['ESC', formatSpec(vehicle.esc)],
                    ['Manufacturer', formatSpec(vehicle.manufacturer)],
                    ['Country', formatSpec(vehicle.country)],
                ]}
            />
        </div>
    </section>
);

function useVehicleImages(id: string | undefined, fallbackUrl: string | null | undefined) {
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        const loadImages = async () => {
            const primaryFallback =
                getPrimaryVehicleImageUrl(fallbackUrl ?? undefined) || fallbackUrl || null;

            if (!id) {
                setImages(primaryFallback ? [primaryFallback] : []);
                return;
            }
            try {
                const res = await fetch(`/api/vehicles/${id}/images`);
                const json = res.ok ? await res.json() : null;
                const apiImages = json && Array.isArray(json.images) ? json.images : [];

                if (apiImages.length > 0) {
                    setImages(apiImages.map((img: any) => img.url));
                } else {
                    setImages(primaryFallback ? [primaryFallback] : []);
                }
            } catch (err) {
                console.error('Failed to load vehicle images:', err);
                setImages(primaryFallback ? [primaryFallback] : []);
            }
        };
        loadImages();
    }, [id, fallbackUrl]);

    return images;
}

export default function VehicleDetailsPage() {
    const params = useParams<{ id: string }>();
    const { vehicles, loading, isLoaded } = useVehicles();
    const { settings } = useSettings();

    const vehicle = useMemo(() => {
        if (!params?.id) return null;
        return vehicles.find((v) => v.id === params.id) || null;
    }, [vehicles, params?.id]);

    const images = useVehicleImages(params?.id, vehicle?.imageUrl);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const isLoading = loading || !isLoaded;
    if (isLoading) return <LoadingScreen />;
    if (!vehicle) return <NotFoundScreen />;

    const displayName = `${vehicle.make} ${vehicle.model}`;
    const yearTrim = vehicle.trim ? `${vehicle.year} ${vehicle.trim}` : String(vehicle.year);
    const activeImage = images[activeImageIndex] || getBrandLogoUrl(vehicle.make);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Back */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <Link
                        href="/vehicles"
                        className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-black dark:border-white bg-white dark:bg-gray-900 text-black dark:text-white text-xs font-black uppercase shadow-[3px_3px_0px_0px_black] dark:shadow-[3px_3px_0px_0px_white] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_black] dark:hover:shadow-[5px_5px_0px_0px_white] transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        All Vehicles
                    </Link>
                </div>

                {/* Header */}
                <section className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-8 mb-10 items-start">
                    <ContentHeader
                        displayName={displayName}
                        yearTrim={yearTrim}
                        vehicle={vehicle}
                        settings={settings}
                    />
                    <VehicleGallery
                        images={images}
                        activeImageIndex={activeImageIndex}
                        setActiveImageIndex={setActiveImageIndex}
                        displayName={displayName}
                        activeImage={activeImage}
                    />
                </section>

                <VehicleSpecs vehicle={vehicle} />
            </div>
        </div>
    );
}

interface InfoBadgeProps {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}

function InfoBadge({ icon: Icon, label, value }: InfoBadgeProps) {
    return (
        <div className="p-3 border-2 border-black dark:border-white bg-white dark:bg-gray-900 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </div>
            <div className="text-sm md:text-base font-black text-black dark:text-white">
                {value}
            </div>
        </div>
    );
}

interface SpecCardProps {
    title: string;
    items: [string, string][];
}

function SpecCard({ title, items }: SpecCardProps) {
    return (
        <div className="border-3 border-black dark:border-white bg-white dark:bg-gray-900 p-4 shadow-[5px_5px_0px_0px_black] dark:shadow-[5px_5px_0px_0px_white]">
            <h3 className="text-lg font-black uppercase text-black dark:text-white mb-3">
                {title}
            </h3>
            <dl className="space-y-2 text-sm">
                {items.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-4">
                        <dt className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                            {label}
                        </dt>
                        <dd className="flex-1 text-right font-medium text-gray-900 dark:text-gray-100">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
