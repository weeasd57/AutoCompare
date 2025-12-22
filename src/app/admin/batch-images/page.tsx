'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Check, Download, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { NormalizedSpec } from '@/types/vehicle';
import { useVehicles } from '@/context/VehicleContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import Image from 'next/image';
import { getAdminAuthHeaders, isDemoAdminToken } from '@/lib/admin-client';

interface ImageState {
    images: string[];
    loading: boolean;
    error?: string;
    selectedImages: number[];
}

export default function BatchImagesPage() {
    const router = useRouter();
    const { vehicles } = useVehicles();
    const toast = useToast();

    const getVehicleImageErrorMessage = (payload: any) => {
        const status = typeof payload?.status === 'number' ? payload.status : undefined;
        const googleError =
            typeof payload?.googleError === 'string' ? payload.googleError : undefined;

        if (status === 429) {
            return {
                toastMessage:
                    'Google Image Search quota exceeded. Try again later or increase your Google Custom Search quota.',
                inlineMessage: 'Quota exceeded. Please try again later.',
                details: googleError,
            };
        }

        return {
            toastMessage: payload?.error || 'Failed to fetch image',
            inlineMessage: payload?.error || 'Failed to fetch image',
            details: googleError,
        };
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        if (isDemoAdminToken(token)) {
            router.push('/admin/dashboard');
        }
    }, [router]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
    const [imagesPerVehicle, setImagesPerVehicle] = useState(4);
    const [imageStates, setImageStates] = useState<Record<string, ImageState>>({});
    const [isFetchingAll, setIsFetchingAll] = useState(false);
    const [isSavingAll, setIsSavingAll] = useState(false);

    const filteredVehicles = vehicles.filter((v) => {
        const q = searchQuery.toLowerCase();
        return (
            v.make.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            String(v.year).includes(q)
        );
    });

    const toggleVehicle = (id: string) => {
        setSelectedVehicleIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedVehicleIds.length === filteredVehicles.length) {
            setSelectedVehicleIds([]);
        } else {
            setSelectedVehicleIds(filteredVehicles.map((v) => v.id));
        }
    };

    const fetchImagesForVehicle = async (vehicle: NormalizedSpec) => {
        setImageStates((prev) => ({
            ...prev,
            [vehicle.id]: {
                ...(prev[vehicle.id] || { images: [], selectedImages: [] }),
                loading: true,
                error: undefined,
            },
        }));

        try {
            const promises: Promise<{ imageUrl: string }>[] = [];

            for (let i = 0; i < imagesPerVehicle; i++) {
                const params = new URLSearchParams({
                    make: vehicle.make,
                    model: vehicle.model,
                    year: String(vehicle.year),
                    start: String(1 + i),
                });

                promises.push(
                    fetch(`/api/vehicle-image?${params.toString()}`).then(async (res) => {
                        const data = await res.json();
                        if (!res.ok || !data.imageUrl) {
                            const msg = getVehicleImageErrorMessage(data);
                            if (msg.details) {
                                console.error('Vehicle image search error details:', msg.details);
                            }
                            throw new Error(msg.inlineMessage);
                        }
                        return data as { imageUrl: string };
                    })
                );
            }

            const settled = await Promise.allSettled(promises);
            const imageUrls = settled
                .filter(
                    (r): r is PromiseFulfilledResult<{ imageUrl: string }> =>
                        r.status === 'fulfilled'
                )
                .map((r) => r.value.imageUrl);

            setImageStates((prev) => ({
                ...prev,
                [vehicle.id]: {
                    images: imageUrls,
                    loading: false,
                    error: imageUrls.length === 0 ? 'No images found' : undefined,
                    selectedImages: imageUrls.map((_, idx) => idx),
                },
            }));

            if (imageUrls.length === 0) {
                toast.warning(
                    `No images found for ${vehicle.make} ${vehicle.model} ${vehicle.year}`
                );
            }
        } catch (err: any) {
            const message = err?.message || 'Failed to fetch images';
            if (message.toLowerCase().includes('quota exceeded')) {
                toast.warning(
                    'Google Image Search quota exceeded. Try again later or increase your Google Custom Search quota.'
                );
            } else {
                toast.error(message);
            }

            setImageStates((prev) => ({
                ...prev,
                [vehicle.id]: {
                    images: [],
                    loading: false,
                    error: message,
                    selectedImages: [],
                },
            }));
        }
    };

    const fetchAllSelected = async () => {
        const toFetch = vehicles.filter((v) => selectedVehicleIds.includes(v.id));
        if (toFetch.length === 0) return;

        setIsFetchingAll(true);
        await Promise.allSettled(toFetch.map((v) => fetchImagesForVehicle(v)));
        setIsFetchingAll(false);
        toast.success(`Fetched images for ${toFetch.length} vehicles`);
    };

    const toggleImageSelection = (vehicleId: string, index: number) => {
        setImageStates((prev) => {
            const current = prev[vehicleId];
            if (!current) return prev;

            const exists = current.selectedImages.includes(index);
            const selected = exists
                ? current.selectedImages.filter((i) => i !== index)
                : [...current.selectedImages, index];

            return {
                ...prev,
                [vehicleId]: { ...current, selectedImages: selected },
            };
        });
    };

    const toggleAllImagesForVehicle = (vehicleId: string) => {
        setImageStates((prev) => {
            const current = prev[vehicleId];
            if (!current || current.images.length === 0) return prev;

            const allSelected = current.selectedImages.length === current.images.length;
            return {
                ...prev,
                [vehicleId]: {
                    ...current,
                    selectedImages: allSelected ? [] : current.images.map((_, idx) => idx),
                },
            };
        });
    };

    const saveAllSelected = async () => {
        setIsSavingAll(true);

        let totalImages = 0;

        const savePromises = selectedVehicleIds.map(async (id) => {
            const state = imageStates[id];
            if (!state || state.selectedImages.length === 0) return;

            const vehicle = vehicles.find((v) => v.id === id);
            if (!vehicle) return;

            const chosenImageUrls = state.selectedImages
                .map((i) => state.images[i])
                .filter(Boolean);
            if (chosenImageUrls.length === 0) return;

            const limited = chosenImageUrls.slice(0, 5);
            totalImages += limited.length;

            await fetch(`/api/vehicles/${id}/images`, {
                method: 'DELETE',
                headers: {
                    ...getAdminAuthHeaders(),
                },
            }).catch(() => {});

            const uploads = limited.map((sourceUrl, sortOrder) =>
                fetch(`/api/vehicles/${id}/images`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                    body: JSON.stringify({ sourceUrl, sortOrder }),
                }).catch(() => {})
            );

            await Promise.allSettled(uploads);
        });

        await Promise.allSettled(savePromises);
        setIsSavingAll(false);
        try {
            localStorage.setItem('autocompare_vehicles_updated_at', String(Date.now()));
        } catch {}
        window.dispatchEvent(new Event('autocompare-vehicles-updated'));
        toast.success(
            `Saved images for ${selectedVehicleIds.length} vehicles (total ${totalImages} images stored)`
        );
    };

    const anySelectedImages = Object.values(imageStates).some(
        (s) => s && s.selectedImages && s.selectedImages.length > 0
    );

    return (
        <div className="min-h-screen bg-neo-grid p-8 font-sans text-black">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        href="/admin/dashboard"
                        className="p-2 border-2 border-black bg-white hover:bg-gray-100 transition-colors"
                    >
                        Back
                    </Link>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black">
                        Batch Vehicle Images
                    </h1>
                </div>

                {/* Controls */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search make, model or year..."
                                className="w-full pl-9 pr-3 py-2 border-2 border-black focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="imagesPerVehicle"
                                className="block text-xs font-bold uppercase mb-1"
                            >
                                Images per vehicle
                            </label>
                            <select
                                id="imagesPerVehicle"
                                value={imagesPerVehicle}
                                onChange={(e) => setImagesPerVehicle(Number(e.target.value))}
                                className="w-full border-2 border-black px-2 py-2 bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                            >
                                <option value={1}>1 image</option>
                                <option value={2}>2 images</option>
                                <option value={3}>3 images</option>
                                <option value={4}>4 images</option>
                                <option value={5}>5 images</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={toggleSelectAll}
                                className="w-full px-4 py-2 bg-white border-2 border-black font-bold uppercase text-xs hover:bg-gray-100"
                            >
                                {selectedVehicleIds.length === filteredVehicles.length &&
                                filteredVehicles.length > 0
                                    ? 'Deselect all vehicles'
                                    : 'Select all vehicles'}
                            </button>
                            <button
                                onClick={fetchAllSelected}
                                disabled={selectedVehicleIds.length === 0 || isFetchingAll}
                                className="w-full px-4 py-2 bg-blue-500 text-white border-2 border-black font-bold uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isFetchingAll ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Fetching...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" /> Fetch images
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-700 flex justify-between">
                        <span>
                            {selectedVehicleIds.length} of {filteredVehicles.length} vehicles
                            selected
                        </span>
                        <span>
                            {imagesPerVehicle} images/vehicle ={' '}
                            {selectedVehicleIds.length * imagesPerVehicle} total requests
                        </span>
                    </div>
                </div>

                {/* Vehicle list */}
                <div className="space-y-4">
                    {filteredVehicles.map((vehicle) => {
                        const state = imageStates[vehicle.id];
                        const isSelected = selectedVehicleIds.includes(vehicle.id);
                        const hasImages = state && state.images.length > 0;

                        return (
                            <div
                                key={vehicle.id}
                                className={clsx(
                                    'bg-white border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 transition-all',
                                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-black'
                                )}
                            >
                                <div className="flex items-center justify-between mb-3 gap-3">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleVehicle(vehicle.id)}
                                            className={clsx(
                                                'w-6 h-6 rounded-md border-2 flex items-center justify-center',
                                                isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-black bg-white'
                                            )}
                                        >
                                            {isSelected && <Check className="w-4 h-4" />}
                                        </button>
                                        <div>
                                            <div className="font-bold uppercase text-sm">
                                                {vehicle.make} {vehicle.model}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                {vehicle.year} • {vehicle.trim}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs">
                                        {state?.loading && (
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        )}
                                        {state?.error && (
                                            <span className="flex items-center gap-1 text-red-600">
                                                <AlertCircle className="w-4 h-4" /> {state.error}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => fetchImagesForVehicle(vehicle)}
                                            className="px-3 py-1 bg-white border-2 border-black text-xs font-bold uppercase hover:bg-gray-100"
                                        >
                                            Fetch
                                        </button>
                                    </div>
                                </div>

                                {hasImages && (
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold">Images</span>
                                            <button
                                                onClick={() =>
                                                    toggleAllImagesForVehicle(vehicle.id)
                                                }
                                                className="text-blue-600 hover:underline"
                                            >
                                                {state.selectedImages.length === state.images.length
                                                    ? 'Deselect all images'
                                                    : 'Select all images'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {state.images.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleImageSelection(vehicle.id, idx)
                                                    }
                                                    className={clsx(
                                                        'relative border-2 rounded-lg overflow-hidden group',
                                                        state.selectedImages.includes(idx)
                                                            ? 'border-blue-500 ring-2 ring-blue-200'
                                                            : 'border-black'
                                                    )}
                                                >
                                                    <div className="relative w-full h-28">
                                                        <Image
                                                            src={url}
                                                            alt={`${vehicle.make} ${vehicle.model} ${idx + 1}`}
                                                            fill
                                                            sizes="(max-width: 768px) 50vw, 25vw"
                                                            className="object-cover"
                                                            unoptimized
                                                            onError={(e) => {
                                                                (
                                                                    e.currentTarget as any
                                                                ).style.opacity = '0.3';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Floating save button */}
                {selectedVehicleIds.length > 0 && anySelectedImages && (
                    <div className="fixed bottom-6 right-6">
                        <button
                            onClick={saveAllSelected}
                            disabled={isSavingAll}
                            className="px-6 py-3 bg-green-500 text-white border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSavingAll ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" /> Save all selected
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
