-- =============================================
-- app name Database Schema
-- Version: 1.0.0
-- For CodeCanyon Distribution
-- =============================================

-- Create database (optional - uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS 'app name' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE 'app name';


-- =============================================
-- Table: vehicles
-- Stores all vehicle specifications
-- =============================================
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `make` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INT NOT NULL,
    `trim` VARCHAR(100) DEFAULT NULL,
    `horsepower` INT DEFAULT NULL,
    `torque` INT DEFAULT NULL,
    `engine_displacement` DECIMAL(3,1) DEFAULT NULL,
    `engine_cylinders` INT DEFAULT NULL,
    `engine_configuration` VARCHAR(50) DEFAULT NULL,
    `fuel_type` VARCHAR(50) DEFAULT NULL,
    `fuel_city_mpg` INT DEFAULT NULL,
    `fuel_highway_mpg` INT DEFAULT NULL,
    `fuel_combined_mpg` INT DEFAULT NULL,
    `transmission` VARCHAR(50) DEFAULT NULL,
    `transmission_speeds` INT DEFAULT NULL,
    `drivetrain` VARCHAR(10) DEFAULT NULL,
    `body_style` VARCHAR(50) DEFAULT NULL,
    `doors` INT DEFAULT NULL,
    `seating_capacity` INT DEFAULT NULL,
    `curb_weight` INT DEFAULT NULL,
    `gvwr` INT DEFAULT NULL,
    `payload_capacity` INT DEFAULT NULL,
    `towing_capacity` INT DEFAULT NULL,
    `airbags` INT DEFAULT NULL,
    `abs` TINYINT(1) DEFAULT NULL,
    `esc` TINYINT(1) DEFAULT NULL,
    `base_price` INT DEFAULT NULL,
    `country` VARCHAR(50) DEFAULT NULL,
    `manufacturer` VARCHAR(100) DEFAULT NULL,
    `image_url` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_make` (`make`),
    INDEX `idx_model` (`model`),
    INDEX `idx_year` (`year`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: vehicle_images
-- Stores multiple vehicle images as BLOBs
-- =============================================
CREATE TABLE IF NOT EXISTS `vehicle_images` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `mime_type` VARCHAR(100) NOT NULL,
    `image_data` MEDIUMBLOB NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_vehicle_sort` (`vehicle_id`, `sort_order`),
    INDEX `idx_vehicle_id` (`vehicle_id`),
    CONSTRAINT `fk_vehicle_images_vehicle_id`
        FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: hero_images
-- Stores the home hero image as BLOB
-- =============================================
CREATE TABLE IF NOT EXISTS `hero_images` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `image_data` MEDIUMBLOB NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: admins
-- Stores admin user accounts
-- =============================================
CREATE TABLE IF NOT EXISTS `admins` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) DEFAULT NULL,
    `role` ENUM('super_admin', 'admin', 'editor') DEFAULT 'admin',
    `is_active` TINYINT(1) DEFAULT 1,
    `last_login` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_email` (`email`),
    INDEX `idx_email` (`email`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: settings (optional - for future use)
-- Stores application settings
-- =============================================
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT AUTO_INCREMENT NOT NULL,
    `setting_key` VARCHAR(100) NOT NULL,
    `setting_value` MEDIUMTEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sample Data: Vehicles (Optional)
-- Uncomment to insert demo data
-- =============================================
/*
INSERT INTO `vehicles` (`id`, `make`, `model`, `year`, `trim`, `horsepower`, `torque`, `engine_displacement`, `engine_cylinders`, `engine_configuration`, `fuel_type`, `fuel_city_mpg`, `fuel_highway_mpg`, `fuel_combined_mpg`, `transmission`, `transmission_speeds`, `drivetrain`, `body_style`, `doors`, `seating_capacity`, `curb_weight`, `base_price`, `country`, `manufacturer`) VALUES
('ford-maverick-2025', 'Ford', 'Maverick', 2025, 'XLT', 250, 277, 2.0, 4, 'Inline Turbo', 'Gasoline', 23, 30, 26, 'Automatic', 8, 'FWD', 'Pickup', 4, 5, 3731, 28995, 'Mexico', 'Ford Motor Company'),
('toyota-camry-2024', 'Toyota', 'Camry', 2024, 'SE', 203, 184, 2.5, 4, 'Inline', 'Gasoline', 28, 39, 32, 'Automatic', 8, 'FWD', 'Sedan', 4, 5, 3300, 27500, 'USA', 'Toyota Motor Corporation'),
('tesla-model-3-2024', 'Tesla', 'Model 3', 2024, 'Long Range', 346, 379, NULL, NULL, NULL, 'Electric', 138, 126, 132, 'Automatic', 1, 'RWD', 'Sedan', 4, 5, 3550, 47990, 'USA', 'Tesla, Inc.');
*/

-- =============================================
-- Initial Settings
-- =============================================
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('app_name', 'AutoCompare'),
('app_version', '1.0.0'),
('setup_completed', 'false')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
