import { describe, it, expect } from 'vitest';
import { WeatherAPI } from '../../src/api/api';

describe('formatTideTime', () => {
    it('formats a morning time correctly', () => {
        expect(WeatherAPI.formatTideTime({ hour: 6, minute: 30 })).toBe('6:30 AM');
    });

    it('formats a midday time correctly', () => {
        expect(WeatherAPI.formatTideTime({ hour: 14, minute: 5 })).toBe('2:05 PM');
    });

    it('zero-pads single-digit minutes', () => {
        expect(WeatherAPI.formatTideTime({ hour: 9, minute: 3 })).toBe('9:03 AM');
    });

    it('midnight (hour=0) → 12:xx AM', () => {
        expect(WeatherAPI.formatTideTime({ hour: 0, minute: 0 })).toBe('12:00 AM');
    });

    it('noon (hour=12) → 12:xx PM', () => {
        expect(WeatherAPI.formatTideTime({ hour: 12, minute: 45 })).toBe('12:45 PM');
    });

    it('11 PM', () => {
        expect(WeatherAPI.formatTideTime({ hour: 23, minute: 59 })).toBe('11:59 PM');
    });
});
