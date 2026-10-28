import windCellIndex from './windCellIndex';
import type { WindField } from './types';

export interface WindSample {
    u:     number;
    v:     number;
    speed: number;
}

/**
 * Bilinear sample of the wind vector at one hour.
 * Returns null outside the lattice so particles can be recycled at the edge.
 */
export default function sampleWind(
    field: WindField,
    timeIndex: number,
    lat: number,
    lng: number,
): WindSample | null {
    const fyRaw = (lat - field.south) / field.latStep;
    const fxRaw = (lng - field.west) / field.lngStep;
    // A few ulps of slack so the north and east edges, which aren't exact in
    // binary floating point, still belong to the lattice.
    if (fyRaw < -1e-6 || fxRaw < -1e-6 || fyRaw > field.nLat - 1 + 1e-6 || fxRaw > field.nLng - 1 + 1e-6) {
        return null;
    }
    const fy = Math.min(field.nLat - 1, Math.max(0, fyRaw));
    const fx = Math.min(field.nLng - 1, Math.max(0, fxRaw));

    const y0 = Math.floor(fy);
    const x0 = Math.floor(fx);
    const y1 = Math.min(y0 + 1, field.nLat - 1);
    const x1 = Math.min(x0 + 1, field.nLng - 1);
    const ty = fy - y0;
    const tx = fx - x0;
    const t = Math.max(0, Math.min(field.times.length - 1, timeIndex | 0));

    const at = (iy: number, ix: number) => {
        const i = windCellIndex(field.nLat, field.nLng, t, iy, ix);
        return { u: field.u[i] ?? 0, v: field.v[i] ?? 0 };
    };
    const a = at(y0, x0);
    const b = at(y0, x1);
    const c = at(y1, x0);
    const d = at(y1, x1);
    const u = lerp(lerp(a.u, b.u, tx), lerp(c.u, d.u, tx), ty);
    const v = lerp(lerp(a.v, b.v, tx), lerp(c.v, d.v, tx), ty);
    return { u, v, speed: Math.hypot(u, v) };
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
