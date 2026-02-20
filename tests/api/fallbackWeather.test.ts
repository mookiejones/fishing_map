import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api/api';
import { CONFIG } from '../../src/config';

describe('fallbackWeather', () => {
    it('returns FORECAST_DAYS items', () => {
        expect(WeatherAPI.fallbackWeather()).toHaveLength(CONFIG.FORECAST_DAYS);
    });

    it('each item has all required WeatherDay fields', () => {
        WeatherAPI.fallbackWeather().forEach(day => {
            expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(typeof day.tempMax).toBe('number');
            expect(typeof day.tempMin).toBe('number');
            expect(typeof day.precipitation).toBe('number');
            expect(typeof day.windSpeed).toBe('number');
            expect(typeof day.windDir).toBe('number');
            expect(typeof day.weatherCode).toBe('number');
            expect(typeof day.pressure).toBe('number');
            expect(['rising', 'falling', 'stable']).toContain(day.pressureTrend);
        });
    });

    it('dates are sequential starting from today', () => {
        const days  = WeatherAPI.fallbackWeather();
        const today = new Date().toISOString().slice(0, 10);
        expect(days[0]!.date).toBe(today);
        for (let i = 1; i < days.length; i++) {
            const prev = new Date(days[i - 1]!.date);
            const curr = new Date(days[i]!.date);
            expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
        }
    });
});
