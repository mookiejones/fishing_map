import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';
import type { TideEvent } from '../../src/types';
import { incomingSpot, outgoingSpot } from './fixtures';

const tide = (hour: number, minute: number, type: TideEvent['type'], height = 1): TideEvent => (
    { hour, minute, height, type }
);

describe('FishingEngine.getBestTime', () => {
    it('returns a fallback string when tides array is empty', () => {
        expect(FishingEngine.getBestTime([], incomingSpot)).toBe('Dawn and dusk periods');
    });

    it('names the incoming flood through dawn and keeps the minutes', () => {
        // Low at 6:45 starts the rise, so dawn is incoming until the next high.
        const text = FishingEngine.getBestTime([tide(6, 45, 'L')], incomingSpot);
        expect(text).toContain('Dawn');
        expect(text).toContain('Incoming until');
        expect(text).toContain('12:57 PM');
        expect(text).not.toContain('6:00');
    });

    it('names the outgoing ebb that starts at the high, not the low', () => {
        const text = FishingEngine.getBestTime([
            tide(6, 45, 'H', 5.1),
            tide(13, 2, 'L', 0.2),
        ], outgoingSpot);
        expect(text).toContain('Outgoing until');
        expect(text).toContain('1:02 PM');
        expect(text).not.toContain('low tide');
    });

    it('does not call a high tide "incoming" for an outgoing spot', () => {
        const text = FishingEngine.getBestTime([tide(6, 45, 'H')], outgoingSpot);
        expect(text).toContain('Outgoing until');
        expect(text).not.toContain('Incoming');
    });

    it('tells a microtidal flat that the ocean tide is not the local water', () => {
        const micro = { ...incomingSpot, tideRegime: 'micro' as const };
        const text = FishingEngine.getBestTime([tide(6, 45, 'L')], micro);
        expect(text).toContain('Wind-driven flat');
        expect(text).toContain('12:57 PM');
    });

    it('still reports a preferred limb that misses dawn and dusk', () => {
        const text = FishingEngine.getBestTime([tide(15, 30, 'H')], incomingSpot);
        expect(text).toBe('Incoming until 3:30 PM');
    });
});
