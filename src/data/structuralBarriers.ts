// ============================================================
// structuralBarriers.ts — Man-made structures in the IRL system
// ============================================================
// Causeways, bridges, canals, and jetties create current seams,
// shade, ambush points, and barriers to fish movement.
// Coordinates are approximate center-lines of each structure.
// ============================================================

/** Type of structural barrier — drives stroke color on the map. */
export type BarrierType = 'causeway' | 'canal' | 'jetty' | 'bridge';

/** A single man-made structural barrier rendered as a map polyline. */
export interface StructuralBarrier {
    /** Unique kebab-case identifier. */
    id:   string;
    /** Display name shown in the marker title. */
    name: string;
    /** Structural category (drives rendering color). */
    type: BarrierType;
    /** Ordered lat/lng vertices defining the polyline. */
    path: { lat: number; lng: number }[];
}

/** Stroke color per barrier type. */
export const BARRIER_COLOR: Record<BarrierType, string> = {
    causeway: '#FFB300',  // amber
    canal:    '#00BCD4',  // cyan
    jetty:    '#9E9E9E',  // grey
    bridge:   '#FF7043',  // deep orange
};

/**
 * Structural barriers across Brevard County's Indian River Lagoon system.
 * Each barrier creates hydraulic features — current breaks, shade, bait
 * concentration — that attract and hold inshore species.
 */
export const STRUCTURAL_BARRIERS: StructuralBarrier[] = [
    {
        id:   'haulover-canal',
        name: 'Haulover Canal',
        type: 'canal',
        path: [
            { lat: 28.6455, lng: -80.8010 },
            { lat: 28.6415, lng: -80.7870 },
            { lat: 28.6394, lng: -80.7853 },
        ],
    },
    {
        id:   'nasa-causeway',
        name: 'NASA Causeway (SR-405)',
        type: 'causeway',
        path: [
            { lat: 28.6004, lng: -80.7640 },
            { lat: 28.6004, lng: -80.7078 },
        ],
    },
    {
        id:   'bennett-causeway',
        name: 'Bennett Causeway (SR-528)',
        type: 'causeway',
        path: [
            { lat: 28.3870, lng: -80.7480 },
            { lat: 28.3870, lng: -80.6380 },
        ],
    },
    {
        id:   'pineda-causeway',
        name: 'Pineda Causeway (SR-404)',
        type: 'causeway',
        path: [
            { lat: 28.2600, lng: -80.7380 },
            { lat: 28.2600, lng: -80.6250 },
        ],
    },
    {
        id:   'melbourne-causeway',
        name: 'Melbourne Causeway (US-192)',
        type: 'bridge',
        path: [
            { lat: 28.0850, lng: -80.6680 },
            { lat: 28.0850, lng: -80.6070 },
        ],
    },
    {
        id:   'mathers-bridge',
        name: "Mather's Bridge (old US-192)",
        type: 'bridge',
        path: [
            { lat: 28.0920, lng: -80.6310 },
            { lat: 28.0920, lng: -80.5790 },
        ],
    },
    {
        id:   'port-canaveral-north-jetty',
        name: 'Port Canaveral North Jetty',
        type: 'jetty',
        path: [
            { lat: 28.4150, lng: -80.5967 },
            { lat: 28.4220, lng: -80.5880 },
            { lat: 28.4270, lng: -80.5800 },
        ],
    },
    {
        id:   'port-canaveral-south-jetty',
        name: 'Port Canaveral South Jetty',
        type: 'jetty',
        path: [
            { lat: 28.4089, lng: -80.5967 },
            { lat: 28.4020, lng: -80.5880 },
            { lat: 28.3970, lng: -80.5800 },
        ],
    },
    {
        id:   'sebastian-inlet-jetties',
        name: 'Sebastian Inlet Jetties',
        type: 'jetty',
        path: [
            { lat: 27.8740, lng: -80.4494 },
            { lat: 27.8669, lng: -80.4430 },
            { lat: 27.8590, lng: -80.4494 },
        ],
    },
    {
        id:   'titusville-causeway',
        name: 'Titusville Causeway (SR-406)',
        type: 'causeway',
        path: [
            { lat: 28.5870, lng: -80.8020 },
            { lat: 28.5870, lng: -80.7200 },
        ],
    },
];
