import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api';

describe('weatherInfo', () => {
    it('code 0 → Clear', () => {
        const w = WeatherAPI.weatherInfo(0);
        expect(w.desc).toBe('Clear');
        expect(w.icon).toBeTruthy();
    });

    it('codes 1-2 → Partly Cloudy', () => {
        expect(WeatherAPI.weatherInfo(1).desc).toBe('Partly Cloudy');
        expect(WeatherAPI.weatherInfo(2).desc).toBe('Partly Cloudy');
    });

    it('code 3 → Overcast', () => {
        expect(WeatherAPI.weatherInfo(3).desc).toBe('Overcast');
    });

    it('codes 4-48 → Foggy', () => {
        expect(WeatherAPI.weatherInfo(4).desc).toBe('Foggy');
        expect(WeatherAPI.weatherInfo(48).desc).toBe('Foggy');
    });

    it('codes 49-57 → Drizzle', () => {
        expect(WeatherAPI.weatherInfo(49).desc).toBe('Drizzle');
        expect(WeatherAPI.weatherInfo(57).desc).toBe('Drizzle');
    });

    it('codes 58-67 → Rain', () => {
        expect(WeatherAPI.weatherInfo(58).desc).toBe('Rain');
        expect(WeatherAPI.weatherInfo(67).desc).toBe('Rain');
    });

    it('codes 68-77 → Snow', () => {
        expect(WeatherAPI.weatherInfo(68).desc).toBe('Snow');
        expect(WeatherAPI.weatherInfo(77).desc).toBe('Snow');
    });

    it('codes 78-82 → Showers', () => {
        expect(WeatherAPI.weatherInfo(78).desc).toBe('Showers');
        expect(WeatherAPI.weatherInfo(82).desc).toBe('Showers');
    });

    it('codes 83-99 → Thunderstorm', () => {
        expect(WeatherAPI.weatherInfo(83).desc).toBe('Thunderstorm');
        expect(WeatherAPI.weatherInfo(99).desc).toBe('Thunderstorm');
    });

    it('code >99 → Variable', () => {
        expect(WeatherAPI.weatherInfo(100).desc).toBe('Variable');
        expect(WeatherAPI.weatherInfo(999).desc).toBe('Variable');
    });

    it('all results have a non-empty icon and desc', () => {
        [0, 1, 3, 10, 50, 60, 70, 80, 90, 100].forEach(code => {
            const { icon, desc } = WeatherAPI.weatherInfo(code);
            expect(icon.trim().length).toBeGreaterThan(0);
            expect(desc.trim().length).toBeGreaterThan(0);
        });
    });
});
