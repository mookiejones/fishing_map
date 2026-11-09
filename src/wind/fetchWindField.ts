import parseWindResponse from './parseWindResponse';
import windGridPoints from './windGridPoints';
import { WIND_FORECAST_HOURS, WIND_TIME_ZONE } from './windGrid';
import type { WindField } from './types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetches an hourly wind grid for the Cocoa Beach lattice.
 * Uses POST because the point list is larger than a GET URL allows.
 * Open-Meteo's best-match model is NOAA HRRR over Florida, filled by GFS.
 *
 * @throws If the network or payload is unusable. Callers supply a uniform fallback.
 */
export default async function fetchWindField(signal?: AbortSignal): Promise<WindField> {
    const points = windGridPoints();
    const body = new URLSearchParams({
        latitude:         points.map(p => String(p.lat)).join(','),
        longitude:        points.map(p => String(p.lng)).join(','),
        hourly:           'wind_speed_10m,wind_direction_10m',
        wind_speed_unit:  'mph',
        timezone:         WIND_TIME_ZONE,
        forecast_hours:   String(WIND_FORECAST_HOURS),
        timeformat:       'unixtime',
    });

    const res = await fetch(FORECAST_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal,
    });
    if (!res.ok) throw new Error(`Wind API returned ${res.status}`);
    return parseWindResponse(await res.json(), points);
}
