import mercatorY from './mercatorY';

/**
 * Latitude that sits `t` of the way from `north` (t = 0) to `south` (t = 1)
 * in Web Mercator, matching how the map stretches a latitude band vertically.
 */
export default function latFromMercator(north: number, south: number, t: number): number {
    const y = mercatorY(north) + (mercatorY(south) - mercatorY(north)) * t;
    const sine = Math.tanh(y);
    return (Math.asin(Math.min(1, Math.max(-1, sine))) * 180) / Math.PI;
}
