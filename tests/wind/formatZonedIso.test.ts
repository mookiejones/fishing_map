import { describe, it, expect } from 'vitest';
import formatZonedIso from '../../src/wind/formatZonedIso';

describe('formatZonedIso', () => {
    it('formats an instant in Eastern Daylight Time', () => {
        const instant = new Date(Date.UTC(2026, 9, 28, 4, 15));
        expect(formatZonedIso(instant, 'America/New_York')).toBe('2026-10-28T00:15');
    });
});
