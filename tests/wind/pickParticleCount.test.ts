import { describe, it, expect } from 'vitest';
import pickParticleCount from '../../src/wind/pickParticleCount';

describe('pickParticleCount', () => {
    it('returns 0 for an empty viewport', () => {
        expect(pickParticleCount(0, 400, false)).toBe(0);
    });

    it('caps a large desktop map', () => {
        expect(pickParticleCount(1920, 1080, false)).toBe(460);
    });

    it('uses a lower cap for a coarse pointer', () => {
        expect(pickParticleCount(1920, 1080, true)).toBe(240);
        expect(pickParticleCount(400, 700, true)).toBeLessThan(pickParticleCount(400, 700, false));
    });
});
