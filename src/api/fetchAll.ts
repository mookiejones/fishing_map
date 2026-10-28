import type { FetchResult, DataOrigin } from '../types';
import fetchWeather from './fetchWeather';
import fetchTides from './fetchTides';
import fallbackWeather from './fallbackWeather';
import fallbackTides from './fallbackTides';

type Settled<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };

async function settle<T>(work: Promise<T>): Promise<Settled<T>> {
    try {
        return { ok: true, value: await work };
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err);
        return { ok: false, error };
    }
}

/**
 * Fetches weather and tide data concurrently.
 *
 * A failure on one feed substitutes only that feed. The other feed is kept,
 * and `origin` says which half is synthetic so the UI does not call it live.
 */
const fetchAll = async function fetchAll(): Promise<FetchResult> {
    const [weatherResult, tideResult] = await Promise.all([
        settle(fetchWeather()),
        settle(fetchTides()),
    ]);

    const weather = weatherResult.ok ? weatherResult.value : fallbackWeather();
    const tides = tideResult.ok ? tideResult.value : fallbackTides();

    let origin: DataOrigin = 'live';
    let error: string | null = null;

    if (!weatherResult.ok && !tideResult.ok) {
        origin = 'fallback';
        error = `Weather: ${weatherResult.error}. Tides: ${tideResult.error}.`;
    } else if (!weatherResult.ok) {
        origin = 'weather-fallback';
        error = weatherResult.error;
    } else if (!tideResult.ok) {
        origin = 'tides-fallback';
        error = tideResult.error;
    }

    if (error) console.error('[WeatherAPI] Fetch error:', error);
    return { weather, tides, error, origin };
};

export default fetchAll;
