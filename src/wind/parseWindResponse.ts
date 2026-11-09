import meteorologicalToVector from './meteorologicalToVector';
import windCellIndex from './windCellIndex';
import { WIND_GRID } from './windGrid';
import type { WindField, WindGridSpec } from './types';

interface HourlyWind {
    time:                 (string | number)[];
    wind_speed_10m:       (number | null)[];
    wind_direction_10m:   (number | null)[];
}

interface WindLocation {
    utc_offset_seconds?: number;
    hourly:              HourlyWind;
}

/**
 * Builds a `WindField` from an Open-Meteo forecast payload.
 * Accepts the single-object response and the array form used for multiple locations.
 * `points` must be in `windGridPoints()` order.
 *
 * @throws If the payload is not a forecast, or it doesn't cover every grid point.
 */
export default function parseWindResponse(
    json: unknown,
    points: readonly { lat: number; lng: number }[],
    grid: WindGridSpec = WIND_GRID,
): WindField {
    const locations = asLocations(json);
    if (locations.length !== points.length) {
        throw new Error(`Wind response has ${locations.length} locations, expected ${points.length}`);
    }

    const first = locations[0];
    if (!first) throw new Error('Wind response was empty');
    const hourCount = first.hourly.time.length;
    if (hourCount === 0) throw new Error('Wind response has no hours');

    const offset = first.utc_offset_seconds ?? 0;
    const times = first.hourly.time.map(t => toLocalIso(t, offset));
    const { nLat, nLng, south, west, latStep, lngStep } = grid;
    if (nLat * nLng !== points.length) {
        throw new Error('Grid point count does not match the wind lattice');
    }

    const u = new Float32Array(hourCount * points.length);
    const v = new Float32Array(hourCount * points.length);

    for (let p = 0; p < locations.length; p++) {
        const loc = locations[p]!;
        const speeds = loc.hourly.wind_speed_10m;
        const dirs = loc.hourly.wind_direction_10m;
        if (speeds.length !== hourCount || dirs.length !== hourCount || loc.hourly.time.length !== hourCount) {
            throw new Error('Wind locations disagree on forecast length');
        }
        const iy = Math.floor(p / nLng);
        const ix = p % nLng;
        for (let h = 0; h < hourCount; h++) {
            const speed = speeds[h];
            const dir = dirs[h];
            const vector = meteorologicalToVector(
                typeof speed === 'number' ? speed : 0,
                typeof dir === 'number' ? dir : 0,
            );
            const i = windCellIndex(nLat, nLng, h, iy, ix);
            u[i] = vector.u;
            v[i] = vector.v;
        }
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
        u,
        v,
    };
}

function asLocations(json: unknown): WindLocation[] {
    if (Array.isArray(json)) return json.map(asLocation);
    if (isRecord(json) && 'hourly' in json) return [asLocation(json)];
    if (isRecord(json) && json.error === true) {
        const reason = typeof json.reason === 'string' ? json.reason : 'Wind request failed';
        throw new Error(reason);
    }
    throw new Error('Unexpected wind response');
}

function asLocation(value: unknown): WindLocation {
    if (!isRecord(value) || !isRecord(value.hourly)) {
        throw new Error('Wind location is missing hourly data');
    }
    const hourly = value.hourly;
    if (!Array.isArray(hourly.time) || !Array.isArray(hourly.wind_speed_10m) || !Array.isArray(hourly.wind_direction_10m)) {
        throw new Error('Wind location is missing speed or direction');
    }
    const offset = value.utc_offset_seconds;
    return {
        utc_offset_seconds: typeof offset === 'number' ? offset : undefined,
        hourly: {
            time: hourly.time as (string | number)[],
            wind_speed_10m: hourly.wind_speed_10m as (number | null)[],
            wind_direction_10m: hourly.wind_direction_10m as (number | null)[],
        },
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/** Open-Meteo ISO strings are already local. Unixtime is shifted by the response offset. */
function toLocalIso(time: string | number, utcOffsetSeconds: number): string {
    if (typeof time === 'string') return time.slice(0, 16);
    return new Date((time + utcOffsetSeconds) * 1000).toISOString().slice(0, 16);
}
