import { describe, it, expect } from 'vitest';
import sampleWind from '../../src/wind/sampleWind';
import type { WindField } from '../../src/wind/types';

function field(u: number[], v: number[]): WindField {
    return {
        south: 28, west: -81, north: 28.1, east: -80.9,
        latStep: 0.1, lngStep: 0.1, nLat: 2, nLng: 2,
        times: ['2026-10-28T00:00'],
        u: Float32Array.from(u),
        v: Float32Array.from(v),
    };
}

describe('sampleWind', () => {
    it('returns the southwest cell at the origin', () => {
        const sample = sampleWind(field([1, 3, 5, 7], [0, 0, 0, 0]), 0, 28, -81);
        expect(sample?.u).toBeCloseTo(1);
        expect(sample?.speed).toBeCloseTo(1);
    });

    it('bilinearly blends the four surrounding cells', () => {
        const sample = sampleWind(field([0, 10, 0, 10], [0, 0, 0, 0]), 0, 28.05, -80.95);
        expect(sample?.u).toBeCloseTo(5);
        expect(sample?.v).toBeCloseTo(0);
    });

    it('returns null outside the lattice', () => {
        expect(sampleWind(field([0, 0, 0, 0], [0, 0, 0, 0]), 0, 27, -81)).toBeNull();
    });
});
