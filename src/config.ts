// ============================================================
// config.ts — App-wide settings and API configuration
// ============================================================
//
// HOW TO GET A GOOGLE MAPS API KEY:
//   1. Visit https://console.cloud.google.com and open/create a project
//   2. APIs & Services → Library → enable "Maps JavaScript API"
//   3. APIs & Services → Credentials → + Create Credentials → API key
//   4. Paste the key below (or enter it in the in-app setup screen)
//
// Weather (Open-Meteo) and tide (NOAA) data require NO key.
// ============================================================

import type { AppConfig } from './types';

/**
 * Global application configuration.
 *
 * The Google Maps API key is resolved in priority order:
 *   1. `localStorage` key `fishing_map_gkey` (set by the in-app setup banner)
 *   2. `VITE_GOOGLE_MAPS_API_KEY` environment variable (from `.env`)
 *   3. Placeholder string `'YOUR_GOOGLE_MAPS_API_KEY'` → triggers the setup banner
 *
 * All other values are static constants targeting Brevard County, Florida.
 */
export const CONFIG: AppConfig = {
    GOOGLE_MAPS_API_KEY:
        localStorage.getItem('fishing_map_gkey') ??
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY ??
        'YOUR_GOOGLE_MAPS_API_KEY',

    // Map initial view — centered on Brevard County, FL
    MAP_CENTER: { lat: 28.37, lng: -80.72 },
    MAP_ZOOM: 10,

    // NOAA CO-OPS tide station: Trident Pier, Port Canaveral
    NOAA_STATION: '8721604',
    NOAA_STATION_NAME: 'Port Canaveral',

    // Coordinates for weather API (Cocoa Beach area)
    WEATHER_LAT: 28.4,
    WEATHER_LNG: -80.72,

    // Days of forecast to fetch (Open-Meteo free tier supports up to 16)
    FORECAST_DAYS: 7,

    TIMEZONE: 'America/New_York',
};
