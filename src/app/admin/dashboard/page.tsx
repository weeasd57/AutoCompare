'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Trash2, LogOut, Car, Search, X, AlertTriangle, Upload, Download, Settings, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { getBrandLogoUrl } from '@/lib/logos';
import type { NormalizedSpec } from '@/types/vehicle';
import { useToast } from '@/context/ToastContext';
import { getAdminAuthHeaders, isDemoAdminToken } from '@/lib/admin-client';
import { getPrimaryVehicleImageUrl } from '@/lib/vehicle-images';

export default function AdminDashboard() {
    const [vehicles, setVehicles] = useState<NormalizedSpec[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDemo, setIsDemo] = useState(false);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const router = useRouter();
    const toast = useToast();

    // Delete modal state
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null; name: string }>({
        open: false,
        id: null,
        name: '',
    });
    const [deleting, setDeleting] = useState(false);

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

    // Export CSV function
    const exportToCSV = () => {
        const headers = ['make', 'model', 'year', 'trim', 'base_price', 'horsepower', 'fuel_combined_mpg', 'drivetrain', 'seating_capacity', 'fuel_type', 'body_style', 'image_url'];
        const csvRows = [headers.join(',')];

        vehicles.forEach(v => {
            const row = [
                v.make,
                v.model,
                v.year,
                v.trim || '',
                v.basePrice || '',
                v.horsepower || '',
                v.fuelCombinedMpg || '',
                v.drivetrain || '',
                v.seatingCapacity || '',
                v.fuelType || '',
                v.bodyStyle || '',
                v.imageUrl || ''
            ].map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        setIsDemo(isDemoAdminToken(token));
        fetchVehicles();
    }, [router]);

    const fetchVehicles = async () => {
        try {
            const res = await fetch('/api/vehicles');
            const data = await res.json();
            // Ensure data is an array
            setVehicles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch vehicles', err);
            setVehicles([]);
        }
        setLoading(false);
    };

    // Open delete confirmation modal
    const openDeleteModal = (id: string, name: string) => {
        setDeleteModal({ open: true, id, name });
    };

    // Confirm single delete
    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        if (isDemo) {
            toast.error('Demo admin is read-only');
            setDeleteModal({ open: false, id: null, name: '' });
            return;
        }
        setDeleting(true);

        try {
            const res = await fetch(`/api/vehicles/${deleteModal.id}`, {
                method: 'DELETE',
                headers: {
                    ...getAdminAuthHeaders(),
                },
            });

            if (res.ok) {
                fetchVehicles();
                setDeleteModal({ open: false, id: null, name: '' });
                toast.success('Vehicle deleted successfully');
            } else {
                toast.error('Error deleting vehicle');
            }
        } catch (err) {
            toast.error('Error deleting vehicle');
        } finally {
            setDeleting(false);
        }
    };

    // Toggle selection
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // Select all / deselect all
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredVehicles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredVehicles.map(v => v.id)));
        }
    };

    // Bulk delete
    const confirmBulkDelete = async () => {
        if (isDemo) {
            toast.error('Demo admin is read-only');
            setBulkDeleteModal(false);
            return;
        }
        setDeleting(true);
        try {
            const promises = Array.from(selectedIds).map(id =>
                fetch(`/api/vehicles/${id}`, {
                    method: 'DELETE',
                    headers: {
                        ...getAdminAuthHeaders(),
                    },
                })
            );
            await Promise.all(promises);
            fetchVehicles();
            setSelectedIds(new Set());
            setBulkDeleteModal(false);
            toast.success('Vehicles deleted successfully');
        } catch (err) {
            toast.error('Error deleting vehicles');
        } finally {
            setDeleting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
    };

    const filteredVehicles = vehicles.filter((v) =>
        v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Loading Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-neo-grid p-8 font-sans text-black">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                            Fleet Manager
                        </h1>
                        <p className="text-gray-500 font-medium">{vehicles.length} Vehicles in Database</p>
                        {isDemo && (
                            <p className="text-xs font-bold uppercase text-orange-600 mt-1">
                                Demo admin (read-only)
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Bulk Delete Button */}
                        {!isDemo && selectedIds.size > 0 && (
                            <button
                                onClick={() => setBulkDeleteModal(true)}
                                className="flex items-center gap-2 bg-red-500 text-white px-4 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <Trash2 className="w-4 h-4" /> Delete ({selectedIds.size})
                            </button>
                        )}
                        {/* Export CSV Button */}
                        <button
                            onClick={exportToCSV}
                            disabled={vehicles.length === 0}
                            className="flex items-center gap-2 bg-white text-black px-4 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                        {/* Import CSV Button */}
                        {!isDemo && (
                            <Link
                                href="/admin/import"
                                className="flex items-center gap-2 bg-white text-black px-4 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <Upload className="w-4 h-4" /> Import
                            </Link>
                        )}
                        {!isDemo && (
                            <Link
                                href="/admin/add"
                                className="flex items-center gap-2 bg-yellow-400 text-black px-6 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <Plus className="w-5 h-5" /> Add Vehicle
                            </Link>
                        )}
                        {!isDemo && (
                            <Link
                                href="/admin/batch-images"
                                className="flex items-center gap-2 bg-white text-black px-4 py-3 font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <ImageIcon className="w-4 h-4" /> Images
                            </Link>
                        )}
                        <Link
                            href="/admin/settings"
                            className="p-3 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-3 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by Make or Model..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-black font-medium focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                    />
                </div>

                {/* Admin Table */}
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-yellow-400 border-b-2 border-black text-black uppercase text-sm font-black tracking-wider">
                                    <th className="p-4 border-r-2 border-black w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === filteredVehicles.length && filteredVehicles.length > 0}
                                            onChange={toggleSelectAll}
                                            disabled={isDemo}
                                            className="w-4 h-4 accent-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </th>
                                    <th className="p-4 border-r-2 border-black w-20">Image</th>
                                    <th className="p-4 border-r-2 border-black">Vehicle</th>
                                    <th className="p-4 border-r-2 border-black">Specs</th>
                                    <th className="p-4 border-r-2 border-black">Price</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-bold text-black">
                                {filteredVehicles.map((vehicle, index) => (
                                    <tr
                                        key={vehicle.id}
                                        className={`border-b border-gray-200 hover:bg-yellow-50 transition-colors ${index === filteredVehicles.length - 1 ? 'border-b-0' : ''
                                            }`}
                                    >
                                        <td className="p-4 border-r border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(vehicle.id)}
                                                onChange={() => toggleSelect(vehicle.id)}
                                                disabled={isDemo}
                                                className="w-4 h-4 accent-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                        <td className="p-4 border-r border-gray-200">
                                            <div className="w-12 h-12 bg-white border border-black p-1 flex items-center justify-center relative">
                                                <Image
                                                    src={imageErrors[vehicle.id]
                                                        ? getBrandLogoUrl(vehicle.make)
                                                        : (getPrimaryVehicleImageUrl(vehicle.imageUrl) || getBrandLogoUrl(vehicle.make))}
                                                    alt={vehicle.make}
                                                    fill
                                                    className="object-contain p-1"
                                                    onError={() => {
                                                        setImageErrors(prev => ({ ...prev, [vehicle.id]: true }));
                                                    }}
                                                    unoptimized={true} // Brand logos are small externals
                                                />
                                                <Car className="fallback-icon w-6 h-6 text-gray-400 hidden" />
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-gray-200">
                                            <div className="flex flex-col">
                                                <span className="text-lg leading-tight uppercase font-black">{vehicle.make} {vehicle.model}</span>
                                                <span className="text-gray-500 font-medium">{vehicle.year} • {vehicle.trim || 'Base'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-gray-200">
                                            <div className="space-y-1 text-xs text-gray-600 font-mono">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 uppercase font-bold text-black">HP:</span> {vehicle.horsepower || '-'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 uppercase font-bold text-black">MPG:</span> {vehicle.fuelCombinedMpg || '-'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 uppercase font-bold text-black">DRV:</span> {vehicle.drivetrain || '-'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 border-r border-gray-200">
                                            {vehicle.basePrice ? (
                                                <span className="text-green-700 font-black">${vehicle.basePrice.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {!isDemo ? (
                                                    <>
                                                        <Link
                                                            href={`/admin/edit/${vehicle.id}`}
                                                            className="p-2 bg-white border-2 border-black hover:bg-blue-100 hover:text-blue-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                                            title="Edit Vehicle"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="16"
                                                                height="16"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => openDeleteModal(vehicle.id, `${vehicle.make} ${vehicle.model} ${vehicle.year}`)}
                                                            className="p-2 bg-white border-2 border-black hover:bg-red-100 hover:text-red-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                                            title="Delete Vehicle"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-xs font-mono text-gray-500">Read-only</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredVehicles.length === 0 && (
                        <div className="text-center py-12 bg-gray-50">
                            <p className="text-gray-400 font-bold uppercase tracking-wider">No vehicles found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full mx-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 border-2 border-black flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase">Delete Vehicle</h3>
                                <p className="text-gray-500 text-sm">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="mb-6 text-black">
                            Are you sure you want to delete <strong>{deleteModal.name}</strong>?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDeleteModal({ open: false, id: null, name: '' })}
                                className="flex-1 px-4 py-3 bg-gray-100 text-black font-bold uppercase border-2 border-black hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Confirmation Modal */}
            {bulkDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full mx-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 border-2 border-black flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase">Delete Multiple Vehicles</h3>
                                <p className="text-gray-500 text-sm">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="mb-6 text-black">
                            Are you sure you want to delete <strong>{selectedIds.size} vehicles</strong>?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setBulkDeleteModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-black font-bold uppercase border-2 border-black hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBulkDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : `Delete ${selectedIds.size}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
