// ============================================================
// structuralBarriers.ts — Man-made structures + underwater features
// ============================================================
// Causeways, bridges, canals, and jetties create current seams,
// shade, ambush points, and barriers to fish movement.
// Offshore reefs, wrecks, and ledges concentrate baitfish and
// predators in deeper water outside the lagoon system.
// ============================================================

/** Type of structural barrier — drives polyline stroke color. */
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

/** Type of underwater point feature — drives marker icon color. */
export type UnderwaterType = 'reef' | 'wreck' | 'ledge';

/** An offshore or nearshore underwater feature rendered as a map marker. */
export interface UnderwaterStructure {
    /** Unique kebab-case identifier. */
    id:    string;
    /** Display name shown in the marker title. */
    name:  string;
    /** Feature category (drives icon color). */
    type:  UnderwaterType;
    /** WGS-84 latitude. */
    lat:   number;
    /** WGS-84 longitude. */
    lng:   number;
    /** Approximate depth in feet. */
    depth: number;
}

/** Polyline stroke color per barrier type. */
export const BARRIER_COLOR: Record<BarrierType, string> = {
    causeway: '#FFB300',  // amber
    canal:    '#00BCD4',  // cyan
    jetty:    '#9E9E9E',  // grey
    bridge:   '#FF7043',  // deep orange
};

/** Marker background color per underwater feature type. */
export const UNDERWATER_COLOR: Record<UnderwaterType, string> = {
    reef:  '#2E7D32',  // dark green
    wreck: '#5D4037',  // dark brown
    ledge: '#546E7A',  // blue-grey
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

/**
 * Offshore and nearshore underwater features off Brevard County.
 * Artificial reefs, historic wrecks, and natural ledges concentrate
 * baitfish and predators — prime destinations for nearshore and
 * offshore fishing trips launching from Port Canaveral or Sebastian Inlet.
 *
 * Coordinates and depths are approximate.
 */
export const UNDERWATER_STRUCTURES: UnderwaterStructure[] = [
    // ── Artificial reefs ──────────────────────────────────────
    {
        id:    'port-canaveral-reef-braa001',
        name:  'Port Canaveral Reef (BRAA-001)',
        type:  'reef',
        lat:   28.3850,
        lng:   -80.5350,
        depth: 35,
    },
    {
        id:    'cape-canaveral-inner-reef',
        name:  'Cape Canaveral Inner Reef',
        type:  'reef',
        lat:   28.4450,
        lng:   -80.4850,
        depth: 25,
    },
    {
        id:    'cocoa-beach-reef',
        name:  'Cocoa Beach Reef Complex',
        type:  'reef',
        lat:   28.3200,
        lng:   -80.5050,
        depth: 30,
    },
    {
        id:    'melbourne-reef-north',
        name:  'Melbourne Reef North',
        type:  'reef',
        lat:   28.1650,
        lng:   -80.5250,
        depth: 40,
    },
    {
        id:    'melbourne-reef-south',
        name:  'Melbourne Reef South',
        type:  'reef',
        lat:   28.0750,
        lng:   -80.5150,
        depth: 35,
    },
    {
        id:    'sebastian-nearshore-reef',
        name:  'Sebastian Nearshore Reef',
        type:  'reef',
        lat:   27.8800,
        lng:   -80.4400,
        depth: 20,
    },
    {
        id:    'usaf-barge-reef',
        name:  'USAF Barge Artificial Reef',
        type:  'reef',
        lat:   28.3950,
        lng:   -80.4800,
        depth: 50,
    },

    // ── Wrecks ────────────────────────────────────────────────
    {
        id:    'mv-canaveral-wreck',
        name:  'M/V Canaveral (Artificial Reef)',
        type:  'wreck',
        lat:   28.2800,
        lng:   -80.5250,
        depth: 65,
    },
    {
        id:    'anna-s-kirk-wreck',
        name:  'Anna S. Kirk Wreck',
        type:  'wreck',
        lat:   28.1500,
        lng:   -80.4550,
        depth: 55,
    },
    {
        id:    'hobart-baker-wreck',
        name:  'Hobart Baker Wreck Site',
        type:  'wreck',
        lat:   28.0400,
        lng:   -80.5000,
        depth: 45,
    },
    {
        id:    'uss-target-wreck',
        name:  'USS Target Ship Reef',
        type:  'wreck',
        lat:   28.5100,
        lng:   -80.4600,
        depth: 60,
    },

    // ── Natural ledges ────────────────────────────────────────
    {
        id:    'canaveral-inner-ledge',
        name:  'Cape Canaveral Inner Ledge',
        type:  'ledge',
        lat:   28.4200,
        lng:   -80.4200,
        depth: 45,
    },
    {
        id:    'canaveral-outer-ledge',
        name:  'Cape Canaveral Outer Ledge',
        type:  'ledge',
        lat:   28.4000,
        lng:   -80.3400,
        depth: 85,
    },
    {
        id:    'melbourne-ledge',
        name:  'Melbourne Ledge',
        type:  'ledge',
        lat:   28.1000,
        lng:   -80.4000,
        depth: 60,
    },
    {
        id:    'sebastian-ledge',
        name:  'Sebastian Ledge',
        type:  'ledge',
        lat:   27.8600,
        lng:   -80.3600,
        depth: 75,
    },
];
