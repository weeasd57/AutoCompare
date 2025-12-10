-- =============================================
-- AutoCompare Demo Data
-- Run this after database.sql to add sample vehicles
-- =============================================

INSERT INTO `vehicles` (`id`, `make`, `model`, `year`, `trim`, `horsepower`, `torque`, `engine_displacement`, `engine_cylinders`, `engine_configuration`, `fuel_type`, `fuel_city_mpg`, `fuel_highway_mpg`, `fuel_combined_mpg`, `transmission`, `transmission_speeds`, `drivetrain`, `body_style`, `doors`, `seating_capacity`, `curb_weight`, `base_price`, `country`, `manufacturer`, `image_url`) VALUES

-- Sedans
('toyota-camry-2024', 'Toyota', 'Camry', 2024, 'SE', 203, 184, 2.5, 4, 'Inline', 'Gasoline', 28, 39, 32, 'Automatic', 8, 'FWD', 'Sedan', 4, 5, 3310, 27500, 'USA', 'Toyota Motor Corporation', 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'),
('honda-accord-2024', 'Honda', 'Accord', 2024, 'Sport', 192, 192, 1.5, 4, 'Inline Turbo', 'Gasoline', 29, 37, 32, 'CVT', 1, 'FWD', 'Sedan', 4, 5, 3239, 28990, 'USA', 'Honda Motor Company', 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=800'),
('bmw-3-series-2024', 'BMW', '3 Series', 2024, '330i', 255, 295, 2.0, 4, 'Inline Turbo', 'Gasoline', 26, 36, 30, 'Automatic', 8, 'RWD', 'Sedan', 4, 5, 3582, 44900, 'Germany', 'BMW AG', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'),
('mercedes-c-class-2024', 'Mercedes-Benz', 'C-Class', 2024, 'C300', 255, 295, 2.0, 4, 'Inline Turbo', 'Gasoline', 25, 35, 29, 'Automatic', 9, 'RWD', 'Sedan', 4, 5, 3726, 46550, 'Germany', 'Mercedes-Benz AG', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'),

-- SUVs
('toyota-rav4-2024', 'Toyota', 'RAV4', 2024, 'XLE', 203, 184, 2.5, 4, 'Inline', 'Gasoline', 27, 35, 30, 'Automatic', 8, 'AWD', 'SUV', 4, 5, 3615, 31460, 'Japan', 'Toyota Motor Corporation', 'https://images.unsplash.com/photo-1568844293986-8c1a5f8b8e8c?w=800'),
('honda-crv-2024', 'Honda', 'CR-V', 2024, 'EX-L', 190, 179, 1.5, 4, 'Inline Turbo', 'Gasoline', 28, 34, 30, 'CVT', 1, 'AWD', 'SUV', 4, 5, 3455, 35550, 'USA', 'Honda Motor Company', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800'),
('ford-explorer-2024', 'Ford', 'Explorer', 2024, 'XLT', 300, 310, 2.3, 4, 'Inline Turbo', 'Gasoline', 21, 28, 24, 'Automatic', 10, 'RWD', 'SUV', 4, 7, 4345, 38995, 'USA', 'Ford Motor Company', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800'),
('jeep-grand-cherokee-2024', 'Jeep', 'Grand Cherokee', 2024, 'Limited', 293, 260, 3.6, 6, 'V6', 'Gasoline', 19, 26, 22, 'Automatic', 8, '4WD', 'SUV', 4, 5, 4710, 45695, 'USA', 'Stellantis', 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800'),

-- Electric Vehicles
('tesla-model-3-2024', 'Tesla', 'Model 3', 2024, 'Long Range', 346, 389, NULL, NULL, 'Electric Motor', 'Electric', 138, 126, 132, 'Automatic', 1, 'RWD', 'Sedan', 4, 5, 3862, 47990, 'USA', 'Tesla, Inc.', 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800'),
('tesla-model-y-2024', 'Tesla', 'Model Y', 2024, 'Long Range', 384, 375, NULL, NULL, 'Dual Motor', 'Electric', 123, 117, 120, 'Automatic', 1, 'AWD', 'SUV', 4, 5, 4363, 52990, 'USA', 'Tesla, Inc.', 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800'),
('ford-mustang-mach-e-2024', 'Ford', 'Mustang Mach-E', 2024, 'Premium', 266, 317, NULL, NULL, 'Electric Motor', 'Electric', 105, 93, 100, 'Automatic', 1, 'RWD', 'SUV', 4, 5, 4394, 46995, 'Mexico', 'Ford Motor Company', 'https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=800'),
('hyundai-ioniq-6-2024', 'Hyundai', 'IONIQ 6', 2024, 'SE Long Range', 225, 258, NULL, NULL, 'Electric Motor', 'Electric', 140, 107, 116, 'Automatic', 1, 'RWD', 'Sedan', 4, 5, 4190, 45500, 'South Korea', 'Hyundai Motor Company', 'https://images.unsplash.com/photo-1680701465783-a2e4e2e6e9f8?w=800'),

-- Trucks
('ford-f150-2024', 'Ford', 'F-150', 2024, 'XLT', 400, 410, 3.5, 6, 'V6 Twin Turbo', 'Gasoline', 18, 24, 20, 'Automatic', 10, '4WD', 'Pickup', 4, 6, 4705, 44970, 'USA', 'Ford Motor Company', 'https://images.unsplash.com/photo-1590656872261-1c7a0c0e0e0e?w=800'),
('chevrolet-silverado-2024', 'Chevrolet', 'Silverado 1500', 2024, 'LT', 355, 383, 5.3, 8, 'V8', 'Gasoline', 16, 22, 18, 'Automatic', 8, '4WD', 'Pickup', 4, 6, 5150, 48600, 'USA', 'General Motors', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800'),
('ram-1500-2024', 'RAM', '1500', 2024, 'Big Horn', 395, 410, 5.7, 8, 'V8 eTorque', 'Gasoline', 17, 23, 19, 'Automatic', 8, '4WD', 'Pickup', 4, 6, 5200, 47340, 'USA', 'Stellantis', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
('toyota-tundra-2024', 'Toyota', 'Tundra', 2024, 'SR5', 389, 479, 3.5, 6, 'V6 Twin Turbo', 'Gasoline', 17, 22, 19, 'Automatic', 10, '4WD', 'Pickup', 4, 5, 5335, 43975, 'USA', 'Toyota Motor Corporation', 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800'),

-- Sports Cars
('ford-mustang-2024', 'Ford', 'Mustang', 2024, 'GT', 480, 415, 5.0, 8, 'V8', 'Gasoline', 15, 24, 18, 'Manual', 6, 'RWD', 'Coupe', 2, 4, 3832, 43090, 'USA', 'Ford Motor Company', 'https://images.unsplash.com/photo-1584345604476-8ec5f82d718c?w=800'),
('chevrolet-camaro-2024', 'Chevrolet', 'Camaro', 2024, 'SS', 455, 455, 6.2, 8, 'V8', 'Gasoline', 16, 26, 19, 'Automatic', 10, 'RWD', 'Coupe', 2, 4, 3685, 44500, 'USA', 'General Motors', 'https://images.unsplash.com/photo-1603553329474-99f95f35394f?w=800'),
('porsche-911-2024', 'Porsche', '911', 2024, 'Carrera', 379, 331, 3.0, 6, 'Flat-6 Twin Turbo', 'Gasoline', 18, 25, 21, 'PDK', 8, 'RWD', 'Coupe', 2, 4, 3354, 116950, 'Germany', 'Porsche AG', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800'),
('nissan-z-2024', 'Nissan', 'Z', 2024, 'Sport', 400, 350, 3.0, 6, 'V6 Twin Turbo', 'Gasoline', 19, 28, 22, 'Manual', 6, 'RWD', 'Coupe', 2, 2, 3494, 42970, 'Japan', 'Nissan Motor Corporation', 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800'),

-- Luxury
('lexus-es-2024', 'Lexus', 'ES', 2024, '350 F Sport', 302, 267, 3.5, 6, 'V6', 'Gasoline', 22, 32, 26, 'Automatic', 8, 'FWD', 'Sedan', 4, 5, 3649, 46750, 'Japan', 'Toyota Motor Corporation', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800'),
('audi-a4-2024', 'Audi', 'A4', 2024, 'Premium Plus', 261, 273, 2.0, 4, 'Inline Turbo', 'Gasoline', 25, 34, 28, 'Automatic', 7, 'AWD', 'Sedan', 4, 5, 3627, 45290, 'Germany', 'Audi AG', 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'),
('genesis-g70-2024', 'Genesis', 'G70', 2024, '3.3T Sport', 365, 376, 3.3, 6, 'V6 Twin Turbo', 'Gasoline', 18, 27, 21, 'Automatic', 8, 'RWD', 'Sedan', 4, 5, 3887, 43150, 'South Korea', 'Hyundai Motor Company', 'https://images.unsplash.com/photo-1621993202323-f438eec934ff?w=800'),

-- Compact
('honda-civic-2024', 'Honda', 'Civic', 2024, 'Sport', 180, 177, 1.5, 4, 'Inline Turbo', 'Gasoline', 31, 40, 35, 'CVT', 1, 'FWD', 'Sedan', 4, 5, 2906, 26800, 'USA', 'Honda Motor Company', 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800'),
('mazda-3-2024', 'Mazda', 'Mazda3', 2024, 'Premium', 191, 186, 2.5, 4, 'Inline', 'Gasoline', 26, 35, 30, 'Automatic', 6, 'FWD', 'Sedan', 4, 5, 3124, 28950, 'Japan', 'Mazda Motor Corporation', 'https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?w=800'),
('volkswagen-jetta-2024', 'Volkswagen', 'Jetta', 2024, 'SEL', 158, 184, 1.5, 4, 'Inline Turbo', 'Gasoline', 31, 41, 35, 'Automatic', 8, 'FWD', 'Sedan', 4, 5, 3047, 27995, 'Mexico', 'Volkswagen AG', 'https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=800');
