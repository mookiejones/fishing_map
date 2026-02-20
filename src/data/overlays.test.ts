import { describe, it, expect } from 'vitest';
import { OYSTER_BEDS, SEAGRASS_BEDS } from './overlays';
import type { OverlayPolygon } from './overlays';

// Brevard County rough bounding box (same as spots.test.ts)
const BREVARD_LAT = { min: 27.8, max: 28.97 };
const BREVARD_LNG = { min: -81.0, max: -80.4 };

function validateOverlayArray(overlays: OverlayPolygon[], label: string) {
    describe(label, () => {
        it('is non-empty', () => {
            expect(overlays.length).toBeGreaterThan(0);
        });

        it('all IDs are unique', () => {
            const ids = overlays.map(o => o.id);
            expect(new Set(ids).size).toBe(ids.length);
        });

        it('all names are unique', () => {
            const names = overlays.map(o => o.name);
            expect(new Set(names).size).toBe(names.length);
        });

        overlays.forEach(overlay => {
            describe(`"${overlay.name}"`, () => {
                it('has a non-empty id and name', () => {
                    expect(overlay.id.trim()).toBeTruthy();
                    expect(overlay.name.trim()).toBeTruthy();
                });

                it('has at least 3 coordinates (minimum for a polygon)', () => {
                    expect(overlay.coordinates.length).toBeGreaterThanOrEqual(3);
                });

                it('all coordinates are within Brevard County bounds', () => {
                    overlay.coordinates.forEach(({ lat, lng }) => {
                        expect(lat).toBeGreaterThanOrEqual(BREVARD_LAT.min);
                        expect(lat).toBeLessThanOrEqual(BREVARD_LAT.max);
                        expect(lng).toBeGreaterThanOrEqual(BREVARD_LNG.min);
                        expect(lng).toBeLessThanOrEqual(BREVARD_LNG.max);
                    });
                });

                it('coordinates are valid numbers (not NaN or Infinity)', () => {
                    overlay.coordinates.forEach(({ lat, lng }) => {
                        expect(Number.isFinite(lat)).toBe(true);
                        expect(Number.isFinite(lng)).toBe(true);
                    });
                });
            });
        });
    });
}

validateOverlayArray(OYSTER_BEDS,   'OYSTER_BEDS');
validateOverlayArray(SEAGRASS_BEDS, 'SEAGRASS_BEDS');

describe('combined overlay data', () => {
    it('OYSTER_BEDS and SEAGRASS_BEDS have no overlapping IDs', () => {
        const oysterIds   = new Set(OYSTER_BEDS.map(o => o.id));
        const seagrassIds = SEAGRASS_BEDS.map(o => o.id);
        seagrassIds.forEach(id => expect(oysterIds.has(id)).toBe(false));
    });
});
