/** One stop on the wind-speed color ramp, in miles per hour. */
export interface WindColorStop {
    mph: number;
    rgb: readonly [number, number, number];
}

/**
 * Windy-style ramp: cool blues for a light breeze, greens through the
 * sight-fishing range, then gold, orange, and magenta for a gale.
 * Speeds are mph, matching the rest of the app.
 */
const WIND_COLOR_STOPS: readonly WindColorStop[] = [
    { mph: 0,  rgb: [94, 126, 176] },
    { mph: 4,  rgb: [68, 150, 178] },
    { mph: 8,  rgb: [62, 168, 150] },
    { mph: 12, rgb: [88, 178, 96] },
    { mph: 16, rgb: [170, 188, 62] },
    { mph: 20, rgb: [216, 178, 50] },
    { mph: 26, rgb: [216, 126, 44] },
    { mph: 34, rgb: [198, 70, 48] },
    { mph: 44, rgb: [170, 46, 98] },
    { mph: 56, rgb: [126, 40, 142] },
];

export default WIND_COLOR_STOPS;
