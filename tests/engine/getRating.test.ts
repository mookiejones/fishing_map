import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';

describe('FishingEngine.getRating', () => {
    it('returns "excellent" at and above 78', () => {
        expect(FishingEngine.getRating(78)).toBe('excellent');
        expect(FishingEngine.getRating(100)).toBe('excellent');
    });

    it('returns "good" from 57 to 77', () => {
        expect(FishingEngine.getRating(57)).toBe('good');
        expect(FishingEngine.getRating(77)).toBe('good');
    });

    it('returns "fair" from 37 to 56', () => {
        expect(FishingEngine.getRating(37)).toBe('fair');
        expect(FishingEngine.getRating(56)).toBe('fair');
    });

    it('returns "poor" below 37', () => {
        expect(FishingEngine.getRating(36)).toBe('poor');
        expect(FishingEngine.getRating(0)).toBe('poor');
    });
});
