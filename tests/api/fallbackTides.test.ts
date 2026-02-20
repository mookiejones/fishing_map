import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api';
import { CONFIG } from '../../src/config';

describe('fallbackTides', () => {
    it('returns an entry for each forecast day', () => {
        expect(Object.keys(WeatherAPI.fallbackTides())).toHaveLength(CONFIG.FORECAST_DAYS);
    });

    it('each date key is YYYY-MM-DD format', () => {
        Object.keys(WeatherAPI.fallbackTides()).forEach(key => {
            expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    it('each day has tide events with valid types', () => {
        Object.values(WeatherAPI.fallbackTides()).forEach(tides => {
            expect(tides.length).toBeGreaterThan(0);
            tides.forEach(t => {
                expect(['H', 'L']).toContain(t.type);
                expect(t.hour).toBeGreaterThanOrEqual(0);
                expect(t.hour).toBeLessThan(24);
            });
        });
    });
});
