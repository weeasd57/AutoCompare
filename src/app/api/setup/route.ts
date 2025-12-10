import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET: Check setup status
export async function GET() {
    try {
        // Check if admins table exists
        try {
            const admins = await query('SELECT COUNT(*) as count FROM admins') as any[];
            const hasAdmins = admins[0].count > 0;
            
            // Check settings
            let setupCompleted = false;
            try {
                const settings = await query(
                    "SELECT setting_value FROM settings WHERE setting_key = 'setup_completed'"
                ) as any[];
                setupCompleted = settings.length > 0 && settings[0].setting_value === 'true';
            } catch {
                // Settings table might not exist
            }

            return NextResponse.json({
                tablesExist: true,
                hasAdmins,
                setupCompleted,
                needsSetup: !hasAdmins || !setupCompleted
            });
        } catch (dbError) {
            // Tables don't exist
            return NextResponse.json({
                tablesExist: false,
                hasAdmins: false,
                setupCompleted: false,
                needsSetup: true
            });
        }
    } catch (err) {
        console.error('Setup check error', err);
        return NextResponse.json(
            { error: 'Failed to check setup status' },
            { status: 500 }
        );
    }
}

// POST: Create initial admin and complete setup
export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check if admins table exists, create if not
        try {
            await query('SELECT 1 FROM admins LIMIT 1');
        } catch {
            // Create admins table
            await query(`
                CREATE TABLE IF NOT EXISTS admins (
                    id INT AUTO_INCREMENT NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(100) DEFAULT NULL,
                    role ENUM('super_admin', 'admin', 'editor') DEFAULT 'admin',
                    is_active TINYINT(1) DEFAULT 1,
                    last_login TIMESTAMP NULL DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY unique_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
        }

        // Check if any admin already exists
        const existingAdmins = await query('SELECT COUNT(*) as count FROM admins') as any[];
        if (existingAdmins[0].count > 0) {
            return NextResponse.json(
                { error: 'Setup already completed. An admin account already exists.' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create admin
        await query(
            'INSERT INTO admins (email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, name || 'Admin', 'super_admin', 1]
        );

        // Create settings table if not exists and mark setup as complete
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS settings (
                    id INT AUTO_INCREMENT NOT NULL,
                    setting_key VARCHAR(100) NOT NULL,
                    setting_value TEXT DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY unique_key (setting_key)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            await query(
                "INSERT INTO settings (setting_key, setting_value) VALUES ('setup_completed', 'true') ON DUPLICATE KEY UPDATE setting_value = 'true'"
            );
        } catch (settingsError) {
            console.log('Settings table error:', settingsError);
        }

        return NextResponse.json({
            success: true,
            message: 'Admin account created successfully'
        });

    } catch (err: any) {
        console.error('Setup error', err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: 'Setup failed: ' + (err.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
