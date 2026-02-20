// ============================================================
// types.ts — Shared type definitions (ES module)
// ============================================================

/** One of the three target species supported by this app. */
export type Species         = 'tarpon' | 'snook' | 'redfish';

/** Species filter value — a specific species or 'all' to show every species. */
export type SelectedSpecies = Species | 'all';

/** NOAA tide prediction type: 'H' = high tide, 'L' = low tide. */
export type TideType        = 'H' | 'L';

/** Whether a spot fishes better on an incoming or outgoing tide. */
export type TidePreference  = 'incoming' | 'outgoing';

/** Direction of barometric pressure change over the course of a day. */
export type PressureTrend   = 'rising' | 'falling' | 'stable';

/** Human-readable fishing quality rating produced by `FishingEngine.getRating()`. */
export type Rating          = 'excellent' | 'good' | 'fair' | 'poor';

/** A single NOAA hi-lo tide event parsed from the station's local-time string. */
export interface TideEvent {
    /** Hour of the event in 24-hour local time (0–23). */
    hour:   number;
    /** Minute of the event (0–59). */
    minute: number;
    /** Predicted tide height in feet (MLLW datum). Negative values indicate below datum. */
    height: number;
    /** 'H' for high tide, 'L' for low tide. */
    type:   TideType;
}

/** One day of Open-Meteo forecast data as stored in app state. */
export interface WeatherDay {
    /** ISO date string "YYYY-MM-DD". */
    date:          string;
    /** Daily high temperature in °F. */
    tempMax:       number;
    /** Daily low temperature in °F. */
    tempMin:       number;
    /** Total precipitation in inches. */
    precipitation: number;
    /** Maximum wind speed in mph. */
    windSpeed:     number;
    /** Dominant meteorological wind direction in degrees (0 = N, 90 = E). */
    windDir:       number;
    /** WMO weather interpretation code. See `WeatherAPI.weatherInfo()` for the mapping. */
    weatherCode:   number;
    /** Average surface pressure for the day, rounded to the nearest hPa. */
    pressure:      number;
    pressureTrend: PressureTrend;
}

/**
 * The scoring engine's unified view of conditions for a single day.
 * Combines weather fields from `WeatherDay` with the day's tide schedule.
 */
export interface DayConditions {
    /** Maximum wind speed in mph. */
    windSpeed:     number;
    /** Dominant wind direction in degrees. */
    windDir:       number;
    /** Average surface pressure in hPa. */
    pressure:      number;
    pressureTrend: PressureTrend;
    /** Daily high temperature in °F. */
    tempMax:       number;
    /** Daily low temperature in °F. */
    tempMin:       number;
    /** Total precipitation in inches. */
    precipitation: number;
    /** WMO weather code. */
    weatherCode:   number;
    /** Hi-lo tide schedule for this day. Empty array if unavailable. */
    tides:         TideEvent[];
}

/** A hardcoded Brevard County fishing location with scoring metadata. */
export interface FishingSpot {
    /** Unique kebab-case identifier, e.g. 'mosquito-lagoon'. */
    id:             string;
    /** Display name shown on map markers and in the SpotDrawer. */
    name:           string;
    /** WGS-84 latitude. */
    lat:            number;
    /** WGS-84 longitude. */
    lng:            number;
    /** Species known to inhabit this spot. Determines scoring species and marker count. */
    species:        Species[];
    /** Short paragraph describing the spot shown in the SpotDrawer. */
    description:    string;
    /** Habitat descriptors shown as chips, e.g. 'flats', 'grass', 'oyster'. */
    features:       string[];
    /** Whether this spot fishes better on incoming or outgoing tide. */
    tidePreference: TidePreference;
    /** Locally-sourced fishing tips shown in the SpotDrawer. */
    tips:           string[];
}

/** Individual sub-scores from `FishingEngine.rateSpot()`, each with a known maximum. */
export interface SpotScores {
    /** Wind score (0–25). Lower wind → higher score. */
    wind:        number;
    /** Barometric pressure score (0–25). Rising high pressure → higher score. */
    pressure:    number;
    /** Tides score (0–30). Preferred tide type + prime dawn/dusk window → higher score. */
    tides:       number;
    /** Temperature score (0–20). Species-specific thermal comfort range. */
    temperature: number;
}

/** The complete result of scoring a single spot for one day and one target species. */
export interface SpotResult {
    /** Aggregate score capped at 100. Sum of all sub-scores. */
    score:    number;
    rating:   Rating;
    /** Hex color corresponding to the rating (matches map marker color). */
    color:    string;
    scores:   SpotScores;
    /** Human-readable suggested fishing window, e.g. "Dawn tide (~6:00 AM)". */
    bestTime: string;
}

/** Emoji icon + short text description for a WMO weather code. */
export interface WeatherInfo {
    /** Unicode emoji representing the weather condition. */
    icon: string;
    /** Short description, e.g. "Partly Cloudy". */
    desc: string;
}

/** Return value of `WeatherAPI.fetchAll()`. */
export interface FetchResult {
    weather: WeatherDay[];
    /** Tide events grouped by "YYYY-MM-DD" date key. */
    tides:   Record<string, TideEvent[]>;
    /** Error message if either API call failed; null on success. */
    error:   string | null;
}

/** Shape of the `CONFIG` constant defined in `config.ts`. */
export interface AppConfig {
    /** Google Maps JavaScript API key, read from localStorage on startup. */
    GOOGLE_MAPS_API_KEY: string;
    /** Initial map center (Brevard County, FL). */
    MAP_CENTER:          google.maps.LatLngLiteral;
    /** Initial map zoom level. */
    MAP_ZOOM:            number;
    /** NOAA CO-OPS station ID used for tide predictions. */
    NOAA_STATION:        string;
    /** Human-readable name of the NOAA station. */
    NOAA_STATION_NAME:   string;
    /** Latitude used for the Open-Meteo weather request. */
    WEATHER_LAT:         number;
    /** Longitude used for the Open-Meteo weather request. */
    WEATHER_LNG:         number;
    /** Number of forecast days to fetch (1–16 on Open-Meteo free tier). */
    FORECAST_DAYS:       number;
    /** IANA timezone string passed to Open-Meteo. */
    TIMEZONE:            string;
}

// ── NOAA CO-OPS API ──────────────────────────────────────────────

/** A single prediction row from the NOAA CO-OPS hi-lo JSON response. */
export interface NoaaPrediction {
    /** Timestamp in station local time: "YYYY-MM-DD HH:MM". */
    t:    string;
    /** Tide height in feet as a decimal string (may be negative). */
    v:    string;
    type: TideType;
}

/** Top-level shape of a NOAA CO-OPS predictions API response. */
export interface NoaaResponse {
    predictions?: NoaaPrediction[];
    error?:       { message: string };
}

// ── Open-Meteo API ───────────────────────────────────────────────

/** Daily forecast arrays from Open-Meteo (one entry per forecast day). */
export interface OpenMeteoDaily {
    time:                          string[];
    temperature_2m_max:            number[];
    temperature_2m_min:            number[];
    /** null when data is unavailable for a particular day. */
    precipitation_sum:             (number | null)[];
    wind_speed_10m_max:            number[];
    wind_direction_10m_dominant:   number[];
    weather_code:                  number[];
}

/** Hourly surface pressure array from Open-Meteo (one entry per hour, 24 × forecast days). */
export interface OpenMeteoHourly {
    /** null when sensor data is unavailable for a particular hour. */
    surface_pressure: (number | null)[];
}

/** Combined Open-Meteo forecast response consumed by `WeatherAPI.processWeather()`. */
export interface OpenMeteoResponse {
    daily:  OpenMeteoDaily;
    hourly: OpenMeteoHourly;
}
