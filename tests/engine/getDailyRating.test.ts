import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';
import type { DayConditions } from '../../src/types';
import { baseConditions } from './fixtures';

describe('FishingEngine.getDailyRating', () => {
    it('returns a valid Rating string', () => {
        const rating = FishingEngine.getDailyRating(baseConditions);
        expect(['excellent', 'good', 'fair', 'poor']).toContain(rating);
    });

    it('rates poor conditions lower than good conditions', () => {
        const poor: DayConditions = {
            ...baseConditions,
            windSpeed:     40,
            pressure:      985,
            pressureTrend: 'falling',
            tempMax:       50,
        };
        const good: DayConditions = {
            ...baseConditions,
            windSpeed:     3,
            pressure:      1025,
            pressureTrend: 'rising',
            tempMax:       78,
        };

        const order = ['poor', 'fair', 'good', 'excellent'];
        expect(order.indexOf(FishingEngine.getDailyRating(good)))
            .toBeGreaterThan(order.indexOf(FishingEngine.getDailyRating(poor)));
    });
});
