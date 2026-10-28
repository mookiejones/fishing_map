import { describe, it, expect } from 'vitest';
import formatWindTime from '../../src/wind/formatWindTime';

describe('formatWindTime', () => {
    it('labels a local afternoon', () => {
        expect(formatWindTime('2026-10-28T15:00')).toEqual({ day: 'Wed 28', hour: '3 PM' });
    });

    it('labels midnight as 12 AM', () => {
        expect(formatWindTime('2026-10-27T00:00').hour).toBe('12 AM');
    });

    it('labels noon as 12 PM', () => {
        expect(formatWindTime('2026-10-28T12:00').hour).toBe('12 PM');
    });
});
