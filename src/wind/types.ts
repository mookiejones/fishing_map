/** Regular latitude/longitude lattice the wind field is sampled on. */
export interface WindGridSpec {
    south:   number;
    west:    number;
    latStep: number;
    lngStep: number;
    nLat:    number;
    nLng:    number;
}

/**
 * Hourly wind on a regular grid.
 * `u` is the eastward component and `v` the northward component, both in mph.
 * Values are row-major: time, then latitude south→north, then longitude west→east.
 */
export interface WindField {
    south:   number;
    west:    number;
    north:   number;
    east:    number;
    latStep: number;
    lngStep: number;
    nLat:    number;
    nLng:    number;
    /** Local clock times, `YYYY-MM-DDTHH:MM`, America/New_York. */
    times:   readonly string[];
    u:       Float32Array;
    v:       Float32Array;
}

/** One animated streak. Positions are geographic so the trail survives pan and zoom. */
export interface WindParticle {
    lat:        number;
    lng:        number;
    age:        number;
    maxAge:     number;
    /** Per-particle speed jitter so streaks don't march in lockstep. */
    speedScale: number;
    trail:      { lat: number; lng: number }[];
}

/** Pixel rectangle of the current map view. Width and height are CSS pixels. */
export interface MapView {
    north:  number;
    south:  number;
    east:   number;
    west:   number;
    width:  number;
    height: number;
}
