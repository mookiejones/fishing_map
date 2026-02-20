import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';
import type { DayConditions } from '../../src/types';
import { incomingSpot, baseConditions } from './fixtures';

describe('FishingEngine.rateSpot', () => {
    it('returns null when species filter excludes the spot', () => {
        // incomingSpot has redfish + snook, not tarpon
        expect(FishingEngine.rateSpot(incomingSpot, baseConditions, 'tarpon')).toBeNull();
    });

    it('returns a SpotResult when species matches', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'snook');
        expect(result).not.toBeNull();
        expect(result?.score).toBeGreaterThan(0);
        expect(result?.score).toBeLessThanOrEqual(100);
    });

    it('returns a result when selectedSpecies is "all"', () => {
        expect(FishingEngine.rateSpot(incomingSpot, baseConditions, 'all')).not.toBeNull();
    });

    it('result contains all required fields', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'all');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('rating');
        expect(result).toHaveProperty('color');
        expect(result).toHaveProperty('bestTime');
        expect(result?.scores).toHaveProperty('wind');
        expect(result?.scores).toHaveProperty('pressure');
        expect(result?.scores).toHaveProperty('tides');
        expect(result?.scores).toHaveProperty('temperature');
    });

    it('score is always capped at 100', () => {
        const perfect: DayConditions = {
            ...baseConditions,
            windSpeed:     2,
            pressure:      1025,
            pressureTrend: 'rising',
            tempMax:       78,   // snook optimal
        };
        const result = FishingEngine.rateSpot(incomingSpot, perfect, 'snook');
        expect(result?.score).toBeLessThanOrEqual(100);
    });

    it('score sum of sub-scores matches total (before cap)', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'snook')!;
        const { wind, pressure, tides, temperature } = result.scores;
        expect(result.score).toBeLessThanOrEqual(wind + pressure + tides + temperature);
    });

    it('rating corresponds to score', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'all')!;
        expect(result.rating).toBe(FishingEngine.getRating(result.score));
    });
});
