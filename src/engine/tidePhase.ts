import type { TideEvent, TidePreference } from '../types';

/** Mixed semidiurnal spacing used only when the opposite turn is off-screen. */
const CYCLE_MIN = 6 * 60 + 12;

export interface TidePhase {
    kind: TidePreference;
    /** Minutes from local midnight. Negative means the phase started yesterday. */
    startMin: number;
    endMin: number;
}

export const PRIME_WINDOWS = [
    { name: 'dawn' as const, start: 5 * 60, end: 9 * 60 },
    { name: 'dusk' as const, start: 16 * 60, end: 20 * 60 },
];

function eventMin(tide: TideEvent): number {
    return tide.hour * 60 + tide.minute;
}

/**
 * Rising water (low → high) is incoming. Falling water (high → low) is outgoing.
 * A lone turn gets a synthesized mate one semidiurnal cycle away so the limb
 * on either side of it still has a direction.
 */
export function tidePhases(tides: TideEvent[]): TidePhase[] {
    const sorted = [...tides].sort((a, b) => eventMin(a) - eventMin(b));
    if (sorted.length === 0) return [];

    const points = sorted.map(tide => ({ min: eventMin(tide), type: tide.type }));
    const first = points[0]!;
    const last = points[points.length - 1]!;
    points.unshift({ min: first.min - CYCLE_MIN, type: first.type === 'H' ? 'L' : 'H' });
    points.push({ min: last.min + CYCLE_MIN, type: last.type === 'H' ? 'L' : 'H' });

    const phases: TidePhase[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        const from = points[i]!;
        const to = points[i + 1]!;
        if (from.type === 'L' && to.type === 'H') {
            phases.push({ kind: 'incoming', startMin: from.min, endMin: to.min });
        } else if (from.type === 'H' && to.type === 'L') {
            phases.push({ kind: 'outgoing', startMin: from.min, endMin: to.min });
        }
    }
    return phases;
}

export function overlapMinutes(start: number, end: number, windowStart: number, windowEnd: number): number {
    return Math.max(0, Math.min(end, windowEnd) - Math.max(start, windowStart));
}

/** Minutes of this phase that fall inside dawn (05–09) or dusk (16–20). */
export function primeOverlap(phase: TidePhase): number {
    return PRIME_WINDOWS.reduce(
        (sum, window) => sum + overlapMinutes(phase.startMin, phase.endMin, window.start, window.end),
        0,
    );
}

/** The preferred limb that covers the most dawn or dusk time. */
export function bestPhase(tides: TideEvent[], preference: TidePreference): TidePhase | null {
    const matching = tidePhases(tides).filter(phase => phase.kind === preference);
    if (matching.length === 0) return null;
    return matching.reduce((best, phase) => (
        primeOverlap(phase) > primeOverlap(best) ? phase : best
    ));
}
