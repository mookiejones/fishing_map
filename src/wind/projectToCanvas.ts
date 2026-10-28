import mercatorY from './mercatorY';
import type { MapView } from './types';

/**
 * Projects a coordinate into the current map view, in CSS pixels.
 * The map is north-up Web Mercator (this app doesn't enable tilt or heading).
 */
export default function projectToCanvas(
    lat: number,
    lng: number,
    view: MapView,
): { x: number; y: number } {
    const spanX = view.east - view.west;
    const yNorth = mercatorY(view.north);
    const ySouth = mercatorY(view.south);
    const spanY = ySouth - yNorth;
    if (spanX === 0 || spanY === 0) return { x: 0, y: 0 };
    const x = ((lng - view.west) / spanX) * view.width;
    const y = ((mercatorY(lat) - yNorth) / spanY) * view.height;
    // Collapse signed zero so the northwest corner is exactly (0, 0).
    return { x: x === 0 ? 0 : x, y: y === 0 ? 0 : y };
}
