import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';
import type { TideEvent } from '../../src/types';
import { incomingSpot, outgoingSpot, baseTides } from './fixtures';

describe('FishingEngine.scoreTides', () => {
    it('returns 14 when no tides are provided', () => {
        expect(FishingEngine.scoreTides([], incomingSpot)).toBe(14);
    });

    it('scores higher when preferred tide type is present', () => {
        const withPreferred: TideEvent[]    = [{ hour: 10, minute: 0, height: 1.0, type: 'H' }];
        const withoutPreferred: TideEvent[] = [{ hour: 10, minute: 0, height: 0.0, type: 'L' }];
        expect(FishingEngine.scoreTides(withPreferred, incomingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides(withoutPreferred, incomingSpot));
    });

    it('grants prime bonus for preferred tide at dawn (5–9)', () => {
        const dawnH:   TideEvent[] = [{ hour: 6,  minute: 0, height: 1.2, type: 'H' }];
        const middayH: TideEvent[] = [{ hour: 11, minute: 0, height: 1.2, type: 'H' }];
        expect(FishingEngine.scoreTides(dawnH, incomingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides(middayH, incomingSpot));
    });

    it('grants prime bonus for preferred tide at dusk (16–20)', () => {
        const duskH:   TideEvent[] = [{ hour: 18, minute: 0, height: 1.2, type: 'H' }];
        const middayH: TideEvent[] = [{ hour: 11, minute: 0, height: 1.2, type: 'H' }];
        expect(FishingEngine.scoreTides(duskH, incomingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides(middayH, incomingSpot));
    });

    it('uses L tide preference for outgoing spots', () => {
        const dawnL: TideEvent[] = [{ hour: 7, minute: 0, height: -0.1, type: 'L' }];
        const dawnH: TideEvent[] = [{ hour: 7, minute: 0, height:  1.2, type: 'H' }];
        expect(FishingEngine.scoreTides(dawnL, outgoingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides(dawnH, outgoingSpot));
    });

    it('never exceeds 30', () => {
        expect(FishingEngine.scoreTides(baseTides, incomingSpot)).toBeLessThanOrEqual(30);
    });

    it('scores more tide events higher (up to the cap)', () => {
        const oneTide:  TideEvent[] = [{ hour: 6, minute: 0, height: 1.2, type: 'H' }];
        const twoTides: TideEvent[] = [
            { hour: 6,  minute: 0, height:  1.2, type: 'H' },
            { hour: 12, minute: 0, height: -0.1, type: 'L' },
        ];
        expect(FishingEngine.scoreTides(twoTides, incomingSpot))
            .toBeGreaterThanOrEqual(FishingEngine.scoreTides(oneTide, incomingSpot));
    });
});
