// ============================================
// Clear All Vehicles API Route
// Deletes all vehicles from the database
// ============================================

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        try {
            await query('DELETE FROM vehicle_images', []);
        } catch {}
        await query('DELETE FROM vehicles', []);

        return NextResponse.json({
            success: true,
            message: 'All vehicles deleted successfully',
        });
    } catch (error: any) {
        console.error('Clear data error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to clear data' },
            { status: 500 }
        );
    }
}
