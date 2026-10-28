import { describe, it, expect } from 'vitest';
import mercatorY from '../../src/wind/mercatorY';
import latFromMercator from '../../src/wind/latFromMercator';

describe('latFromMercator', () => {
    it('returns the bounds at the ends of the span', () => {
        expect(latFromMercator(29, 27.5, 0)).toBeCloseTo(29, 6);
        expect(latFromMercator(29, 27.5, 1)).toBeCloseTo(27.5, 6);
    });

    it('inverts mercatorY', () => {
        const lat = latFromMercator(29, 27.5, 0.35);
        const y = mercatorY(27.5) * 0.35 + mercatorY(29) * 0.65;
        expect(mercatorY(lat)).toBeCloseTo(y, 6);
    });
});
