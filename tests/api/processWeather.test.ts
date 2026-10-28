import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api/api';
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

    it('does not treat an afternoon pressure dip as a trend', () => {
        // Hour 8 is unchanged day to day. 06:00 is high and 18:00 is low.
        const dip = pressures(1016, 1013);
        const response = makeWeatherResponse([
            { date: '2024-06-15', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8, windDir: 90, code: 0, pressures: dip },
            { date: '2024-06-16', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8, windDir: 90, code: 0, pressures: dip },
        ]);
        const days = WeatherAPI.processWeather(response);
        expect(days[0]!.pressureTrend).toBe('stable');
        expect(days[1]!.pressureTrend).toBe('stable');
    });

    it('detects a rising 08:00 pressure against yesterday', () => {
        const yesterday = new Array(24).fill(1010) as number[];
        const today = new Array(24).fill(1013) as number[];
        today[6] = 1016;
        today[8] = 1013;
        today[18] = 1010;
        const response = makeWeatherResponse([
            { date: '2024-06-15', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8, windDir: 90, code: 0, pressures: yesterday },
            { date: '2024-06-16', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8, windDir: 90, code: 0, pressures: today },
        ]);
        expect(WeatherAPI.processWeather(response)[1]!.pressureTrend).toBe('rising');
    });

    it('detects a falling 08:00 pressure against yesterday', () => {
        const yesterday = new Array(24).fill(1016) as number[];
        const today = new Array(24).fill(1016) as number[];
        today[8] = 1013;
        today[18] = 1018;
        const response = makeWeatherResponse([
            { date: '2024-06-15', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8, windDir: 90, code: 0, pressures: yesterday },
            { date: '2024-06-16', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8, windDir: 90, code: 0, pressures: today },
        ]);
        expect(WeatherAPI.processWeather(response)[1]!.pressureTrend).toBe('falling');
    });

    it('scores dawn from the dawn hours, not the daily maximum wind', () => {
        const wind = new Array(24).fill(20);
        wind[5] = 4; wind[6] = 5; wind[7] = 6; wind[8] = 5;
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 90, tempMin: 70,
            precipitation: 1, windSpeed: 20, windDir: 180, code: 2,
            pressures: new Array(24).fill(1015) as number[],
        }]);
        response.hourly.wind_speed_10m = wind;
        response.hourly.temperature_2m = new Array(24).fill(88).map((v, h) => h < 9 ? 74 : v);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.windSpeed).toBe(20);
        expect(day!.dawn.windSpeed).toBe(5);
        expect(day!.dawn.tempF).toBe(74);
    });

    it('processes multiple days independently', () => {
        const response = makeWeatherResponse([
            { date: '2024-06-15', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8,  windDir: 90,  code: 0, pressures: pressures(1010, 1015) },
            { date: '2024-06-16', tempMax: 90, tempMin: 75, precipitation: 1, windSpeed: 12, windDir: 180, code: 3, pressures: pressures(1015, 1010) },
        ]);
        const days = WeatherAPI.processWeather(response);
        expect(days).toHaveLength(2);
        expect(days[0]!.pressureTrend).toBe('stable');
        expect(days[1]!.pressureTrend).toBe('stable');
        expect(days[0]!.date).toBe('2024-06-15');
        expect(days[1]!.date).toBe('2024-06-16');
    });
});
