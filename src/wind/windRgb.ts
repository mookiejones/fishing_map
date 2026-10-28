import WIND_COLOR_STOPS from './windColorStops';

/** RGB triple for a wind speed in mph. Speeds outside the ramp are clamped. */
export default function windRgb(mph: number): [number, number, number] {
    const stops = WIND_COLOR_STOPS;
    const first = stops[0]!;
    const last = stops[stops.length - 1]!;
    if (mph <= first.mph) return [...first.rgb];
    if (mph >= last.mph) return [...last.rgb];

    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i]!;
        const b = stops[i + 1]!;
        if (mph <= b.mph) {
            const t = (mph - a.mph) / (b.mph - a.mph);
            return [
                Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
                Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
                Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t),
            ];
        }
    }
    return [...last.rgb];
}
