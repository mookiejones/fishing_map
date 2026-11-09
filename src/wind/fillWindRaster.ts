import latFromMercator from './latFromMercator';
import sampleWind from './sampleWind';
import windRgb from './windRgb';
import type { WindField } from './types';

/**
 * Paints the wind-speed ramp into an RGBA buffer covering the field's bounds.
 * Rows are evenly spaced in Web Mercator so the buffer can be stretched onto
 * the map without latitude distortion. Alpha fades across the outer cells
 * so the color field doesn't end in a hard rectangle.
 */
export default function fillWindRaster(
    field: WindField,
    timeIndex: number,
    width: number,
    height: number,
    alpha: number,
    featherCells = 1.25,
): Uint8ClampedArray {
    const out = new Uint8ClampedArray(width * height * 4);
    if (width < 1 || height < 1) return out;

    for (let y = 0; y < height; y++) {
        const t = height === 1 ? 0 : y / (height - 1);
        const lat = clamp(latFromMercator(field.north, field.south, t), field.south, field.north);
        for (let x = 0; x < width; x++) {
            const rawLng = width === 1
                ? field.west
                : field.west + (field.east - field.west) * (x / (width - 1));
            const lng = clamp(rawLng, field.west, field.east);
            const sample = sampleWind(field, timeIndex, lat, lng);
            const i = (y * width + x) * 4;
            if (!sample) continue;
            const [r, g, b] = windRgb(sample.speed);
            const fy = (lat - field.south) / field.latStep;
            const fx = (lng - field.west) / field.lngStep;
            const edge = Math.min(fx, fy, field.nLng - 1 - fx, field.nLat - 1 - fy);
            const fade = Math.max(0, Math.min(1, edge / featherCells));
            out[i] = r;
            out[i + 1] = g;
            out[i + 2] = b;
            out[i + 3] = Math.round(alpha * fade);
        }
    }
    return out;
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}
