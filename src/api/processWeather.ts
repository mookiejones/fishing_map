// ============================================================
// api.ts — Weather (Open-Meteo) and Tide (NOAA) data fetching
// ============================================================
// Both APIs are free and require no authentication.
//   Open-Meteo:  https://open-meteo.com
//   NOAA CO-OPS: https://tidesandcurrents.noaa.gov/api/
// ============================================================

import type {
    FetchResult, WeatherDay, TideEvent, TideType, PressureTrend,
    OpenMeteoResponse, NoaaResponse, NoaaPrediction, WeatherInfo,
} from '../types';

/**
     * Transforms a raw Open-Meteo API response into an array of `WeatherDay` objects.
     *
     * Pressure is averaged across the day's 24 hourly readings (nulls excluded).
     * The barometric trend compares the 6 AM reading to the 6 PM reading:
     * diff > 1.5 hPa = rising, diff < −1.5 hPa = falling, otherwise stable.
     *
     * @param data - Raw JSON response from the Open-Meteo forecast endpoint.
     * @returns Processed array of `WeatherDay` objects.
     */
export default function    processWeather(data: OpenMeteoResponse): WeatherDay[] {
        const { daily, hourly } = data;
        const days: WeatherDay[] = [];

        for (let i = 0; i < daily.time.length; i++) {
            const h0  = i * 24;
            const h24 = h0 + 24;

            // Filter out null pressure readings for this day's hours
            const pressures = hourly.surface_pressure
                .slice(h0, h24)
                .filter((p): p is number => p !== null);

            const avgPressure = pressures.length > 0
                ? pressures.reduce((a, b) => a + b, 0) / pressures.length
                : 1013;

            // Barometric trend: morning (6am) vs evening (6pm)
            const morning = hourly.surface_pressure[h0 + 6]  ?? avgPressure;
            const evening = hourly.surface_pressure[h0 + 18] ?? avgPressure;
            const diff    = evening - morning;

            let pressureTrend: PressureTrend = 'stable';
            if (diff > 1.5)  pressureTrend = 'rising';
            if (diff < -1.5) pressureTrend = 'falling';

            days.push({
                date:          daily.time[i]!,
                tempMax:       daily.temperature_2m_max[i]!,
                tempMin:       daily.temperature_2m_min[i]!,
                precipitation: daily.precipitation_sum[i] ?? 0,
                windSpeed:     daily.wind_speed_10m_max[i]!,
                windDir:       daily.wind_direction_10m_dominant[i]!,
                weatherCode:   daily.weather_code[i]!,
                pressure:      Math.round(avgPressure),
                pressureTrend,
            });
        }

        return days;
    }
