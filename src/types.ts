// ============================================================
// types.ts — Shared type definitions (ES module)
// ============================================================

export type Species         = 'tarpon' | 'snook' | 'redfish';
export type SelectedSpecies = Species | 'all';
export type TideType        = 'H' | 'L';
export type TidePreference  = 'incoming' | 'outgoing';
export type PressureTrend   = 'rising' | 'falling' | 'stable';
export type Rating          = 'excellent' | 'good' | 'fair' | 'poor';

export interface TideEvent {
    hour:   number;
    minute: number;
    height: number;
    type:   TideType;
}

export interface WeatherDay {
    date:          string;   // "YYYY-MM-DD"
    tempMax:       number;
    tempMin:       number;
    precipitation: number;
    windSpeed:     number;
    windDir:       number;
    weatherCode:   number;
    pressure:      number;
    pressureTrend: PressureTrend;
}

export interface DayConditions {
    windSpeed:     number;
    windDir:       number;
    pressure:      number;
    pressureTrend: PressureTrend;
    tempMax:       number;
    tempMin:       number;
    precipitation: number;
    weatherCode:   number;
    tides:         TideEvent[];
}

export interface FishingSpot {
    id:             string;
    name:           string;
    lat:            number;
    lng:            number;
    species:        Species[];
    description:    string;
    features:       string[];
    tidePreference: TidePreference;
    tips:           string[];
}

export interface SpotScores {
    wind:        number;
    pressure:    number;
    tides:       number;
    temperature: number;
}

export interface SpotResult {
    score:    number;
    rating:   Rating;
    color:    string;
    scores:   SpotScores;
    bestTime: string;
}

export interface WeatherInfo {
    icon: string;
    desc: string;
}

export interface FetchResult {
    weather: WeatherDay[];
    tides:   Record<string, TideEvent[]>;
    error:   string | null;
}

export interface AppConfig {
    GOOGLE_MAPS_API_KEY: string;
    MAP_CENTER:          google.maps.LatLngLiteral;
    MAP_ZOOM:            number;
    NOAA_STATION:        string;
    NOAA_STATION_NAME:   string;
    WEATHER_LAT:         number;
    WEATHER_LNG:         number;
    FORECAST_DAYS:       number;
    TIMEZONE:            string;
}

// ── NOAA CO-OPS API ──────────────────────────────────────────────
export interface NoaaPrediction {
    t:    string;    // "YYYY-MM-DD HH:MM"
    v:    string;    // tide height (feet)
    type: TideType;
}

export interface NoaaResponse {
    predictions?: NoaaPrediction[];
    error?:       { message: string };
}

// ── Open-Meteo API ───────────────────────────────────────────────
export interface OpenMeteoDaily {
    time:                          string[];
    temperature_2m_max:            number[];
    temperature_2m_min:            number[];
    precipitation_sum:             (number | null)[];
    wind_speed_10m_max:            number[];
    wind_direction_10m_dominant:   number[];
    weather_code:                  number[];
}

export interface OpenMeteoHourly {
    surface_pressure: (number | null)[];
}

export interface OpenMeteoResponse {
    daily:  OpenMeteoDaily;
    hourly: OpenMeteoHourly;
}
