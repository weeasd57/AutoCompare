// ============================================
// Export Vehicles CSV API Route
// Downloads all vehicles as CSV file
// ============================================

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const vehicles = await query('SELECT * FROM vehicles', []);

        if (!Array.isArray(vehicles) || vehicles.length === 0) {
            return new NextResponse('No vehicles to export', { status: 404 });
        }

        // Get headers from first vehicle
        const headers = Object.keys(vehicles[0]);

        // Create CSV content
        const csvRows = [
            headers.join(','), // Header row
            ...vehicles.map(vehicle =>
                headers.map(header => {
                    const value = vehicle[header];
                    // Escape values with commas or quotes
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ];

        const csvContent = csvRows.join('\n');

        // Return as downloadable CSV
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="vehicles-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to export vehicles' },
            { status: 500 }
        );
    }
}
