import type { Species } from '../types';

/**
 * Nudge per-species markers just far enough to tell them apart when zoomed
 * in. 0.0011° is about 120 m, so the pin stays on the same flat.
 */
export const SPECIES_OFFSET: Record<Species, { lat: number; lng: number }> = {
    tarpon:           { lat:  0.0008, lng:  0.0000 },
    snook:            { lat: -0.0004, lng:  0.0007 },
    redfish:          { lat: -0.0004, lng: -0.0007 },
    'black drum':     { lat:  0.0005, lng:  0.0011 },
    'speckled trout': { lat:  0.0005, lng: -0.0011 },
};

export function maxSpeciesOffsetDegrees(): number {
    return Math.max(...Object.values(SPECIES_OFFSET).map(offset => Math.hypot(offset.lat, offset.lng)));
}
