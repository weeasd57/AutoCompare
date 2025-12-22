// ============================================
// Settings Management API
// Handles loading and saving application settings to the database
// ============================================

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminWriteAccess } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rows = await query('SELECT setting_key, setting_value FROM settings', []);

        // Convert rows array to object
        const settings: Record<string, any> = {};
        if (Array.isArray(rows)) {
            rows.forEach((row: any) => {
                // Try to parse JSON values, otherwise keep as string
                try {
                    settings[row.setting_key] = JSON.parse(row.setting_value);
                } catch {
                    settings[row.setting_key] = row.setting_value;
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const guard = requireAdminWriteAccess(request);
    if (guard) return guard;

    try {
        const body = await request.json();

        // Body should be an object of key-value pairs
        const updates = Object.entries(body);

        for (const [key, value] of updates) {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

            await query(
                `INSERT INTO settings (setting_key, setting_value) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                [key, stringValue]
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Settings saved successfully',
        });
    } catch (error: any) {
        console.error('Failed to save settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save settings' },
            { status: 500 }
        );
    }
}
