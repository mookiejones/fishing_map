import formatZonedIso from './formatZonedIso';
import meteorologicalToVector from './meteorologicalToVector';
import { WIND_FORECAST_HOURS, WIND_GRID, WIND_TIME_ZONE } from './windGrid';
import type { WindField } from './types';

/**
 * A spatially uniform field used when the grid request fails.
 * The slider still moves through the next two days, driven by the
 * single speed and direction already shown in the sidebar.
 */
export default function uniformWindField(
    speedMph: number,
    dirFromDeg: number,
    hours: number = WIND_FORECAST_HOURS,
    now: Date = new Date(),
    timeZone: string = WIND_TIME_ZONE,
): WindField {
    const { u, v } = meteorologicalToVector(speedMph, dirFromDeg);
    const { south, west, latStep, lngStep, nLat, nLng } = WIND_GRID;
    const cells = nLat * nLng;
    const start = floorToHour(now, timeZone);
    const times: string[] = [];
    for (let h = 0; h < hours; h++) {
        times.push(formatZonedIso(new Date(start.getTime() + h * 3_600_000), timeZone));
    }
    return {
        south,
        west,
        north: south + (nLat - 1) * latStep,
        east:  west + (nLng - 1) * lngStep,
        latStep,
        lngStep,
        nLat,
        nLng,
        times,
        u: new Float32Array(hours * cells).fill(u),
        v: new Float32Array(hours * cells).fill(v),
    };
}

function floorToHour(date: Date, timeZone: string): Date {
    const iso = formatZonedIso(date, timeZone);
    const minute = Number(iso.slice(14, 16));
    return new Date(date.getTime() - minute * 60_000 - date.getSeconds() * 1000 - date.getMilliseconds());
}
