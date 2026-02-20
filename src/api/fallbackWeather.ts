import { CONFIG } from '../config';
import type {
    WeatherDay
    ,
} from '../types';
/**
     * Generates placeholder weather data for the forecast period.
     *
     * Returns idealized conditions (clear sky, light wind, stable pressure)
     * representative of a typical Brevard County spring day. Used when the
     * Open-Meteo API is unavailable.
     *
     * @returns An array of `WeatherDay` objects, one per forecast day.
     */
    function fallbackWeather(): WeatherDay[] {
        const today = new Date();
        return Array.from<unknown, WeatherDay>({ length: CONFIG.FORECAST_DAYS }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            return {
                date:          d.toISOString().slice(0, 10),
                tempMax:       78,
                tempMin:       65,
                precipitation: 0,
                windSpeed:     9,
                windDir:       90,
                weatherCode:   1,
                pressure:      1016,
                pressureTrend: 'stable',
            };
        });
    }

    export default fallbackWeather;