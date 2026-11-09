import { describe, it, expect } from 'vitest';
import stepParticle from '../../src/wind/stepParticle';
import type { WindParticle } from '../../src/wind/types';

function particle(): WindParticle {
    return {
        lat: 28.3, lng: -80.6, age: 0, maxAge: 100, speedScale: 1, trail: [],
    };
}

describe('stepParticle', () => {
    it('moves south in a north wind', () => {
        const p = particle();
        stepParticle(p, { u: 0, v: -10 }, 1);
        expect(p.lat).toBeLessThan(28.3);
        expect(p.lng).toBeCloseTo(-80.6, 6);
        expect(p.trail).toHaveLength(1);
        expect(p.age).toBe(1);
    });

    it('moves east in a west wind', () => {
        const p = particle();
        stepParticle(p, { u: 12, v: 0 }, 1);
        expect(p.lng).toBeGreaterThan(-80.6);
        expect(p.lat).toBeCloseTo(28.3, 6);
    });

    it('holds position when the sample is missing', () => {
        const p = particle();
        stepParticle(p, null, 1);
        expect(p.lat).toBeCloseTo(28.3);
        expect(p.lng).toBeCloseTo(-80.6);
    });

    it('drops trail points past the limit', () => {
        const p = particle();
        for (let i = 0; i < 40; i++) stepParticle(p, { u: 0, v: 0 }, 0);
        expect(p.trail.length).toBe(28);
    });
});
