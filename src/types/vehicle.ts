// ============================================
// Vehicle Types - Core interfaces for AutoCompare
// ============================================

/**
 * Vehicle make from VPIC API
 */
export interface VehicleMake {
    makeId: number;
    makeName: string;
}

/**
 * Vehicle model from VPIC API
 */
export interface VehicleModel {
    makeId: number;
    makeName: string;
    modelId: number;
    modelName: string;
}

/**
 * Vehicle trim/variant information
 */
export interface VehicleTrim {
    id: string;
    name: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
}

/**
 * Search suggestion for autocomplete
 */
export interface VehicleSuggestion {
    id: string;
    displayName: string; // e.g., "Ford Maverick 2025"
    make: string;
    model: string;
    year: number;
    trim?: string;
    score?: number; // Fuzzy match score
}

/**
 * Raw VPIC API response structure
 */
export interface VPICResponse {
    Count: number;
    Message: string;
    SearchCriteria: string | null;
    Results: VPICResult[];
}

export interface VPICResult {
    [key: string]: string | number | null;
}

/**
 * Normalized vehicle specifications
 * Standardized keys for easy comparison
 */
export interface NormalizedSpec {
    // Identity
    id: string;
    make: string;
    model: string;
    year: number;
    trim: string | null;

    // Engine specs
    horsepower: number | null;
    torque: number | null;
    engineDisplacement: number | null; // in liters
    engineCylinders: number | null;
    engineConfiguration: string | null; // V6, Inline-4, etc.
    fuelType: string | null;

    // Fuel economy
    fuelCityMpg: number | null;
    fuelHighwayMpg: number | null;
    fuelCombinedMpg: number | null;

    // Transmission & Drivetrain
    transmission: string | null;
    transmissionSpeeds: number | null;
    drivetrain: string | null; // FWD, RWD, AWD, 4WD

    // Body & Dimensions
    bodyStyle: string | null;
    doors: number | null;
    seatingCapacity: number | null;

    // Weight & Capacity
    curbWeight: number | null; // in lbs
    gvwr: number | null; // Gross Vehicle Weight Rating
    payloadCapacity: number | null;
    towingCapacity: number | null;

    // Safety
    airbags: number | null;
    abs: boolean | null;
    esc: boolean | null; // Electronic Stability Control

    // Other
    basePrice: number | null;
    country: string | null;
    manufacturer: string | null;
    imageUrl?: string | null;
}

/**
 * Comparison result between two vehicles
 */
export interface ComparisonResult {
    vehicles: NormalizedSpec[];
    categories: ComparisonCategory[];
    overallWinner: string | 'tie' | null; // vehicleId or 'tie'
}

/**
 * Individual comparison category
 */
export interface ComparisonCategory {
    name: string;
    icon: string;
    values: Record<string, string | number | null>; // vehicleId -> value
    winner: string | 'tie' | null; // vehicleId or 'tie'
    unit?: string;
    higherIsBetter: boolean;
}

/**
 * Auto-generated highlight/insight
 */
export interface ComparisonHighlight {
    id: string;
    category: string;
    icon: string;
    message: string; // e.g., "Maverick wins in fuel economy — 42 mpg vs 33 mpg"
    winner: string; // vehicleId
    importance: 'high' | 'medium' | 'low';
}

// ============================================
// API Provider Types - Extensible architecture
// ============================================

/**
 * Data provider configuration
 */
export interface DataProvider {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    requiresApiKey: boolean;
    apiKey?: string;
    baseUrl: string;
}

/**
 * Available data providers
 */
export type ProviderType = 'vpic' | 'carapi' | 'vehicledb' | 'custom';

/**
 * Admin settings for API providers
 */
export interface ProviderSettings {
    providers: Record<ProviderType, DataProvider>;
    primaryProvider: ProviderType;
}

// ============================================
// UI State Types
// ============================================

/**
 * Search state
 */
export interface SearchState {
    query: string;
    isLoading: boolean;
    suggestions: VehicleSuggestion[];
    error: string | null;
}

/**
 * Comparison page state
 */
/**
 * Comparison page state
 */
export interface CompareState {
    vehicles: NormalizedSpec[];
    comparison: ComparisonResult | null;
    highlights: ComparisonHighlight[];
    isLoading: boolean;
    error: string | null;
}
