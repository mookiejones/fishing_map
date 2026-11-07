import { describe, it, expect } from 'vitest';
import meteorologicalToVector from '../../src/wind/meteorologicalToVector';

describe('meteorologicalToVector', () => {
    it('turns a north wind into a southward vector', () => {
        const { u, v } = meteorologicalToVector(10, 0);
        expect(u).toBeCloseTo(0, 6);
        expect(v).toBeCloseTo(-10, 6);
    });

    it('turns an east wind into a westward vector', () => {
        const { u, v } = meteorologicalToVector(10, 90);
        expect(u).toBeCloseTo(-10, 6);
        expect(v).toBeCloseTo(0, 6);
    });

    it('turns a south wind into a northward vector', () => {
        const { u, v } = meteorologicalToVector(8, 180);
        expect(u).toBeCloseTo(0, 6);
        expect(v).toBeCloseTo(8, 6);
    });

    it('turns a west wind into an eastward vector', () => {
        const { u, v } = meteorologicalToVector(6, 270);
        expect(u).toBeCloseTo(6, 6);
        expect(v).toBeCloseTo(0, 6);
    });
});
