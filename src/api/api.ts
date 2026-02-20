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
} from '../types';
import { CONFIG } from '../config';
import fetchWeather from './fetchWeather';
import fallbackTides from './fallbackTides';
import fetchAll from './fetchAll';
import processWeather from './processWeather';
import fetchTides from './fetchTides';
import processTides from './processTides';
import weatherInfo from './weatherInfo';
import fallbackWeather from '././fallbackWeather';
import formatTideTime from './formatTideTime';
import degToCompass from './degToCompass';
/**
 * Facade over the Open-Meteo weather API and the NOAA CO-OPS tide API.
 *
 * All methods are designed for easy unit-testing: the processing methods
 * (`processWeather`, `processTides`) accept plain data objects and have no
 * network dependencies, while the fetch methods can be mocked via
 * `vi.stubGlobal('fetch', ...)`.
 */
export const WeatherAPI = {

    fetchAll:fetchAll
,

    fetchWeather:fetchWeather,

    processWeather:processWeather,

    /**
     * Fetches NOAA hi-lo tide predictions for the forecast period.
     *
     * Uses `CONFIG.NOAA_STATION` (Port Canaveral). If the NOAA API returns an
     * error payload, falls back to `fallbackTides()`.
     *
     * @throws If the HTTP response status is not OK.
     * @returns Tide events grouped by "YYYY-MM-DD" date key.
     */
    fetchTides:fetchTides,

    processTides:processTides,

    // ── Fallbacks when APIs are unavailable ────────────────────────

    /**
     * Generates synthetic tide data for the forecast period.
     *
     * Models Brevard County's mixed semidiurnal pattern by shifting the base
     * high tide time ~50 minutes per day. Used when the NOAA API is unavailable.
     *
     * @returns Fallback tide events grouped by "YYYY-MM-DD" date key.
     */
    fallbackTides:fallbackTides,


   fallbackWeather:fallbackWeather,

    // ── Helpers ────────────────────────────────────────────────────

    /**
     * Maps a WMO weather interpretation code to an emoji icon and short label.
     *
     * Covers the full WMO code range (0–99) plus a catch-all for unknown codes.
     *
     * @param code - WMO weather interpretation code from the Open-Meteo response.
     * @returns A `WeatherInfo` with `icon` (emoji) and `desc` (short text).
     */
    weatherInfo:weatherInfo,

    degToCompass:degToCompass   ,

    /**
     * Formats a tide event time object as a 12-hour AM/PM string.
     *
     * @param event - An object with `hour` (0–23) and `minute` (0–59).
     * @returns A formatted string such as `'6:30 AM'` or `'12:05 PM'`.
     */
    formatTideTime:formatTideTime,
};
