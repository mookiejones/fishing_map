import { describe, it, expect } from 'vitest';
import parseWindResponse from '../../src/wind/parseWindResponse';
import sampleWind from '../../src/wind/sampleWind';
import type { WindGridSpec } from '../../src/wind/types';

const grid: WindGridSpec = {
    south: 28, west: -81, latStep: 0.1, lngStep: 0.1, nLat: 2, nLng: 2,
};

const points = [
    { lat: 28, lng: -81 },
    { lat: 28, lng: -80.9 },
    { lat: 28.1, lng: -81 },
    { lat: 28.1, lng: -80.9 },
];

const unixMidnightEdt = Date.UTC(2026, 9, 28, 4, 0, 0) / 1000;

function location(speed: number, dir: number) {
    return {
        utc_offset_seconds: -14400,
        hourly: {
            time: [unixMidnightEdt, unixMidnightEdt + 3600],
            wind_speed_10m: [speed, speed + 1],
            wind_direction_10m: [dir, dir],
        },
    };
}

describe('parseWindResponse', () => {
    it('places each location on its grid cell and shifts unixtime into local hours', () => {
        const field = parseWindResponse([
            location(10, 0),
            location(0, 0),
            location(0, 0),
            location(20, 90),
        ], points, grid);

        expect(field.times).toEqual(['2026-10-28T00:00', '2026-10-28T01:00']);
        const sw = sampleWind(field, 0, 28, -81);
        expect(sw?.v).toBeCloseTo(-10, 4);
        const ne = sampleWind(field, 0, 28.1, -80.9);
        expect(ne?.u).toBeCloseTo(-20, 4);
        const later = sampleWind(field, 1, 28, -81);
        expect(later?.speed).toBeCloseTo(11, 4);
    });

    it('accepts a single location object and ISO timestamps', () => {
        const one: WindGridSpec = {
            south: 28, west: -81, latStep: 1, lngStep: 1, nLat: 1, nLng: 1,
        };
        const field = parseWindResponse({
            hourly: {
                time: ['2026-10-28T09:00'],
                wind_speed_10m: [6],
                wind_direction_10m: [180],
            },
        }, [{ lat: 28, lng: -81 }], one);
        expect(field.times).toEqual(['2026-10-28T09:00']);
        expect(sampleWind(field, 0, 28, -81)?.v).toBeCloseTo(6, 4);
    });

    it('treats null speeds as calm', () => {
        const one: WindGridSpec = {
            south: 28, west: -81, latStep: 1, lngStep: 1, nLat: 1, nLng: 1,
        };
        const field = parseWindResponse({
            hourly: {
                time: ['2026-10-28T09:00'],
                wind_speed_10m: [null],
                wind_direction_10m: [null],
            },
        }, [{ lat: 28, lng: -81 }], one);
        expect(sampleWind(field, 0, 28, -81)?.speed).toBe(0);
    });

    it('rejects a payload that does not cover the grid', () => {
        expect(() => parseWindResponse([location(1, 0)], points, grid)).toThrow(/locations/);
    });

    it('rejects an error payload', () => {
        expect(() => parseWindResponse({ error: true, reason: 'nope' }, points, grid)).toThrow('nope');
    });
});
