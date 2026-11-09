import { describe, it, expect } from 'vitest';
import windGridPoints from '../../src/wind/windGridPoints';
import { WIND_GRID } from '../../src/wind/windGrid';

describe('windGridPoints', () => {
    it('lists the Cocoa Beach lattice from the southwest corner', () => {
        const points = windGridPoints();
        expect(points).toHaveLength(WIND_GRID.nLat * WIND_GRID.nLng);
        expect(points[0]).toEqual({ lat: WIND_GRID.south, lng: WIND_GRID.west });
        const last = points[points.length - 1]!;
        expect(last.lat).toBeCloseTo(WIND_GRID.south + (WIND_GRID.nLat - 1) * WIND_GRID.latStep, 4);
        expect(last.lng).toBeCloseTo(WIND_GRID.west + (WIND_GRID.nLng - 1) * WIND_GRID.lngStep, 4);
    });

    it('keeps Cocoa Beach and the Banana River inside the lattice', () => {
        const points = windGridPoints();
        const lats = points.map(p => p.lat);
        const lngs = points.map(p => p.lng);
        expect(Math.min(...lats)).toBeLessThan(28.05);
        expect(Math.max(...lats)).toBeGreaterThan(28.7);
        expect(Math.min(...lngs)).toBeLessThan(-80.9);
        expect(Math.max(...lngs)).toBeGreaterThan(-80.4);
    });
});
