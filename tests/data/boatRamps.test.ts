import { describe, it, expect } from 'vitest';
import { BOAT_RAMPS } from '../../src/data/boatRamps';

describe('BOAT_RAMPS', () => {
    it('puts Bairs Cove on Haulover Canal', () => {
        const ramp = BOAT_RAMPS.find(item => item.id === 'ramp-haulover-canal')!;
        expect(ramp.name).toContain('Bairs Cove');
        expect(ramp.lat).toBeCloseTo(28.73294, 4);
        expect(ramp.lng).toBeCloseTo(-80.75699, 4);
    });

    it('uses the public launch beside Dragon Point', () => {
        // FWC has no ramp on the residential point. Oars & Paddles Park
        // is the public launch about half a mile north of the cape.
        const ramp = BOAT_RAMPS.find(item => item.id === 'ramp-oars-paddles')!;
        expect(ramp.lat).toBeCloseTo(28.14988, 4);
        expect(ramp.lng).toBeCloseTo(-80.60121, 4);
    });
});
