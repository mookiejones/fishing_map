import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';

describe('FishingEngine.getRatingColor', () => {
    const hexColor = /^#[0-9a-f]{6}$/i;

    it('returns a hex color for each rating', () => {
        expect(FishingEngine.getRatingColor('excellent')).toMatch(hexColor);
        expect(FishingEngine.getRatingColor('good')).toMatch(hexColor);
        expect(FishingEngine.getRatingColor('fair')).toMatch(hexColor);
        expect(FishingEngine.getRatingColor('poor')).toMatch(hexColor);
    });

    it('excellent is green (#00c851), poor is red (#f44336)', () => {
        expect(FishingEngine.getRatingColor('excellent')).toBe('#00c851');
        expect(FishingEngine.getRatingColor('poor')).toBe('#f44336');
    });

    it('all four ratings return distinct colors', () => {
        const colors = (['excellent', 'good', 'fair', 'poor'] as const).map(r =>
            FishingEngine.getRatingColor(r),
        );
        expect(new Set(colors).size).toBe(4);
    });
});
