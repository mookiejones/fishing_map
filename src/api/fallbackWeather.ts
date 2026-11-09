import { CONFIG } from '../config';
import type { WeatherDay } from '../types';
import { forecastDates } from '../time/forecastDates';

/**
 * Placeholder weather for the forecast period, used only when Open-Meteo fails.
 * Dates follow the local fishing calendar so they still join a live tide feed.
 */
function fallbackWeather(): WeatherDay[] {
    const dates = forecastDates(CONFIG.FORECAST_DAYS);
    const window = {
        windSpeed: 9,
        windDir: 90,
        tempF: 72,
        precipitation: 0,
        pressure: 1016,
    };
    return dates.map(date => ({
        date,
        tempMax:       78,
        tempMin:       65,
        precipitation: 0,
        windSpeed:     9,
        windDir:       90,
        weatherCode:   1,
        pressure:      1016,
        pressureTrend: 'stable' as const,
        dawn:          window,
        dusk:          window,
    }));
}

export default fallbackWeather;
