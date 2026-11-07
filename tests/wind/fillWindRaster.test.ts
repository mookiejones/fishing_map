import { describe, it, expect } from 'vitest';
import fillWindRaster from '../../src/wind/fillWindRaster';
import windRgb from '../../src/wind/windRgb';
import type { WindField } from '../../src/wind/types';

function uniform(speedU: number): WindField {
    const nLat = 5;
    const nLng = 5;
    return {
        south: 28, west: -81, north: 28.4, east: -80.6,
        latStep: 0.1, lngStep: 0.1, nLat, nLng,
        times: ['2026-10-28T00:00'],
        u: new Float32Array(nLat * nLng).fill(speedU),
        v: new Float32Array(nLat * nLng).fill(0),
    };
}

describe('fillWindRaster', () => {
    it('paints the speed color at the interior and fades the rim', () => {
        const raster = fillWindRaster(uniform(10), 0, 9, 9, 200);
        const center = (4 * 9 + 4) * 4;
        const [r, g, b] = windRgb(10);
        expect([raster[center], raster[center + 1], raster[center + 2]]).toEqual([r, g, b]);
        expect(raster[center + 3]).toBe(200);

        const cornerAlpha = raster[3];
        expect(cornerAlpha).toBeLessThan(raster[center + 3]!);
    });
});
