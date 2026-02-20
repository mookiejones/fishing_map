import { describe, it, expect } from 'vitest';
import { FISHING_SPOTS } from '../src/spots';

const BREVARD_LAT    = { min: 27.8, max: 28.97 };
const BREVARD_LNG    = { min: -81.0, max: -80.4 };
const VALID_SPECIES  = ['tarpon', 'snook', 'redfish', 'black drum', 'speckled trout'] as const;
const VALID_TIDE_PREFS = ['incoming', 'outgoing'] as const;

describe('FISHING_SPOTS', () => {
    it('contains at least 10 spots', () => {
        expect(FISHING_SPOTS.length).toBeGreaterThanOrEqual(10);
    });

    it('all spot IDs are unique', () => {
        const ids = FISHING_SPOTS.map(s => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('all spot names are unique', () => {
        const names = FISHING_SPOTS.map(s => s.name);
        expect(new Set(names).size).toBe(names.length);
    });

    FISHING_SPOTS.forEach(spot => {
        describe(`"${spot.name}"`, () => {
            it('has a non-empty id, name, and description', () => {
                expect(spot.id.trim()).toBeTruthy();
                expect(spot.name.trim()).toBeTruthy();
                expect(spot.description.trim()).toBeTruthy();
            });

            it('coordinates are within Brevard County bounds', () => {
                expect(spot.lat).toBeGreaterThanOrEqual(BREVARD_LAT.min);
                expect(spot.lat).toBeLessThanOrEqual(BREVARD_LAT.max);
                expect(spot.lng).toBeGreaterThanOrEqual(BREVARD_LNG.min);
                expect(spot.lng).toBeLessThanOrEqual(BREVARD_LNG.max);
            });

            it('has at least one valid species', () => {
                expect(spot.species.length).toBeGreaterThan(0);
                spot.species.forEach(s => expect(VALID_SPECIES).toContain(s));
            });

            it('has no duplicate species', () => {
                expect(new Set(spot.species).size).toBe(spot.species.length);
            });

            it('has a valid tidePreference', () => {
                expect(VALID_TIDE_PREFS).toContain(spot.tidePreference);
            });

            it('has at least one fishing tip', () => {
                expect(spot.tips.length).toBeGreaterThan(0);
                spot.tips.forEach(tip => expect(tip.trim().length).toBeGreaterThan(0));
            });

            it('has at least one habitat feature', () => {
                expect(spot.features.length).toBeGreaterThan(0);
            });
        });
    });
});
