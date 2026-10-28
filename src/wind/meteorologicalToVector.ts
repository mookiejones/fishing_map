/**
 * Converts a meteorological wind (direction it blows FROM, degrees) into
 * an eastward `u` and northward `v` component, in the same speed units.
 *
 * 0° is a north wind (blowing south): u = 0, v = -speed.
 */
export default function meteorologicalToVector(
    speed: number,
    dirFromDeg: number,
): { u: number; v: number } {
    const rad = (dirFromDeg * Math.PI) / 180;
    return {
        u: -Math.sin(rad) * speed,
        v: -Math.cos(rad) * speed,
    };
}
