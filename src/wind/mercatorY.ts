/** Web-Mercator Y for a latitude. Larger values are farther north. */
export default function mercatorY(lat: number): number {
    const clamped = Math.min(89.9, Math.max(-89.9, lat));
    const s = Math.sin((clamped * Math.PI) / 180);
    return 0.5 * Math.log((1 + s) / (1 - s));
}
