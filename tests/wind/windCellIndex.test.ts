import { describe, it, expect } from 'vitest';
import windCellIndex from '../../src/wind/windCellIndex';

describe('windCellIndex', () => {
    it('walks time, then latitude, then longitude', () => {
        expect(windCellIndex(2, 3, 0, 0, 0)).toBe(0);
        expect(windCellIndex(2, 3, 0, 0, 2)).toBe(2);
        expect(windCellIndex(2, 3, 0, 1, 0)).toBe(3);
        expect(windCellIndex(2, 3, 1, 0, 0)).toBe(6);
    });
});
