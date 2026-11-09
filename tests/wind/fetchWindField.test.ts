import { describe, it, expect, vi, afterEach } from 'vitest';
import fetchWindField from '../../src/wind/fetchWindField';
import windGridPoints from '../../src/wind/windGridPoints';
import sampleWind from '../../src/wind/sampleWind';

describe('fetchWindField', () => {
    afterEach(() => { vi.unstubAllGlobals(); });

    it('posts the lattice to Open-Meteo and reads the field back', async () => {
        const points = windGridPoints();
        const hour = Date.UTC(2026, 9, 28, 4, 0, 0) / 1000;
        vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
            expect(String(url)).toContain('api.open-meteo.com/v1/forecast');
            expect(init.method).toBe('POST');
            const params = new URLSearchParams(String(init.body));
            expect(params.get('hourly')).toBe('wind_speed_10m,wind_direction_10m');
            expect(params.get('wind_speed_unit')).toBe('mph');
            expect(params.get('timezone')).toBe('America/New_York');
            expect(params.get('latitude')?.split(',').length).toBe(points.length);

            const locations = points.map(() => ({
                utc_offset_seconds: -14400,
                hourly: {
                    time: [hour],
                    wind_speed_10m: [15],
                    wind_direction_10m: [90],
                },
            }));
            return { ok: true, json: async () => locations };
        }));

        const field = await fetchWindField();
        expect(field.times).toEqual(['2026-10-28T00:00']);
        const sample = sampleWind(field, 0, 28.32, -80.61);
        expect(sample?.u).toBeCloseTo(-15, 3);
        expect(sample?.v).toBeCloseTo(0, 3);
    });

    it('throws when the service rejects the request', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
        await expect(fetchWindField()).rejects.toThrow(/503/);
    });
});
