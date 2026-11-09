import { describe, it, expect } from 'vitest';
import windRgb from '../../src/wind/windRgb';
import WIND_COLOR_STOPS from '../../src/wind/windColorStops';

describe('windRgb', () => {
    it('matches the ramp endpoints', () => {
        expect(windRgb(0)).toEqual([...WIND_COLOR_STOPS[0]!.rgb]);
        expect(windRgb(56)).toEqual([...WIND_COLOR_STOPS[WIND_COLOR_STOPS.length - 1]!.rgb]);
    });

    it('clamps speeds past the top of the ramp', () => {
        expect(windRgb(80)).toEqual(windRgb(56));
        expect(windRgb(-5)).toEqual(windRgb(0));
    });

    it('blends the midpoint between two stops', () => {
        const calm = WIND_COLOR_STOPS[0]!.rgb;
        const next = WIND_COLOR_STOPS[1]!.rgb;
        const mid = windRgb(2);
        expect(mid[0]).toBe(Math.round((calm[0] + next[0]) / 2));
        expect(mid[2]).toBe(Math.round((calm[2] + next[2]) / 2));
    });
});
