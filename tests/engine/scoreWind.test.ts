import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';

describe('FishingEngine.scoreWind', () => {
    it('returns 25 for calm conditions (< 5 mph)', () => {
        expect(FishingEngine.scoreWind(0)).toBe(25);
        expect(FishingEngine.scoreWind(4)).toBe(25);
    });

    it('returns 20 for light wind (5–9 mph)', () => {
        expect(FishingEngine.scoreWind(5)).toBe(20);
        expect(FishingEngine.scoreWind(9)).toBe(20);
    });

    it('returns 13 for moderate wind (10–14 mph)', () => {
        expect(FishingEngine.scoreWind(10)).toBe(13);
        expect(FishingEngine.scoreWind(14)).toBe(13);
    });

    it('returns 6 for fresh wind (15–19 mph)', () => {
        expect(FishingEngine.scoreWind(15)).toBe(6);
        expect(FishingEngine.scoreWind(19)).toBe(6);
    });

    it('returns 2 for strong wind (20–24 mph)', () => {
        expect(FishingEngine.scoreWind(20)).toBe(2);
        expect(FishingEngine.scoreWind(24)).toBe(2);
    });

    it('returns 0 for gale conditions (≥ 25 mph)', () => {
        expect(FishingEngine.scoreWind(25)).toBe(0);
        expect(FishingEngine.scoreWind(60)).toBe(0);
    });
});
