import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST: Initialize database tables
export async function POST() {
    try {
        // Create vehicles table
        await query(`
            CREATE TABLE IF NOT EXISTS vehicles (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

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
                UNIQUE KEY unique_email (email),
                INDEX idx_email (email),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Create settings table
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

        // Insert initial settings
        await query(`
            INSERT INTO settings (setting_key, setting_value) VALUES
            ('app_name', 'AutoCompare'),
            ('app_version', '1.0.0'),
            ('setup_completed', 'false')
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `);

        return NextResponse.json({
            success: true,
            message: 'Database tables created successfully'
        });

    } catch (err: any) {
        console.error('Database initialization error:', err);
        return NextResponse.json(
            { error: 'Failed to create tables: ' + (err.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
