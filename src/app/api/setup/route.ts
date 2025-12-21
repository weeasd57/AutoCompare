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

                const ssl = host.includes('tidbcloud')
                    ? { rejectUnauthorized: false }
                    : undefined;

                const connection = await mysql.createConnection({
                    host, user, password, database, port, ssl
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

        // Create all tables if using dbConfig (first-time setup)
        if (dbConfig) {
            const host = dbConfig.host || 'localhost';
            const user = dbConfig.user || 'root';
            const password = dbConfig.password ?? '';
            const database = dbConfig.database || 'autocompare';
            const port = Number(dbConfig.port || 3306);
            const ssl = host.includes('tidbcloud') ? { rejectUnauthorized: false } : undefined;

            // Connect to create tables
            const connection = await mysql.createConnection({
                host, user, password, database, port, ssl
            });

            try {
                // Create vehicles table
                await connection.query(`
                    CREATE TABLE IF NOT EXISTS vehicles (
                        id VARCHAR(100) NOT NULL,
                        make VARCHAR(100) NOT NULL,
                        model VARCHAR(100) NOT NULL,
                        year INT NOT NULL,
                        trim VARCHAR(100) DEFAULT NULL,
                        horsepower INT DEFAULT NULL,
                        torque INT DEFAULT NULL,
                        engine_displacement DECIMAL(3,1) DEFAULT NULL,
                        engine_cylinders INT DEFAULT NULL,
                        engine_configuration VARCHAR(50) DEFAULT NULL,
                        fuel_type VARCHAR(50) DEFAULT NULL,
                        fuel_city_mpg INT DEFAULT NULL,
                        fuel_highway_mpg INT DEFAULT NULL,
                        fuel_combined_mpg INT DEFAULT NULL,
                        transmission VARCHAR(50) DEFAULT NULL,
                        transmission_speeds INT DEFAULT NULL,
                        drivetrain VARCHAR(20) DEFAULT NULL,
                        body_style VARCHAR(50) DEFAULT NULL,
                        doors INT DEFAULT NULL,
                        seating_capacity INT DEFAULT NULL,
                        curb_weight INT DEFAULT NULL,
                        gvwr INT DEFAULT NULL,
                        payload_capacity INT DEFAULT NULL,
                        towing_capacity INT DEFAULT NULL,
                        airbags INT DEFAULT NULL,
                        abs TINYINT(1) DEFAULT NULL,
                        esc TINYINT(1) DEFAULT NULL,
                        base_price INT DEFAULT NULL,
                        country VARCHAR(50) DEFAULT NULL,
                        manufacturer VARCHAR(100) DEFAULT NULL,
                        image_url VARCHAR(500) DEFAULT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        INDEX idx_make_model (make, model),
                        INDEX idx_year (year)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);

                // Create admins table
                await connection.query(`
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

                // Create settings table
                await connection.query(`
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

                // Create hero_images table
                await connection.query(`
                    CREATE TABLE IF NOT EXISTS hero_images (
                        id INT AUTO_INCREMENT NOT NULL,
                        mime_type VARCHAR(100) NOT NULL,
                        image_data MEDIUMBLOB NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (id)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
            } finally {
                await connection.end();
            }
        }

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
