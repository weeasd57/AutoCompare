// ============================================
// Database Check and Create API
// Checks database connection and creates database if needed
// ============================================

import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Prevent static generation at build time
export const dynamic = 'force-dynamic';

async function testConnection(config: any) {
    const connection = await mysql.createConnection(config);
    await connection.end();
    return NextResponse.json({ success: true, message: 'Connection successful' });
}

async function createDatabase(config: any, targetDb: string) {
    // Connect without specifying a database to create it
    const rootConnection = await mysql.createConnection(config);
    // Create the database
    await rootConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${targetDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await rootConnection.end();

    // Connect TO the database to create tables
    const dbConnection = await mysql.createConnection({ ...config, database: targetDb });

    const tables = [
        `CREATE TABLE IF NOT EXISTS vehicles (
            id VARCHAR(191) NOT NULL,
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
            drivetrain VARCHAR(10) DEFAULT NULL,
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
            image_url TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            INDEX idx_make (make),
            INDEX idx_model (model),
            INDEX idx_year (year),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        `CREATE TABLE IF NOT EXISTS vehicle_images (
            id INT AUTO_INCREMENT NOT NULL,
            vehicle_id VARCHAR(191) NOT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            mime_type VARCHAR(100) NOT NULL,
            image_data MEDIUMBLOB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_vehicle_sort (vehicle_id, sort_order),
            INDEX idx_vehicle_id (vehicle_id),
            CONSTRAINT fk_vehicle_images_vehicle_id
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
                ON DELETE CASCADE
                ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        `CREATE TABLE IF NOT EXISTS hero_images (
            id INT AUTO_INCREMENT NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            image_data MEDIUMBLOB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        `CREATE TABLE IF NOT EXISTS admins (
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
            UNIQUE KEY unique_email (email),
            INDEX idx_email (email),
            INDEX idx_is_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        `CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT NOT NULL,
            setting_key VARCHAR(100) NOT NULL,
            setting_value MEDIUMTEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY unique_key (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        `INSERT INTO settings (setting_key, setting_value) VALUES
        ('app_name', 'AutoCompare'),
        ('app_version', '1.0.0'),
        ('setup_completed', 'false')
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    ];

    for (const sql of tables) {
        await dbConnection.query(sql);
    }
    await dbConnection.end();

    return NextResponse.json({
        success: true,
        message: `Database '${targetDb}' created successfully with all tables.`,
        database: targetDb,
    });
}

export async function POST(request: Request) {
    const body = await request.json();
    const { action, databaseName, dbConfig } = body;

    // Use provided credentials or fall back to env (env is unlikely to work in first-time setup context if incorrect)
    const host = dbConfig?.host || process.env.DB_HOST || 'localhost';
    const user = dbConfig?.user || process.env.DB_USER || 'root';
    const password = dbConfig?.password ?? process.env.DB_PASSWORD ?? '';
    const port = Number(dbConfig?.port || process.env.DB_PORT || 3306);
    const useSsl = host.includes('tidbcloud') || process.env.DB_SSL === 'true';

    const config = {
        host,
        user,
        password,
        port,
        ssl: useSsl ? { rejectUnauthorized: true } : undefined,
    };

    try {
        if (action === 'test') {
            return await testConnection(config);
        }

        if (action === 'create') {
            const targetDb =
                databaseName || dbConfig?.database || process.env.DB_NAME || 'autocompare';
            return await createDatabase(config, targetDb);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Database operation error:', error);
        const status = action === 'create' ? 500 : 400; // Use 500 for creation errors, 400 for connection test errors
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to perform database operation' },
            { status }
        );
    }
}

export async function GET() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'autocompare';
    const dbPort = Number(process.env.DB_PORT || 3306);
    const useSsl = dbHost.includes('tidbcloud') || process.env.DB_SSL === 'true';

    try {
        const connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
            port: dbPort,
            ssl: useSsl ? { rejectUnauthorized: true } : undefined,
        });

        await connection.query('SELECT 1');
        await connection.end();

        return NextResponse.json({
            connected: true,
            databaseExists: true,
            database: dbName,
            host: dbHost,
        });
    } catch (error: any) {
        if (error.code === 'ER_BAD_DB_ERROR' || error.message?.includes('Unknown database')) {
            return NextResponse.json({
                connected: false,
                databaseExists: false,
                database: dbName,
                host: dbHost,
                error: 'DATABASE_NOT_FOUND',
            });
        }
        return NextResponse.json({
            connected: false,
            databaseExists: false,
            database: dbName,
            host: dbHost,
            error: 'CONNECTION_FAILED',
            message: error.message,
        });
    }
}
