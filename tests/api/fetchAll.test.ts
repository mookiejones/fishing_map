import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherAPI } from '../../src/api';
import { CONFIG } from '../../src/config';
import { makeWeatherResponse } from './helpers';

describe('fetchAll', () => {
    beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('returns weather and tides on success', async () => {
        const mockWeatherResponse = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: new Array(24).fill(1013) as number[],
        }]);

        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => mockWeatherResponse })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    predictions: [{ t: '2024-06-15 06:30', v: '1.2', type: 'H' }],
                }),
            }),
        );

        const result = await WeatherAPI.fetchAll();
        expect(result.error).toBeNull();
        expect(result.weather).toHaveLength(1);
        expect(result.weather[0]!.date).toBe('2024-06-15');
        expect(result.tides['2024-06-15']).toBeDefined();
    });

    it('returns fallback data and error message on network failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

        const result = await WeatherAPI.fetchAll();
        expect(result.error).toBe('Network error');
        expect(result.weather).toHaveLength(CONFIG.FORECAST_DAYS);
        expect(Object.keys(result.tides)).toHaveLength(CONFIG.FORECAST_DAYS);
    });

    it('returns fallback and error when weather API returns non-ok status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

        const result = await WeatherAPI.fetchAll();
        expect(result.error).toContain('503');
        expect(result.weather).toHaveLength(CONFIG.FORECAST_DAYS);
    });
});
