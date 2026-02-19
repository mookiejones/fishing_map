// ============================================================
// utils.ts — Shared helper functions
// ============================================================

import type { WeatherDay, DayConditions, TideEvent } from './types';

export function buildConditions(
    day: WeatherDay,
    tides: TideEvent[],
): DayConditions {
    return {
        windSpeed:     day.windSpeed,
        windDir:       day.windDir,
        pressure:      day.pressure,
        pressureTrend: day.pressureTrend,
        tempMax:       day.tempMax,
        tempMin:       day.tempMin,
        precipitation: day.precipitation,
        weatherCode:   day.weatherCode,
        tides,
    };
}

export function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
