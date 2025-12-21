'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { getAdminAuthHeaders, isDemoAdminToken } from '@/lib/admin-client';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

export default function ImportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any[]>([]);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please select a CSV file');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setResult(null);

        // Parse CSV for preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

            const data = lines.slice(1, 6).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const obj: Record<string, string> = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i] || '';
                });
                return obj;
            });

            setPreview(data);
        };
        reader.readAsText(selectedFile);
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        setError(null);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());

            let success = 0;
            let failed = 0;
            const errors: string[] = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const row: Record<string, string> = {};
                headers.forEach((h, idx) => {
                    row[h] = values[idx] || '';
                });

                // Map CSV columns to API fields
                const vehicleData = {
                    make: row.make || row.brand || '',
                    model: row.model || '',
                    year: parseInt(row.year) || new Date().getFullYear(),
                    trim: row.trim || '',
                    base_price: parseFloat(row.base_price || row.price || '0') || 0,
                    horsepower: parseInt(row.horsepower || row.hp || '0') || null,
                    engine_cylinders: parseInt(row.engine_cylinders || row.cylinders || '0') || null,
                    fuel_combined_mpg: parseInt(row.fuel_combined_mpg || row.mpg || '0') || null,
                    drivetrain: row.drivetrain || null,
                    seating_capacity: parseInt(row.seating_capacity || row.seats || '0') || null,
                    fuel_type: row.fuel_type || 'Gasoline',
                    body_style: row.body_style || 'Sedan',
                    country: row.country || 'USA',
                    image_url: row.image_url || row.image || null,
                };

                if (!vehicleData.make || !vehicleData.model) {
                    failed++;
                    errors.push(`Row ${i}: Missing make or model`);
                    continue;
                }

                try {
                    const res = await fetch('/api/vehicles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
                        body: JSON.stringify(vehicleData),
                    });

                    if (res.ok) {
                        success++;
                    } else {
                        failed++;
                        errors.push(`Row ${i}: ${vehicleData.make} ${vehicleData.model} - API error`);
                    }
                } catch (err) {
                    failed++;
                    errors.push(`Row ${i}: ${vehicleData.make} ${vehicleData.model} - Network error`);
                }
            }

            setResult({ success, failed, errors: errors.slice(0, 10) });
        } catch (err) {
            setError('Failed to parse CSV file');
        } finally {
            setImporting(false);
        }
    };

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
                        Import Vehicles
                    </h1>
                </div>

                <div className="neo-card bg-white p-8">
                    {/* Instructions */}
                    <div className="mb-8 p-4 bg-blue-50 border-2 border-blue-200">
                        <h3 className="font-bold text-blue-900 mb-2">CSV Format Instructions</h3>
                        <p className="text-sm text-blue-800 mb-2">
                            Your CSV file should have headers in the first row. Supported columns:
                        </p>
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded block overflow-x-auto">
                            make, model, year, trim, base_price, horsepower, engine_cylinders, fuel_combined_mpg, drivetrain, seating_capacity, fuel_type, body_style, country, image_url
                        </code>
                    </div>

                    {/* File Upload */}
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                fileInputRef.current?.click();
                            }
                        }}
                        className="border-4 border-dashed border-gray-300 hover:border-yellow-400 p-12 text-center cursor-pointer transition-colors mb-6"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        {file ? (
                            <div className="flex items-center justify-center gap-2">
                                <FileText className="w-5 h-5 text-green-600" />
                                <span className="font-bold text-green-600">{file.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        setPreview([]);
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="font-bold text-gray-600 mb-1">Click to upload CSV file</p>
                                <p className="text-sm text-gray-400">or drag and drop</p>
                            </>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-900 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    {/* Preview */}
                    {preview.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold mb-3">Preview (first 5 rows)</h3>
                            <div className="overflow-x-auto border-2 border-black">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-black">
                                            {Object.keys(preview[0]).slice(0, 6).map(key => (
                                                <th key={key} className="p-2 text-left font-bold uppercase text-xs">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-200">
                                                {Object.values(row).slice(0, 6).map((val, j) => (
                                                    <td key={j} className="p-2 truncate max-w-[150px]">
                                                        {String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="mb-6 p-4 bg-green-50 border-2 border-green-500">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="font-bold text-green-900">Import Complete</span>
                            </div>
                            <p className="text-sm text-green-800">
                                <strong>{result.success}</strong> vehicles imported successfully.
                                {result.failed > 0 && (
                                    <span className="text-red-600"> {result.failed} failed.</span>
                                )}
                            </p>
                            {result.errors.length > 0 && (
                                <ul className="mt-2 text-xs text-red-600">
                                    {result.errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Import Button */}
                    <button
                        onClick={handleImport}
                        disabled={!file || importing}
                        className="w-full md:w-auto px-8 py-3 bg-green-500 text-white font-black uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importing ? 'Importing...' : <><Upload className="w-5 h-5" /> Import Vehicles</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
