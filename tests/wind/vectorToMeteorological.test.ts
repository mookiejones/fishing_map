import { describe, it, expect } from 'vitest';
import meteorologicalToVector from '../../src/wind/meteorologicalToVector';
import vectorToMeteorological from '../../src/wind/vectorToMeteorological';

describe('vectorToMeteorological', () => {
    it('recovers the from-direction of the cardinal winds', () => {
        for (const dir of [0, 90, 180, 270]) {
            const { u, v } = meteorologicalToVector(12, dir);
            expect(vectorToMeteorological(u, v)).toBeCloseTo(dir, 5);
        }
    });

    it('returns 0 for calm air', () => {
        expect(vectorToMeteorological(0, 0)).toBe(0);
    });
});
