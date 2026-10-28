import { describe, it, expect } from 'vitest';
import dayTickIndexes from '../../src/wind/dayTickIndexes';

describe('dayTickIndexes', () => {
    it('centers one tick on each day, including a short leading day', () => {
        const times = [
            '2026-10-27T22:00',
            '2026-10-27T23:00',
            '2026-10-28T00:00',
            '2026-10-28T01:00',
            '2026-10-28T02:00',
        ];
        expect(dayTickIndexes(times)).toEqual([
            { start: 0, end: 1, label: 'Tue 27' },
            { start: 2, end: 4, label: 'Wed 28' },
        ]);
    });
});
