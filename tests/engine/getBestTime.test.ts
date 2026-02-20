import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';
import type { TideEvent } from '../../src/types';
import { incomingSpot, outgoingSpot } from './fixtures';

describe('FishingEngine.getBestTime', () => {
    it('returns a fallback string when tides array is empty', () => {
        expect(FishingEngine.getBestTime([], incomingSpot)).toBe('Dawn and dusk periods');
    });

    it('identifies dawn preferred tide (hour 5–9)', () => {
        const dawnH: TideEvent[] = [{ hour: 6, minute: 0, height: 1.2, type: 'H' }];
        expect(FishingEngine.getBestTime(dawnH, incomingSpot)).toContain('Dawn');
    });

    it('identifies dusk preferred tide (hour 16–20)', () => {
        const duskH: TideEvent[] = [{ hour: 18, minute: 30, height: 0.9, type: 'H' }];
        expect(FishingEngine.getBestTime(duskH, incomingSpot)).toContain('Dusk');
    });

    it('falls back to any preferred tide when no prime window matches', () => {
        const middayH: TideEvent[] = [{ hour: 11, minute: 0, height: 1.2, type: 'H' }];
        expect(FishingEngine.getBestTime(middayH, incomingSpot)).toContain('high');
    });

    it('falls back to "Dawn and dusk periods" when no preferred tide exists', () => {
        // incoming spot, but only L tides available
        const onlyL: TideEvent[] = [{ hour: 11, minute: 0, height: -0.1, type: 'L' }];
        expect(FishingEngine.getBestTime(onlyL, incomingSpot)).toBe('Dawn and dusk periods');
    });

    it('uses L tide as preferred for outgoing spots', () => {
        const dawnL: TideEvent[] = [{ hour: 7, minute: 0, height: -0.1, type: 'L' }];
        expect(FishingEngine.getBestTime(dawnL, outgoingSpot)).toContain('Dawn');
    });
});
