// ============================================================
// boatRamps.ts — Public boat ramp locations in Brevard County, FL
//   Coordinates are best-effort approximations.
// ============================================================

/** A public boat ramp point feature displayed as a map marker. */
export interface BoatRamp {
    /** Unique kebab-case identifier. */
    id:   string;
    /** Human-readable display name shown in the marker tooltip. */
    name: string;
    lat:  number;
    lng:  number;
}

/**
 * Public boat ramp locations across Brevard County, FL (Indian River Lagoon system).
 * Rendered on the map as teal markers when the "Boat Ramps" overlay is toggled on.
 */
export const BOAT_RAMPS: BoatRamp[] = [
    { id: 'ramp-rotary-park',     name: 'Rotary Park Ramp — Titusville',      lat: 28.6178, lng: -80.8072 },
    { id: 'ramp-haulover-canal',  name: 'Haulover Canal Ramp',                lat: 28.7187, lng: -80.8427 },
    { id: 'ramp-scottsmoor',      name: 'Scottsmoor Landing Ramp',            lat: 28.7420, lng: -80.8488 },
    { id: 'ramp-port-st-john',    name: 'Port St. John Boat Ramp',            lat: 28.4892, lng: -80.7926 },
    { id: 'ramp-sykes-creek',     name: 'Sykes Creek Ramp — Merritt Island',  lat: 28.3628, lng: -80.6881 },
    { id: 'ramp-ramp-road-cocoa', name: 'Ramp Road Park — Cocoa',             lat: 28.3578, lng: -80.7232 },
    { id: 'ramp-ballard-park',    name: 'Ballard Park Ramp — Rockledge',      lat: 28.3295, lng: -80.7215 },
    { id: 'ramp-dragon-point',    name: 'Dragon Point Ramp — S. Merritt Is.', lat: 28.3218, lng: -80.6752 },
    { id: 'ramp-veterans-mel',    name: 'Veterans Memorial Park — Melbourne', lat: 28.0738, lng: -80.6179 },
    { id: 'ramp-sebastian-inlet', name: 'Sebastian Inlet State Park Ramp',    lat: 27.8594, lng: -80.4535 },
    { id: 'ramp-peacock-pocket',  name: 'Peacock Pocket Ramp — Rockledge',    lat: 28.3413, lng: -80.7202 },
    { id: 'ramp-sand-point',      name: 'Sand Point Park Ramp — Titusville',  lat: 28.5908, lng: -80.8108 },
];
