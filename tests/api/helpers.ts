import type { OpenMeteoResponse } from '../../src/types';

/** Build a minimal OpenMeteoResponse for N days. */
export function makeWeatherResponse(
    days: {
        date: string;
        tempMax: number;
        tempMin: number;
        precipitation: number | null;
        windSpeed: number;
        windDir: number;
        code: number;
        /** Per-day pressure array; must have exactly 24 values. */
        pressures: (number | null)[];
    }[],
): OpenMeteoResponse {
    const hourlyPressures: (number | null)[] = [];
    for (const d of days) hourlyPressures.push(...d.pressures);

    return {
        daily: {
            time:                          days.map(d => d.date),
            temperature_2m_max:            days.map(d => d.tempMax),
            temperature_2m_min:            days.map(d => d.tempMin),
            precipitation_sum:             days.map(d => d.precipitation),
            wind_speed_10m_max:            days.map(d => d.windSpeed),
            wind_direction_10m_dominant:   days.map(d => d.windDir),
            weather_code:                  days.map(d => d.code),
        },
        hourly: { surface_pressure: hourlyPressures },
    };
}

/** Build a flat 24-element pressure array with a given morning (h6) and evening (h18) value. */
export function pressures(morning: number, evening: number, fill = 1013): (number | null)[] {
    const arr: (number | null)[] = new Array(24).fill(fill) as (number | null)[];
    arr[6]  = morning;
    arr[18] = evening;
    return arr;
}
