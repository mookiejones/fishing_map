import { describe, it, expect } from 'vitest';
import projectToCanvas from '../../src/wind/projectToCanvas';
import type { MapView } from '../../src/wind/types';

const view: MapView = {
    north: 29, south: 28, east: -80, west: -81, width: 200, height: 100,
};

describe('projectToCanvas', () => {
    it('pins the northwest and southeast corners to the canvas edges', () => {
        expect(projectToCanvas(29, -81, view)).toEqual({ x: 0, y: 0 });
        const se = projectToCanvas(28, -80, view);
        expect(se.x).toBeCloseTo(200);
        expect(se.y).toBeCloseTo(100);
    });

    it('places a northern point above a southern point', () => {
        const north = projectToCanvas(28.8, -80.5, view);
        const south = projectToCanvas(28.2, -80.5, view);
        expect(north.y).toBeLessThan(south.y);
        expect(north.x).toBeCloseTo(100);
    });
});
