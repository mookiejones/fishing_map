import type { WindGridSpec } from './types';

/**
 * Lattice covering the default Cocoa Beach view: Indian River Lagoon,
 * Banana River, the barrier island, and a margin of ocean and mainland
 * so the default zoom doesn't end in a hard color edge.
 *
 * 0.06° is about 6.7 km — close to the HRRR cells Open-Meteo serves for
 * North America — and keeps a single forecast request under ~1 MB.
 */
export const WIND_GRID: WindGridSpec = {
    south:   27.75,
    west:    -81.6,
    latStep: 0.06,
    lngStep: 0.06,
    nLat:    22,
    nLng:    30,
};

/** Hours of hourly forecast requested for the time slider. */
export const WIND_FORECAST_HOURS = 48;

/** Forecast timestamps are labeled in the lagoon's local time. */
export const WIND_TIME_ZONE = 'America/New_York';

/** Sample point for the legend readout, over Cocoa Beach / the Banana River. */
export const COCOA_BEACH = { lat: 28.32, lng: -80.61 } as const;
