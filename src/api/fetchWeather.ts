import processWeather from "./processWeather"
import { CONFIG } from "../config";
import type {
    FetchResult, WeatherDay, TideEvent, TideType, PressureTrend,
    OpenMeteoResponse, NoaaResponse, NoaaPrediction, WeatherInfo,
} from '../types';

/**
     * Fetches a 7-day daily forecast from Open-Meteo and returns processed days.
     *
     * Requests temperature, precipitation, wind, weather code (daily), and
     * surface pressure (hourly) in a single call. Units are °F and mph as
     * required by the scoring engine.
     *
     * @throws If the HTTP response status is not OK.
     * @returns An array of `WeatherDay` objects, one per forecast day.
     */
const fetchWeather= async(): Promise<WeatherDay[]> =>{
        const params = new URLSearchParams({
            latitude:      String(CONFIG.WEATHER_LAT),
            longitude:     String(CONFIG.WEATHER_LNG),
            timezone:      CONFIG.TIMEZONE,
            forecast_days: String(CONFIG.FORECAST_DAYS),
            wind_speed_unit:  'mph',
            temperature_unit: 'fahrenheit',
            daily: [
                'temperature_2m_max',
                'temperature_2m_min',
                'precipitation_sum',
                'wind_speed_10m_max',
                'wind_direction_10m_dominant',
                'weather_code',
            ].join(','),
            hourly: 'surface_pressure',
        });

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!res.ok) throw new Error(`Weather API returned ${res.status}`);

        const data = await res.json() as OpenMeteoResponse;
        return processWeather(data);
    }

    export default fetchWeather;