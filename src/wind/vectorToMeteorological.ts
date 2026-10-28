/**
 * Direction the wind blows FROM, in degrees, recovered from eastward `u`
 * and northward `v`. Returns 0 when the vector is calm.
 */
export default function vectorToMeteorological(u: number, v: number): number {
    if (u === 0 && v === 0) return 0;
    return (Math.atan2(u, v) * 180 / Math.PI + 180 + 360) % 360;
}
