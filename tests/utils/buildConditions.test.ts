import { describe, it, expect } from 'vitest';
import { buildConditions } from '../../src/utils';
import type { WeatherDay, TideEvent } from '../../src/types';

const mockDay: WeatherDay = {
    date:          '2024-06-15',
    tempMax:       85,
    tempMin:       72,
    precipitation: 0.1,
    windSpeed:     9,
    windDir:       135,
    weatherCode:   2,
    pressure:      1018,
    pressureTrend: 'stable',
};

const mockTides: TideEvent[] = [
    { hour: 6,  minute: 30, height:  1.2, type: 'H' },
    { hour: 12, minute: 45, height: -0.1, type: 'L' },
];

describe('buildConditions', () => {
    it('maps all WeatherDay fields to DayConditions', () => {
        const c = buildConditions(mockDay, mockTides);
        expect(c.windSpeed).toBe(mockDay.windSpeed);
        expect(c.windDir).toBe(mockDay.windDir);
        expect(c.pressure).toBe(mockDay.pressure);
        expect(c.pressureTrend).toBe(mockDay.pressureTrend);
        expect(c.tempMax).toBe(mockDay.tempMax);
        expect(c.tempMin).toBe(mockDay.tempMin);
        expect(c.precipitation).toBe(mockDay.precipitation);
        expect(c.weatherCode).toBe(mockDay.weatherCode);
    });

    it('attaches the provided tides array', () => {
        const c = buildConditions(mockDay, mockTides);
        expect(c.tides).toEqual(mockTides);
        expect(c.tides).toHaveLength(2);
    });

    it('accepts an empty tides array', () => {
        expect(buildConditions(mockDay, []).tides).toEqual([]);
    });

    it('does not add any extra fields', () => {
        const keys = Object.keys(buildConditions(mockDay, [])).sort();
        expect(keys).toEqual([
            'precipitation', 'pressure', 'pressureTrend',
            'tempMax', 'tempMin', 'tides',
            'weatherCode', 'windDir', 'windSpeed',
        ].sort());
    });
});
