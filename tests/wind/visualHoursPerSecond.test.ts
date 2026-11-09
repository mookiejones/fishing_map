import { describe, it, expect } from 'vitest';
import visualHoursPerSecond from '../../src/wind/visualHoursPerSecond';
import type { MapView } from '../../src/wind/types';

const MILES_PER_DEG_LAT = 69;

function view(spanDeg: number): MapView {
    const mid = 28.3;
    const half = spanDeg / 2;
    return {
        north: mid + half,
        south: mid - half,
        east: -80.4,
        west: -80.8,
        width: 800,
        height: 800,
    };
}

function pixelsPerSecond(spanDeg: number, mph: number): number {
    const hours = visualHoursPerSecond(view(spanDeg));
    const pxPerMile = 800 / (spanDeg * MILES_PER_DEG_LAT);
    return hours * mph * pxPerMile;
}

describe('visualHoursPerSecond', () => {
    it('returns 0 for an empty viewport', () => {
        expect(visualHoursPerSecond({
            north: 28.4, south: 28.2, east: -80.4, west: -80.8, width: 0, height: 800,
        })).toBe(0);
    });

    it('keeps 4 mph screen speed the same when the map is zoomed in', () => {
        expect(pixelsPerSecond(0.5, 4)).toBeCloseTo(pixelsPerSecond(0.05, 4), 5);
    });

    it('moves 4 mph at two-fifths the screen speed of 10 mph', () => {
        expect(pixelsPerSecond(0.05, 4)).toBeCloseTo(pixelsPerSecond(0.05, 10) * 0.4, 5);
    });

    it('uses less geographic time-lapse when the viewport is tighter', () => {
        expect(visualHoursPerSecond(view(0.05))).toBeCloseTo(
            visualHoursPerSecond(view(0.5)) / 10,
            8,
        );
    });
});
