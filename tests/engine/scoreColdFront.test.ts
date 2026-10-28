import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';

describe('FishingEngine.scoreColdFront', () => {
    it('does not call falling pressure and a northeast breeze a cold front', () => {
        expect(FishingEngine.scoreColdFront('falling', 44)).toBe(6);
        expect(FishingEngine.scoreColdFront('falling', 31)).toBe(6);
    });

    it('scores falling pressure and a north wind as an active front', () => {
        expect(FishingEngine.scoreColdFront('falling', 0)).toBe(0);
        expect(FishingEngine.scoreColdFront('falling', 350)).toBe(0);
    });

    it('leaves a stable northeast day unpenalized', () => {
        expect(FishingEngine.scoreColdFront('stable', 44)).toBe(10);
    });
});
