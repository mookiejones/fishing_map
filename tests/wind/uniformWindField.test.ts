import { describe, it, expect } from 'vitest';
import uniformWindField from '../../src/wind/uniformWindField';
import sampleWind from '../../src/wind/sampleWind';
import { WIND_GRID } from '../../src/wind/windGrid';

describe('uniformWindField', () => {
    it('fills every cell with the same east wind', () => {
        const now = new Date(Date.UTC(2026, 9, 28, 4, 40));
        const field = uniformWindField(10, 90, 3, now, 'America/New_York');
        expect(field.nLat).toBe(WIND_GRID.nLat);
        expect(field.times).toEqual([
            '2026-10-28T00:00',
            '2026-10-28T01:00',
            '2026-10-28T02:00',
        ]);
        const sample = sampleWind(field, 1, 28.32, -80.61);
        expect(sample?.u).toBeCloseTo(-10, 4);
        expect(sample?.v).toBeCloseTo(0, 4);
    });
});
