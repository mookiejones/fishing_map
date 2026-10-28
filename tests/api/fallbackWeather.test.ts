import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api/api';
import { CONFIG } from '../../src/config';
import { forecastDates } from '../../src/time/forecastDates';

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

    it('dates follow the local fishing calendar, not UTC', () => {
        const days = WeatherAPI.fallbackWeather();
        expect(days.map(day => day.date)).toEqual(forecastDates(CONFIG.FORECAST_DAYS));
    });
});
