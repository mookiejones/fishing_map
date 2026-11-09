import type { MapView } from './types';

const MILES_PER_DEG_LAT = 69;
/** Real wind at this speed should travel `REF_PIXELS_PER_SECOND` CSS pixels. */
const REF_SPEED_MPH = 10;
const REF_PIXELS_PER_SECOND = 40;

/**
 * Geographic time-lapse so particle screen speed tracks wind speed, not zoom.
 * A fixed hours-per-second value makes a 4 mph breeze look like a hurricane
 * once the map is zoomed into a spot.
 */
export default function visualHoursPerSecond(view: MapView): number {
    if (view.width <= 0 || view.height <= 0) return 0;
    const milesHigh = (view.north - view.south) * MILES_PER_DEG_LAT;
    if (!(milesHigh > 0)) return 0;
    const pxPerMile = view.height / milesHigh;
    return REF_PIXELS_PER_SECOND / (REF_SPEED_MPH * pxPerMile);
}
