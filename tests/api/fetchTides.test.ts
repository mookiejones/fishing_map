import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherAPI } from '../../src/api/api';
import { CONFIG } from '../../src/config';
import { forecastDates } from '../../src/time/forecastDates';

describe('fetchTides', () => {
    beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('requests lst_ldt over the local forecast dates', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                predictions: [{ t: '2026-10-27 09:53', v: '5.2', type: 'H' }],
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        await WeatherAPI.fetchTides();

        const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
        const dates = forecastDates(CONFIG.FORECAST_DAYS);
        expect(url.searchParams.get('time_zone')).toBe('lst_ldt');
        expect(url.searchParams.get('station')).toBe('8721604');
        expect(url.searchParams.get('begin_date')).toBe(dates[0]!.replace(/-/g, ''));
        expect(url.searchParams.get('end_date')).toBe(dates[dates.length - 1]!.replace(/-/g, ''));
    });

    it('throws when NOAA returns an error payload with HTTP 200', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ error: { message: 'No data was found' } }),
        }));

        await expect(WeatherAPI.fetchTides()).rejects.toThrow('No data was found');
    });
});
