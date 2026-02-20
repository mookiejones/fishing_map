import type {
    FetchResult, WeatherDay, TideEvent, TideType, PressureTrend,
    OpenMeteoResponse, NoaaResponse, NoaaPrediction, WeatherInfo,
} from '../types';
import fetchWeather from './fetchWeather';
import fallbackTides from './fallbackTides';
import fetchTides from './fetchTides';
import fallbackWeather from './fallbackWeather';
/**
     * Fetches weather and tide data concurrently and returns both.
     *
     * If either request fails the error is caught and fallback data is returned
     * alongside the error message so the UI can display a meaningful status chip.
     *
     * @returns A `FetchResult` with weather days, tides keyed by date, and an
     *          optional error message (null on success).
     */

const fetchAll = async function fetchAll(): Promise<FetchResult> {
        try {
            const [weather, tides] = await Promise.all([
                fetchWeather(),
                fetchTides(),
            ]);
            return { weather, tides, error: null };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error('[WeatherAPI] Fetch error:', message);
            return {
                weather: fallbackWeather(),
                tides:   fallbackTides(),
                error:   message,
            };
        }
    }

export default fetchAll;