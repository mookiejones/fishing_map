import type {
    WeatherDay, WeatherWindow, PressureTrend, OpenMeteoResponse,
} from '../types';

const DAWN_HOURS = [5, 6, 7, 8];
const DUSK_HOURS = [17, 18, 19, 20];
/** Same-hour comparison. A 1.5 hPa afternoon dip is the normal diurnal cycle. */
const TREND_HOUR = 8;
const TREND_STEP = 1.5;

function mean(values: number[], fallback: number): number {
    if (values.length === 0) return fallback;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function circularMean(degrees: number[], fallback: number): number {
    if (degrees.length === 0) return fallback;
    let x = 0;
    let y = 0;
    for (const deg of degrees) {
        const rad = (deg * Math.PI) / 180;
        x += Math.cos(rad);
        y += Math.sin(rad);
    }
    const angle = (Math.atan2(y, x) * 180) / Math.PI;
    return (angle + 360) % 360;
}

function daySlice<T>(series: T[] | undefined, dayIndex: number): T[] | null {
    if (!series) return null;
    const slice = series.slice(dayIndex * 24, dayIndex * 24 + 24);
    return slice.length === 24 ? slice : null;
}

function pickHours(series: (number | null)[] | null, hours: number[], fallback: number): number[] {
    if (!series) return hours.map(() => fallback);
    return hours
        .map(hour => series[hour])
        .filter((value): value is number => value != null && Number.isFinite(value));
}

function buildWindow(
    hours: number[],
    wind: (number | null)[] | null,
    direction: (number | null)[] | null,
    temp: (number | null)[] | null,
    precip: (number | null)[] | null,
    pressure: (number | null)[] | null,
    fallback: { wind: number; dir: number; temp: number; pressure: number },
): WeatherWindow {
    const winds = pickHours(wind, hours, fallback.wind);
    const dirs = pickHours(direction, hours, fallback.dir);
    const temps = pickHours(temp, hours, fallback.temp);
    const rains = pickHours(precip, hours, 0);
    const pressures = pickHours(pressure, hours, fallback.pressure);
    return {
        windSpeed:     mean(winds, fallback.wind),
        windDir:       circularMean(dirs, fallback.dir),
        tempF:         mean(temps, fallback.temp),
        precipitation: rains.reduce((sum, value) => sum + value, 0),
        pressure:      Math.round(mean(pressures, fallback.pressure)),
    };
}

function pressureTrend(today: (number | null)[], yesterday: (number | null)[] | null): PressureTrend {
    const now = today[TREND_HOUR];
    const then = yesterday?.[TREND_HOUR];
    if (now == null || then == null) return 'stable';
    const diff = now - then;
    if (diff > TREND_STEP) return 'rising';
    if (diff < -TREND_STEP) return 'falling';
    return 'stable';
}

/**
 * Transforms a raw Open-Meteo response into `WeatherDay` objects.
 *
 * The daily fields stay on the day for the forecast overview. Dawn (05–08)
 * and dusk (17–20) are averaged from the hourly series, which is what the
 * scorer uses. Pressure trend compares 08:00 today with 08:00 yesterday so
 * the normal afternoon dip is not called a cold front. The first day has no
 * yesterday and stays stable.
 */
export default function processWeather(data: OpenMeteoResponse): WeatherDay[] {
    const { daily, hourly } = data;
    const days: WeatherDay[] = [];

    for (let i = 0; i < daily.time.length; i++) {
        const pressures = daySlice(hourly.surface_pressure, i) ?? Array(24).fill(null);
        const finite = pressures.filter((value): value is number => value !== null);
        const avgPressure = finite.length > 0
            ? finite.reduce((a, b) => a + b, 0) / finite.length
            : 1013;

        const windFallback = daily.wind_speed_10m_max[i] ?? 0;
        const dirFallback = daily.wind_direction_10m_dominant[i] ?? 0;
        const tempFallback = daily.temperature_2m_max[i] ?? 75;
        const fallback = {
            wind: windFallback,
            dir: dirFallback,
            temp: tempFallback,
            pressure: avgPressure,
        };
        const wind = daySlice(hourly.wind_speed_10m, i);
        const direction = daySlice(hourly.wind_direction_10m, i);
        const temp = daySlice(hourly.temperature_2m, i);
        const precip = daySlice(hourly.precipitation, i);
        const yesterday = i > 0 ? daySlice(hourly.surface_pressure, i - 1) : null;

        days.push({
            date:          daily.time[i]!,
            tempMax:       daily.temperature_2m_max[i]!,
            tempMin:       daily.temperature_2m_min[i]!,
            precipitation: daily.precipitation_sum[i] ?? 0,
            windSpeed:     windFallback,
            windDir:       dirFallback,
            weatherCode:   daily.weather_code[i]!,
            pressure:      Math.round(avgPressure),
            pressureTrend: pressureTrend(pressures, yesterday),
            dawn: buildWindow(DAWN_HOURS, wind, direction, temp, precip, pressures, fallback),
            dusk: buildWindow(DUSK_HOURS, wind, direction, temp, precip, pressures, fallback),
        });
    }

    return days;
}
