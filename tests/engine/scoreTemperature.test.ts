import { describe, it, expect } from 'vitest';
import { FishingEngine } from '../../src/engine';

describe('FishingEngine.scoreTemperature', () => {
    // Water temp = air temp − 3

    it('returns 20 at each species optimal temperature', () => {
        // Tarpon optimal = 82°F water → 85°F air
        expect(FishingEngine.scoreTemperature(85, 'tarpon')).toBe(20);
        // Snook optimal = 75°F water → 78°F air
        expect(FishingEngine.scoreTemperature(78, 'snook')).toBe(20);
        // Redfish optimal = 70°F water → 73°F air
        expect(FishingEngine.scoreTemperature(73, 'redfish')).toBe(20);
    });

    it('returns 0 when well below minimum range', () => {
        // Tarpon min = 70°F water (73°F air); 60°F air → water=57, overshoot=13 → max(0,8−13)=0
        expect(FishingEngine.scoreTemperature(60, 'tarpon')).toBe(0);
        // Redfish min = 48°F water (51°F air); 40°F air → water=37, overshoot=11 → max(0,8−11)=0
        expect(FishingEngine.scoreTemperature(40, 'redfish')).toBe(0);
    });

    it('returns 0 when well above maximum range', () => {
        // Snook max = 90°F water (93°F air); 105°F air → water=102, overshoot=12 → max(0,8−12)=0
        expect(FishingEngine.scoreTemperature(105, 'snook')).toBe(0);
        // Tarpon max = 94°F water (97°F air); 110°F air → water=107, overshoot=13 → 0
        expect(FishingEngine.scoreTemperature(110, 'tarpon')).toBe(0);
    });

    it('never returns a negative score', () => {
        expect(FishingEngine.scoreTemperature(20,  'tarpon')).toBeGreaterThanOrEqual(0);
        expect(FishingEngine.scoreTemperature(120, 'snook')).toBeGreaterThanOrEqual(0);
    });

    it('scores decrease as temperature moves from optimal', () => {
        const atOptimal   = FishingEngine.scoreTemperature(78, 'snook');
        const slightlyOff = FishingEngine.scoreTemperature(82, 'snook');
        const farOff      = FishingEngine.scoreTemperature(90, 'snook');
        expect(atOptimal).toBeGreaterThan(slightlyOff);
        expect(slightlyOff).toBeGreaterThan(farOff);
    });
});
