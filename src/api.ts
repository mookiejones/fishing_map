// ============================================================
// api.ts — Weather (Open-Meteo) and Tide (NOAA) data fetching
// ============================================================
// Both APIs are free and require no authentication.
//   Open-Meteo:  https://open-meteo.com
//   NOAA CO-OPS: https://tidesandcurrents.noaa.gov/api/
// ============================================================

import type {
    FetchResult, WeatherDay, TideEvent, TideType, PressureTrend,
    OpenMeteoResponse, NoaaResponse, NoaaPrediction, WeatherInfo,
} from './types';
import { CONFIG } from './config';

/**
 * Facade over the Open-Meteo weather API and the NOAA CO-OPS tide API.
 *
 * All methods are designed for easy unit-testing: the processing methods
 * (`processWeather`, `processTides`) accept plain data objects and have no
 * network dependencies, while the fetch methods can be mocked via
 * `vi.stubGlobal('fetch', ...)`.
 */
export const WeatherAPI = {

    /**
     * Fetches weather and tide data concurrently and returns both.
     *
     * If either request fails the error is caught and fallback data is returned
     * alongside the error message so the UI can display a meaningful status chip.
     *
     * @returns A `FetchResult` with weather days, tides keyed by date, and an
     *          optional error message (null on success).
     */
    async fetchAll(): Promise<FetchResult> {
        try {
            const [weather, tides] = await Promise.all([
                this.fetchWeather(),
                this.fetchTides(),
            ]);
            return { weather, tides, error: null };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error('[WeatherAPI] Fetch error:', message);
            return {
                weather: this.fallbackWeather(),
                tides:   this.fallbackTides(),
                error:   message,
            };
        }
    },

    /**
     * Fetches a 7-day daily forecast from Open-Meteo and returns processed days.
     *
     * Requests temperature, precipitation, wind, weather code (daily), and
     * surface pressure (hourly) in a single call. Units are °F and mph as
     * required by the scoring engine.
     *
     * @throws If the HTTP response status is not OK.
     * @returns An array of `WeatherDay` objects, one per forecast day.
     */
    async fetchWeather(): Promise<WeatherDay[]> {
        const params = new URLSearchParams({
            latitude:      String(CONFIG.WEATHER_LAT),
            longitude:     String(CONFIG.WEATHER_LNG),
            timezone:      CONFIG.TIMEZONE,
            forecast_days: String(CONFIG.FORECAST_DAYS),
            wind_speed_unit:  'mph',
            temperature_unit: 'fahrenheit',
            daily: [
                'temperature_2m_max',
                'temperature_2m_min',
                'precipitation_sum',
                'wind_speed_10m_max',
                'wind_direction_10m_dominant',
                'weather_code',
            ].join(','),
            hourly: 'surface_pressure',
        });

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!res.ok) throw new Error(`Weather API returned ${res.status}`);

        const data = await res.json() as OpenMeteoResponse;
        return this.processWeather(data);
    },

    /**
     * Transforms a raw Open-Meteo API response into an array of `WeatherDay` objects.
     *
     * Pressure is averaged across the day's 24 hourly readings (nulls excluded).
     * The barometric trend compares the 6 AM reading to the 6 PM reading:
     * diff > 1.5 hPa = rising, diff < −1.5 hPa = falling, otherwise stable.
     *
     * @param data - Raw JSON response from the Open-Meteo forecast endpoint.
     * @returns Processed array of `WeatherDay` objects.
     */
    processWeather(data: OpenMeteoResponse): WeatherDay[] {
        const { daily, hourly } = data;
        const days: WeatherDay[] = [];

        for (let i = 0; i < daily.time.length; i++) {
            const h0  = i * 24;
            const h24 = h0 + 24;

            // Filter out null pressure readings for this day's hours
            const pressures = hourly.surface_pressure
                .slice(h0, h24)
                .filter((p): p is number => p !== null);

            const avgPressure = pressures.length > 0
                ? pressures.reduce((a, b) => a + b, 0) / pressures.length
                : 1013;

            // Barometric trend: morning (6am) vs evening (6pm)
            const morning = hourly.surface_pressure[h0 + 6]  ?? avgPressure;
            const evening = hourly.surface_pressure[h0 + 18] ?? avgPressure;
            const diff    = evening - morning;

            let pressureTrend: PressureTrend = 'stable';
            if (diff > 1.5)  pressureTrend = 'rising';
            if (diff < -1.5) pressureTrend = 'falling';

            days.push({
                date:          daily.time[i]!,
                tempMax:       daily.temperature_2m_max[i]!,
                tempMin:       daily.temperature_2m_min[i]!,
                precipitation: daily.precipitation_sum[i] ?? 0,
                windSpeed:     daily.wind_speed_10m_max[i]!,
                windDir:       daily.wind_direction_10m_dominant[i]!,
                weatherCode:   daily.weather_code[i]!,
                pressure:      Math.round(avgPressure),
                pressureTrend,
            });
        }

        return days;
    },

    /**
     * Fetches NOAA hi-lo tide predictions for the forecast period.
     *
     * Uses `CONFIG.NOAA_STATION` (Port Canaveral). If the NOAA API returns an
     * error payload, falls back to `fallbackTides()`.
     *
     * @throws If the HTTP response status is not OK.
     * @returns Tide events grouped by "YYYY-MM-DD" date key.
     */
    async fetchTides(): Promise<Record<string, TideEvent[]>> {
        const today   = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + CONFIG.FORECAST_DAYS - 1);

        const fmt = (d: Date): string => d.toISOString().slice(0, 10).replace(/-/g, '');

        const params = new URLSearchParams({
            begin_date:  fmt(today),
            end_date:    fmt(endDate),
            station:     CONFIG.NOAA_STATION,
            product:     'predictions',
            datum:       'MLLW',
            time_zone:   'lst',     // Local Standard Time
            interval:    'hilo',    // Hi/Lo events only
            units:       'english',
            application: 'fishing_hotspot_map',
            format:      'json',
        });

        const res = await fetch(
            `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${params}`,
        );
        if (!res.ok) throw new Error(`NOAA API returned ${res.status}`);

        const data = await res.json() as NoaaResponse;

        if (data.error ?? !data.predictions) {
            console.warn('[WeatherAPI] NOAA error:', data.error?.message);
            return this.fallbackTides();
        }

        return this.processTides(data.predictions!);
    },

    /**
     * Groups raw NOAA prediction rows by date and converts time strings to
     * plain `{hour, minute}` numbers.
     *
     * Time strings are parsed manually (not via `new Date()`) to avoid
     * browser timezone misinterpretation of the station's local time values.
     *
     * @param predictions - Array of raw `NoaaPrediction` rows from NOAA.
     * @returns Tide events grouped by "YYYY-MM-DD" date key.
     */
    processTides(predictions: NoaaPrediction[]): Record<string, TideEvent[]> {
        const byDate: Record<string, TideEvent[]> = {};

        for (const p of predictions) {
            // p.t format: "YYYY-MM-DD HH:MM"
            const spaceIdx  = p.t.indexOf(' ');
            const datePart  = p.t.slice(0, spaceIdx);
            const timePart  = p.t.slice(spaceIdx + 1);
            const colonIdx  = timePart.indexOf(':');
            const hour      = parseInt(timePart.slice(0, colonIdx), 10);
            const minute    = parseInt(timePart.slice(colonIdx + 1), 10);

            if (!byDate[datePart]) byDate[datePart] = [];
            byDate[datePart]!.push({
                hour,
                minute,
                height: parseFloat(p.v),
                type:   p.type,
            });
        }

        return byDate;
    },

    // ── Fallbacks when APIs are unavailable ────────────────────────

    /**
     * Generates synthetic tide data for the forecast period.
     *
     * Models Brevard County's mixed semidiurnal pattern by shifting the base
     * high tide time ~50 minutes per day. Used when the NOAA API is unavailable.
     *
     * @returns Fallback tide events grouped by "YYYY-MM-DD" date key.
     */
    fallbackTides(): Record<string, TideEvent[]> {
        const tides: Record<string, TideEvent[]> = {};
        const today = new Date();

        for (let d = 0; d < CONFIG.FORECAST_DAYS; d++) {
            const date    = new Date(today);
            date.setDate(date.getDate() + d);
            const dateStr = date.toISOString().slice(0, 10);

            // Brevard County has a mixed semidiurnal pattern; shift ~50 min/day
            const shift = (d * 0.83) % 24;
            const h0    = (6 + shift) % 24;

            tides[dateStr] = [
                { hour: Math.floor(h0),             minute: 0,  height: 1.1,  type: 'H' as TideType },
                { hour: Math.floor((h0 + 6)  % 24), minute: 20, height: -0.1, type: 'L' as TideType },
                { hour: Math.floor((h0 + 12) % 24), minute: 45, height: 0.9,  type: 'H' as TideType },
                { hour: Math.floor((h0 + 18) % 24), minute: 55, height: 0.0,  type: 'L' as TideType },
            ].filter(t => t.hour >= 0 && t.hour < 24);
        }

        return tides;
    },

    /**
     * Generates placeholder weather data for the forecast period.
     *
     * Returns idealized conditions (clear sky, light wind, stable pressure)
     * representative of a typical Brevard County spring day. Used when the
     * Open-Meteo API is unavailable.
     *
     * @returns An array of `WeatherDay` objects, one per forecast day.
     */
    fallbackWeather(): WeatherDay[] {
        const today = new Date();
        return Array.from<unknown, WeatherDay>({ length: CONFIG.FORECAST_DAYS }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            return {
                date:          d.toISOString().slice(0, 10),
                tempMax:       78,
                tempMin:       65,
                precipitation: 0,
                windSpeed:     9,
                windDir:       90,
                weatherCode:   1,
                pressure:      1016,
                pressureTrend: 'stable',
            };
        });
    },

    // ── Helpers ────────────────────────────────────────────────────

    /**
     * Maps a WMO weather interpretation code to an emoji icon and short label.
     *
     * Covers the full WMO code range (0–99) plus a catch-all for unknown codes.
     *
     * @param code - WMO weather interpretation code from the Open-Meteo response.
     * @returns A `WeatherInfo` with `icon` (emoji) and `desc` (short text).
     */
    weatherInfo(code: number): WeatherInfo {
        if (code === 0)   return { icon: '☀️',  desc: 'Clear' };
        if (code <= 2)    return { icon: '⛅',  desc: 'Partly Cloudy' };
        if (code === 3)   return { icon: '☁️',  desc: 'Overcast' };
        if (code <= 48)   return { icon: '🌫️', desc: 'Foggy' };
        if (code <= 57)   return { icon: '🌦️', desc: 'Drizzle' };
        if (code <= 67)   return { icon: '🌧️', desc: 'Rain' };
        if (code <= 77)   return { icon: '❄️',  desc: 'Snow' };
        if (code <= 82)   return { icon: '🌦️', desc: 'Showers' };
        if (code <= 99)   return { icon: '⛈️',  desc: 'Thunderstorm' };
        return { icon: '🌤️', desc: 'Variable' };
    },

    /**
     * Converts a meteorological wind direction in degrees to a 16-point compass abbreviation.
     *
     * @param deg - Wind direction in degrees (0 = N, 90 = E, 180 = S, 270 = W).
     * @returns A compass string such as `'NE'` or `'SSW'`.
     */
    degToCompass(deg: number): string {
        const dirs = [
            'N','NNE','NE','ENE','E','ESE','SE','SSE',
            'S','SSW','SW','WSW','W','WNW','NW','NNW',
        ] as const;
        return dirs[Math.round(deg / 22.5) % 16]!;
    },

    /**
     * Formats a tide event time object as a 12-hour AM/PM string.
     *
     * @param event - An object with `hour` (0–23) and `minute` (0–59).
     * @returns A formatted string such as `'6:30 AM'` or `'12:05 PM'`.
     */
    formatTideTime({ hour, minute }: Pick<TideEvent, 'hour' | 'minute'>): string {
        const h    = hour % 12 || 12;
        const m    = String(minute).padStart(2, '0');
        const ampm = hour < 12 ? 'AM' : 'PM';
        return `${h}:${m} ${ampm}`;
    },
};
