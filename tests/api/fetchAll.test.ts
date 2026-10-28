import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherAPI } from '../../src/api/api';
import { CONFIG } from '../../src/config';
import { makeWeatherResponse } from './helpers';

const liveWeather = makeWeatherResponse([{
    date: '2024-06-15', tempMax: 85, tempMin: 70,
    precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
    pressures: new Array(24).fill(1013) as number[],
}]);

const liveTides = {
    predictions: [{ t: '2024-06-15 06:30', v: '1.2', type: 'H' }],
};

describe('fetchAll', () => {
    beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('returns weather and tides on success', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => liveWeather })
            .mockResolvedValueOnce({ ok: true, json: async () => liveTides }),
        );

        const result = await WeatherAPI.fetchAll();
        expect(result.error).toBeNull();
        expect(result.origin).toBe('live');
        expect(result.weather).toHaveLength(1);
        expect(result.weather[0]!.date).toBe('2024-06-15');
        expect(result.tides['2024-06-15']).toBeDefined();
    });

    it('keeps live weather when only the tide request fails', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => liveWeather })
            .mockRejectedValueOnce(new Error('NOAA down')),
        );

        const result = await WeatherAPI.fetchAll();
        expect(result.origin).toBe('tides-fallback');
        expect(result.error).toContain('NOAA down');
        expect(result.weather[0]!.date).toBe('2024-06-15');
        expect(Object.keys(result.tides)).toHaveLength(CONFIG.FORECAST_DAYS);
    });

    it('keeps live tides when only the weather request fails', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockRejectedValueOnce(new Error('Open-Meteo down'))
            .mockResolvedValueOnce({ ok: true, json: async () => liveTides }),
        );

        const result = await WeatherAPI.fetchAll();
        expect(result.origin).toBe('weather-fallback');
        expect(result.error).toContain('Open-Meteo down');
        expect(result.weather).toHaveLength(CONFIG.FORECAST_DAYS);
        expect(result.tides['2024-06-15']).toBeDefined();
    });

    it('labels both feeds as offline data when both fail', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

        const result = await WeatherAPI.fetchAll();
        expect(result.origin).toBe('fallback');
        expect(result.error).toContain('Network error');
        expect(result.weather).toHaveLength(CONFIG.FORECAST_DAYS);
        expect(Object.keys(result.tides)).toHaveLength(CONFIG.FORECAST_DAYS);
    });

    it('does not call a NOAA error payload live data', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => liveWeather })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ error: { message: 'No data was found' } }),
            }),
        );

        const result = await WeatherAPI.fetchAll();
        expect(result.origin).toBe('tides-fallback');
        expect(result.error).toContain('No data was found');
    });
});
