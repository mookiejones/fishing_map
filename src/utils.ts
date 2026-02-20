// ============================================================
// utils.ts — Shared helper functions
// ============================================================

import type { WeatherDay, DayConditions, TideEvent } from './types';

/**
 * Assembles a `DayConditions` object from a `WeatherDay` and its tide schedule.
 *
 * `DayConditions` is the shape that `FishingEngine` consumes; this function
 * merges the flat weather fields with the separately-fetched tide array.
 *
 * @param day   - One day of Open-Meteo forecast data.
 * @param tides - NOAA hi-lo events for that calendar date (may be empty).
 * @returns A `DayConditions` ready to pass to `FishingEngine.rateSpot()`.
 */
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

/**
 * Uppercases the first character of a string, leaving the rest unchanged.
 *
 * Used to display species names in the UI (e.g. `'tarpon'` → `'Tarpon'`).
 *
 * @param s - Input string (may be empty).
 * @returns The string with its first character capitalized.
 */
export function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
