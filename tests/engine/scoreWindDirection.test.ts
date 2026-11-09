import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';

describe('FishingEngine.scoreWindDirection', () => {
    it('scores an east wind as the best direction for the flats', () => {
        expect(FishingEngine.scoreWindDirection(90)).toBe(10);
        expect(FishingEngine.scoreWindDirection(135)).toBe(10);
    });

    it('does not treat a northeast sea breeze as a north wind', () => {
        expect(FishingEngine.scoreWindDirection(44)).toBe(7);
        expect(FishingEngine.scoreWindDirection(31)).toBe(5);
        expect(FishingEngine.scoreWindDirection(44)).toBeGreaterThan(FishingEngine.scoreWindDirection(0));
    });

    it('scores northwest and north as the cold-front direction', () => {
        expect(FishingEngine.scoreWindDirection(0)).toBe(0);
        expect(FishingEngine.scoreWindDirection(350)).toBe(0);
        expect(FishingEngine.scoreWindDirection(10)).toBe(0);
    });
});
