import { describe, it, expect } from 'vitest';
import { bestPhase, primeOverlap, tidePhases } from '../../src/engine/tidePhase';
import type { TideEvent } from '../../src/types';

const high = (hour: number, minute = 0, height = 4.8): TideEvent => ({ hour, minute, height, type: 'H' });
const low = (hour: number, minute = 0, height = 0.2): TideEvent => ({ hour, minute, height, type: 'L' });

describe('tidePhases', () => {
    it('treats the rise into a high as incoming and the fall after it as outgoing', () => {
        const phases = tidePhases([
            high(6, 45),
            low(13, 2),
        ]);
        const incoming = phases.find(phase => phase.kind === 'incoming' && phase.endMin === 6 * 60 + 45);
        const outgoing = phases.find(phase => phase.kind === 'outgoing' && phase.startMin === 6 * 60 + 45);
        expect(incoming).toBeDefined();
        expect(outgoing?.endMin).toBe(13 * 60 + 2);
    });

    it('does not use tide height', () => {
        const small = tidePhases([high(6, 45, 0.2), low(13, 2, 0.0)]);
        const ocean = tidePhases([high(6, 45, 5.2), low(13, 2, 0.4)]);
        expect(small).toEqual(ocean);
    });
});

describe('bestPhase', () => {
    it('gives an incoming spot the flood that runs through dawn, which starts at the low', () => {
        const phase = bestPhase([low(6, 0)], 'incoming');
        expect(phase?.kind).toBe('incoming');
        expect(phase?.startMin).toBe(6 * 60);
        expect(primeOverlap(phase!)).toBeGreaterThan(60);
    });

    it('gives an outgoing spot the ebb that starts at the high, not the low slack', () => {
        const atHigh = bestPhase([high(6, 45)], 'outgoing');
        const atLow = bestPhase([low(6, 45)], 'outgoing');
        expect(atHigh?.kind).toBe('outgoing');
        expect(atHigh?.startMin).toBe(6 * 60 + 45);
        expect(primeOverlap(atHigh!)).toBeGreaterThan(primeOverlap(atLow!));
    });
});
