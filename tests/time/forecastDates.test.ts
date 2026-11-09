import { describe, it, expect } from 'vitest';
import { forecastDates } from '../../src/time/forecastDates';

describe('forecastDates', () => {
    it('uses the America/New_York calendar date, not UTC', () => {
        // 02:00 UTC on the 28th is still 22:00 EDT on the 27th.
        const evening = new Date('2026-10-28T02:00:00Z');
        expect(forecastDates(1, evening)[0]).toBe('2026-10-27');
    });

    it('rolls forward after local midnight', () => {
        const morning = new Date('2026-10-28T15:00:00Z'); // 11:00 EDT
        expect(forecastDates(3, morning)).toEqual([
            '2026-10-28',
            '2026-10-29',
            '2026-10-30',
        ]);
    });

    it('returns one key per requested day', () => {
        expect(forecastDates(7, new Date('2026-01-15T18:00:00Z'))).toHaveLength(7);
    });
});
