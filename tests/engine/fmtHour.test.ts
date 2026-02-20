import { describe, it, expect } from 'vitest';
import { fmtHour } from '../../src/engine';

describe('fmtHour', () => {
    it('formats midnight (0) as 12:00 AM', () => {
        expect(fmtHour(0)).toBe('12:00 AM');
    });

    it('formats noon (12) as 12:00 PM', () => {
        expect(fmtHour(12)).toBe('12:00 PM');
    });

    it('formats morning hours as AM', () => {
        expect(fmtHour(6)).toBe('6:00 AM');
        expect(fmtHour(11)).toBe('11:00 AM');
    });

    it('formats afternoon/evening hours as PM', () => {
        expect(fmtHour(13)).toBe('1:00 PM');
        expect(fmtHour(18)).toBe('6:00 PM');
        expect(fmtHour(23)).toBe('11:00 PM');
    });
});
