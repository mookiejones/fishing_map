import { describe, it, expect } from 'vitest';
import { buildConditions, capitalize } from './utils';
import type { WeatherDay, TideEvent } from './types';

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

// ── buildConditions ───────────────────────────────────────────

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
        const c = buildConditions(mockDay, []);
        expect(c.tides).toEqual([]);
    });

    it('does not add any extra fields', () => {
        const c = buildConditions(mockDay, []);
        const keys = Object.keys(c).sort();
        expect(keys).toEqual([
            'precipitation', 'pressure', 'pressureTrend',
            'tempMax', 'tempMin', 'tides',
            'weatherCode', 'windDir', 'windSpeed',
        ].sort());
    });
});

// ── capitalize ────────────────────────────────────────────────

describe('capitalize', () => {
    it('capitalizes species names', () => {
        expect(capitalize('tarpon')).toBe('Tarpon');
        expect(capitalize('snook')).toBe('Snook');
        expect(capitalize('redfish')).toBe('Redfish');
    });

    it('only uppercases the first letter, leaves rest unchanged', () => {
        expect(capitalize('hello world')).toBe('Hello world');
        expect(capitalize('camelCase')).toBe('CamelCase');
    });

    it('handles single character', () => {
        expect(capitalize('a')).toBe('A');
    });

    it('handles already-capitalized string', () => {
        expect(capitalize('Tarpon')).toBe('Tarpon');
    });

    it('handles empty string without throwing', () => {
        expect(capitalize('')).toBe('');
    });
});
