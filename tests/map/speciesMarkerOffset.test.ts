import { describe, it, expect } from 'vitest';
import { maxSpeciesOffsetDegrees } from '../../src/map/speciesMarkerOffset';

describe('speciesMarkerOffset', () => {
    it('keeps every species within about 150 m of the spot', () => {
        // 0.0015° of latitude is about 167 m. The old offset was 0.004° (~440 m).
        expect(maxSpeciesOffsetDegrees()).toBeLessThan(0.0015);
        expect(maxSpeciesOffsetDegrees()).toBeGreaterThan(0);
    });
});
