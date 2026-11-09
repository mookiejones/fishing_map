import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';
import type { TideEvent } from '../../src/types';
import { incomingSpot, outgoingSpot } from './fixtures';

const high = (hour: number, minute = 0, height = 1): TideEvent => ({ hour, minute, height, type: 'H' });
const low = (hour: number, minute = 0, height = 0.2): TideEvent => ({ hour, minute, height, type: 'L' });

describe('FishingEngine.scoreTides', () => {
    it('returns 0 when no tides are provided', () => {
        expect(FishingEngine.scoreTides([], incomingSpot)).toBe(0);
    });

    it('scores an incoming spot higher when the flood runs through dawn', () => {
        expect(FishingEngine.scoreTides([low(6)], incomingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides([high(6)], incomingSpot));
    });

    it('scores an outgoing spot higher when the ebb covers dawn than when it misses both prime windows', () => {
        expect(FishingEngine.scoreTides([high(6)], outgoingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides([high(10)], outgoingSpot));
    });

    it('ignores ocean tide height', () => {
        const ocean = [high(6, 45, 5.2), low(13, 0, 0.4)];
        const inches = [high(6, 45, 0.3), low(13, 0, 0.0)];
        expect(FishingEngine.scoreTides(ocean, incomingSpot))
            .toBe(FishingEngine.scoreTides(inches, incomingSpot));
    });

    it('caps microtidal flats below inlet spots for the same ocean schedule', () => {
        const tides = [low(6, 0, 5.2)];
        const micro = { ...incomingSpot, id: 'micro', tideRegime: 'micro' as const };
        const inlet = { ...incomingSpot, id: 'inlet', tideRegime: 'inlet' as const };
        expect(FishingEngine.scoreTides(tides, micro)).toBeLessThanOrEqual(4);
        expect(FishingEngine.scoreTides(tides, inlet)).toBeGreaterThan(FishingEngine.scoreTides(tides, micro));
    });

    it('stays inside the regime cap', () => {
        const busy: TideEvent[] = [low(6), high(12), low(18), high(23)];
        expect(FishingEngine.scoreTides(busy, incomingSpot)).toBeLessThanOrEqual(8);
        expect(FishingEngine.scoreTides(busy, { ...incomingSpot, tideRegime: 'inlet' })).toBeLessThanOrEqual(12);
    });
});
