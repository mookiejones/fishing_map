import { WIND_GRID } from './windGrid';
import type { WindGridSpec } from './types';

/**
 * Returns every lattice point, south to north and west to east.
 * Request order must match `windCellIndex` so parsed values land on the right cell.
 */
export default function windGridPoints(grid: WindGridSpec = WIND_GRID): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];
    for (let iy = 0; iy < grid.nLat; iy++) {
        const lat = round4(grid.south + iy * grid.latStep);
        for (let ix = 0; ix < grid.nLng; ix++) {
            points.push({ lat, lng: round4(grid.west + ix * grid.lngStep) });
        }
    }
    return points;
}

function round4(n: number): number {
    return Math.round(n * 10000) / 10000;
}
