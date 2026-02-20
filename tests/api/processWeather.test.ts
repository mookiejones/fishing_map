import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api';
import { makeWeatherResponse, pressures } from './helpers';

describe('processWeather', () => {
    it('maps all daily fields correctly', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 88, tempMin: 71,
            precipitation: 0.2, windSpeed: 11, windDir: 180, code: 2,
            pressures: new Array(24).fill(1018) as number[],
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.date).toBe('2024-06-15');
        expect(day!.tempMax).toBe(88);
        expect(day!.tempMin).toBe(71);
        expect(day!.precipitation).toBe(0.2);
        expect(day!.windSpeed).toBe(11);
        expect(day!.windDir).toBe(180);
        expect(day!.weatherCode).toBe(2);
    });

    it('averages pressure across 24 hours and rounds', () => {
        // All pressures = 1017.6 → rounds to 1018
        const p = new Array(24).fill(1017.6) as number[];
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: p,
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.pressure).toBe(1018);
    });

    it('falls back to 1013 when all pressures are null', () => {
        const p: (number | null)[] = new Array(24).fill(null);
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: p,
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.pressure).toBe(1013);
    });

    it('treats null precipitation_sum as 0', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: null, windSpeed: 8, windDir: 90, code: 0,
            pressures: new Array(24).fill(1013) as number[],
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.precipitation).toBe(0);
    });

    it('detects rising pressure trend (diff > 1.5)', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: pressures(1012, 1015),   // diff = +3
        }]);
        expect(WeatherAPI.processWeather(response)[0]!.pressureTrend).toBe('rising');
    });

    it('detects falling pressure trend (diff < -1.5)', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: pressures(1015, 1012),   // diff = -3
        }]);
        expect(WeatherAPI.processWeather(response)[0]!.pressureTrend).toBe('falling');
    });

    it('marks stable when diff is within ±1.5', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: pressures(1013, 1014),   // diff = +1
        }]);
        expect(WeatherAPI.processWeather(response)[0]!.pressureTrend).toBe('stable');
    });

    it('processes multiple days independently', () => {
        const response = makeWeatherResponse([
            { date: '2024-06-15', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8,  windDir: 90,  code: 0, pressures: pressures(1010, 1015) },
            { date: '2024-06-16', tempMax: 90, tempMin: 75, precipitation: 1, windSpeed: 12, windDir: 180, code: 3, pressures: pressures(1015, 1010) },
        ]);
        const days = WeatherAPI.processWeather(response);
        expect(days).toHaveLength(2);
        expect(days[0]!.pressureTrend).toBe('rising');
        expect(days[1]!.pressureTrend).toBe('falling');
        expect(days[0]!.date).toBe('2024-06-15');
        expect(days[1]!.date).toBe('2024-06-16');
    });
});
