import type { DayConditions, TideEvent, WeatherDay } from '../types';

/** Scoring conditions for one bite window. `tempMax` carries the window mean. */
export function conditionsForWindow(
    day: WeatherDay,
    period: 'dawn' | 'dusk',
    tides: TideEvent[],
): DayConditions {
    const window = day[period];
    return {
        windSpeed:     window.windSpeed,
        windDir:       window.windDir,
        pressure:      window.pressure,
        pressureTrend: day.pressureTrend,
        tempMax:       window.tempF,
        tempMin:       day.tempMin,
        precipitation: window.precipitation,
        weatherCode:   day.weatherCode,
        tides,
    };
}
