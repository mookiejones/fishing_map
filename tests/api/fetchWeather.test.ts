import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherAPI } from '../../src/api/api';
import { makeWeatherResponse } from './helpers';

describe('fetchWeather', () => {
    beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('asks Open-Meteo for precipitation in inches', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => makeWeatherResponse([{
                date: '2024-06-15', tempMax: 85, tempMin: 70,
                precipitation: 0.2, windSpeed: 8, windDir: 90, code: 0,
                pressures: new Array(24).fill(1013) as number[],
            }]),
        });
        vi.stubGlobal('fetch', fetchMock);

        await WeatherAPI.fetchWeather();

        const url = String(fetchMock.mock.calls[0]?.[0]);
        expect(url).toContain('precipitation_unit=inch');
        expect(url).toContain('temperature_2m');
        expect(url).toContain('wind_speed_10m');
        expect(url).toContain('temperature_unit=fahrenheit');
        expect(url).toContain('wind_speed_unit=mph');
    });
});
