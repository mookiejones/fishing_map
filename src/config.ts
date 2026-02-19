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

export const CONFIG: AppConfig = {
    // Replace this value — or enter the key in the on-screen setup panel
    GOOGLE_MAPS_API_KEY: localStorage.getItem('fishing_map_gkey') ?? 'AIzaSyBiZMDmP5rBNL8P00G7YuHYLBDOzY5ohn8',

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
