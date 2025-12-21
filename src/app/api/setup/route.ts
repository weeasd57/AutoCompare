import { NextResponse } from 'next/server';
import { query as staticQuery } from '@/lib/db';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Prevent static generation
export const dynamic = 'force-dynamic';

// GET: Check setup status
export async function GET() {
    try {
        // Try to query using global pool
        try {
            const admins = await staticQuery('SELECT COUNT(*) as count FROM admins') as any[];
            const hasAdmins = admins[0].count > 0;

            let setupCompleted = false;
            try {
                const settings = await staticQuery(
                    "SELECT setting_value FROM settings WHERE setting_key = 'setup_completed'"
                ) as any[];
                setupCompleted = settings.length > 0 && settings[0].setting_value === 'true';
            } catch { }

            return NextResponse.json({
                tablesExist: true,
                hasAdmins,
                setupCompleted,
                needsSetup: !hasAdmins || !setupCompleted
            });
        } catch (dbError) {
            return NextResponse.json({
                tablesExist: false,
                hasAdmins: false,
                setupCompleted: false,
                needsSetup: true
            });
        }
    } catch (err) {
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}

// POST: Create initial admin and complete setup
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, dbConfig } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Helper to run query either via provided config OR global pool
        const runQuery = async (sql: string, params: any[] = []) => {
            if (dbConfig) {
                const host = dbConfig.host || 'localhost';
                const user = dbConfig.user || 'root';
                const password = dbConfig.password ?? '';
                const database = dbConfig.database || 'autocompare';
                const port = Number(dbConfig.port || 3306);

                const connection = await mysql.createConnection({
                    host, user, password, database, port
                });
                try {
                    const [rows] = await connection.query(sql, params);
                    return rows;
                } finally {
                    await connection.end();
                }
            } else {
                return staticQuery(sql, params);
            }
        };

        // Create admin
        await runQuery(
            'INSERT INTO admins (email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, name || 'Admin', 'super_admin', 1]
        );

        // Mark setup complete
        await runQuery(
            "INSERT INTO settings (setting_key, setting_value) VALUES ('setup_completed', 'true') ON DUPLICATE KEY UPDATE setting_value = 'true'"
        );

        return NextResponse.json({ success: true, message: 'Admin created successfully' });

    } catch (err: any) {
        console.error('Setup error', err);
        return NextResponse.json(
            { error: err.message || 'Setup failed' },
            { status: 500 }
        );
    }
}
