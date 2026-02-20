import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WeatherAPI } from './api';
import type { OpenMeteoResponse, NoaaPrediction } from './types';
import { CONFIG } from './config';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal OpenMeteoResponse for N days. */
function makeWeatherResponse(
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
function pressures(morning: number, evening: number, fill = 1013): (number | null)[] {
    const arr: (number | null)[] = new Array(24).fill(fill) as (number | null)[];
    arr[6]  = morning;
    arr[18] = evening;
    return arr;
}

// ── processWeather ────────────────────────────────────────────────────────────

describe('processWeather', () => {
    it('maps all daily fields correctly', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 88, tempMin: 71,
            precipitation: 0.2, windSpeed: 11, windDir: 180, code: 2,
            pressures: new Array(24).fill(1018) as number[],
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.date).toBe('2024-06-15');
        expect(day!.tempMax).toBe(88);
        expect(day!.tempMin).toBe(71);
        expect(day!.precipitation).toBe(0.2);
        expect(day!.windSpeed).toBe(11);
        expect(day!.windDir).toBe(180);
        expect(day!.weatherCode).toBe(2);
    });

    it('averages pressure across 24 hours and rounds', () => {
        // All pressures = 1017.6 → rounds to 1018
        const p = new Array(24).fill(1017.6) as number[];
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: p,
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.pressure).toBe(1018);
    });

    it('falls back to 1013 when all pressures are null', () => {
        const p: (number | null)[] = new Array(24).fill(null);
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: p,
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.pressure).toBe(1013);
    });

    it('treats null precipitation_sum as 0', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: null, windSpeed: 8, windDir: 90, code: 0,
            pressures: new Array(24).fill(1013) as number[],
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.precipitation).toBe(0);
    });

    it('detects rising pressure trend (diff > 1.5)', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: pressures(1012, 1015),   // diff = +3
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.pressureTrend).toBe('rising');
    });

    it('detects falling pressure trend (diff < -1.5)', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: pressures(1015, 1012),   // diff = -3
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.pressureTrend).toBe('falling');
    });

    it('marks stable when diff is within ±1.5', () => {
        const response = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: pressures(1013, 1014),   // diff = +1
        }]);
        const [day] = WeatherAPI.processWeather(response);
        expect(day!.pressureTrend).toBe('stable');
    });

    it('processes multiple days independently', () => {
        const response = makeWeatherResponse([
            { date: '2024-06-15', tempMax: 85, tempMin: 70, precipitation: 0, windSpeed: 8,  windDir: 90,  code: 0, pressures: pressures(1010, 1015) },
            { date: '2024-06-16', tempMax: 90, tempMin: 75, precipitation: 1, windSpeed: 12, windDir: 180, code: 3, pressures: pressures(1015, 1010) },
        ]);
        const days = WeatherAPI.processWeather(response);
        expect(days).toHaveLength(2);
        expect(days[0]!.pressureTrend).toBe('rising');
        expect(days[1]!.pressureTrend).toBe('falling');
        expect(days[0]!.date).toBe('2024-06-15');
        expect(days[1]!.date).toBe('2024-06-16');
    });
});

// ── processTides ──────────────────────────────────────────────────────────────

describe('processTides', () => {
    const predictions: NoaaPrediction[] = [
        { t: '2024-06-15 06:30', v: '1.2',  type: 'H' },
        { t: '2024-06-15 12:45', v: '-0.1', type: 'L' },
        { t: '2024-06-16 07:00', v: '1.0',  type: 'H' },
        { t: '2024-06-16 13:15', v: '0.0',  type: 'L' },
    ];

    it('groups predictions by date', () => {
        const result = WeatherAPI.processTides(predictions);
        expect(Object.keys(result)).toEqual(
            expect.arrayContaining(['2024-06-15', '2024-06-16']),
        );
        expect(result['2024-06-15']).toHaveLength(2);
        expect(result['2024-06-16']).toHaveLength(2);
    });

    it('parses hour and minute correctly', () => {
        const result = WeatherAPI.processTides(predictions);
        const first = result['2024-06-15']![0]!;
        expect(first.hour).toBe(6);
        expect(first.minute).toBe(30);
    });

    it('parses height as a float', () => {
        const result = WeatherAPI.processTides(predictions);
        expect(result['2024-06-15']![1]!.height).toBeCloseTo(-0.1);
    });

    it('passes through tide type (H or L)', () => {
        const result = WeatherAPI.processTides(predictions);
        expect(result['2024-06-15']![0]!.type).toBe('H');
        expect(result['2024-06-15']![1]!.type).toBe('L');
    });

    it('handles single-date predictions', () => {
        const single: NoaaPrediction[] = [
            { t: '2024-06-15 00:00', v: '1.5', type: 'H' },
        ];
        const result = WeatherAPI.processTides(single);
        expect(Object.keys(result)).toHaveLength(1);
        expect(result['2024-06-15']![0]!.hour).toBe(0);
        expect(result['2024-06-15']![0]!.minute).toBe(0);
    });
});

// ── weatherInfo ───────────────────────────────────────────────────────────────

describe('weatherInfo', () => {
    it('code 0 → Clear', () => {
        const w = WeatherAPI.weatherInfo(0);
        expect(w.desc).toBe('Clear');
        expect(w.icon).toBeTruthy();
    });

    it('codes 1-2 → Partly Cloudy', () => {
        expect(WeatherAPI.weatherInfo(1).desc).toBe('Partly Cloudy');
        expect(WeatherAPI.weatherInfo(2).desc).toBe('Partly Cloudy');
    });

    it('code 3 → Overcast', () => {
        expect(WeatherAPI.weatherInfo(3).desc).toBe('Overcast');
    });

    it('codes 4-48 → Foggy', () => {
        expect(WeatherAPI.weatherInfo(4).desc).toBe('Foggy');
        expect(WeatherAPI.weatherInfo(48).desc).toBe('Foggy');
    });

    it('codes 49-57 → Drizzle', () => {
        expect(WeatherAPI.weatherInfo(49).desc).toBe('Drizzle');
        expect(WeatherAPI.weatherInfo(57).desc).toBe('Drizzle');
    });

    it('codes 58-67 → Rain', () => {
        expect(WeatherAPI.weatherInfo(58).desc).toBe('Rain');
        expect(WeatherAPI.weatherInfo(67).desc).toBe('Rain');
    });

    it('codes 68-77 → Snow', () => {
        expect(WeatherAPI.weatherInfo(68).desc).toBe('Snow');
        expect(WeatherAPI.weatherInfo(77).desc).toBe('Snow');
    });

    it('codes 78-82 → Showers', () => {
        expect(WeatherAPI.weatherInfo(78).desc).toBe('Showers');
        expect(WeatherAPI.weatherInfo(82).desc).toBe('Showers');
    });

    it('codes 83-99 → Thunderstorm', () => {
        expect(WeatherAPI.weatherInfo(83).desc).toBe('Thunderstorm');
        expect(WeatherAPI.weatherInfo(99).desc).toBe('Thunderstorm');
    });

    it('code >99 → Variable', () => {
        expect(WeatherAPI.weatherInfo(100).desc).toBe('Variable');
        expect(WeatherAPI.weatherInfo(999).desc).toBe('Variable');
    });

    it('all results have a non-empty icon and desc', () => {
        [0, 1, 3, 10, 50, 60, 70, 80, 90, 100].forEach(code => {
            const { icon, desc } = WeatherAPI.weatherInfo(code);
            expect(icon.trim().length).toBeGreaterThan(0);
            expect(desc.trim().length).toBeGreaterThan(0);
        });
    });
});

// ── degToCompass ─────────────────────────────────────────────────────────────

describe('degToCompass', () => {
    it('returns N for 0°', () => expect(WeatherAPI.degToCompass(0)).toBe('N'));
    it('returns E for 90°', () => expect(WeatherAPI.degToCompass(90)).toBe('E'));
    it('returns S for 180°', () => expect(WeatherAPI.degToCompass(180)).toBe('S'));
    it('returns W for 270°', () => expect(WeatherAPI.degToCompass(270)).toBe('W'));
    it('returns NE for 45°', () => expect(WeatherAPI.degToCompass(45)).toBe('NE'));
    it('returns SW for 225°', () => expect(WeatherAPI.degToCompass(225)).toBe('SW'));
    it('returns NNE for 22°', () => expect(WeatherAPI.degToCompass(22)).toBe('NNE'));
    it('returns N for 360° (wraps)', () => expect(WeatherAPI.degToCompass(360)).toBe('N'));
});

// ── formatTideTime ────────────────────────────────────────────────────────────

describe('formatTideTime', () => {
    it('formats a morning time correctly', () => {
        expect(WeatherAPI.formatTideTime({ hour: 6, minute: 30 })).toBe('6:30 AM');
    });

    it('formats a midday time correctly', () => {
        expect(WeatherAPI.formatTideTime({ hour: 14, minute: 5 })).toBe('2:05 PM');
    });

    it('zero-pads single-digit minutes', () => {
        expect(WeatherAPI.formatTideTime({ hour: 9, minute: 3 })).toBe('9:03 AM');
    });

    it('midnight (hour=0) → 12:xx AM', () => {
        expect(WeatherAPI.formatTideTime({ hour: 0, minute: 0 })).toBe('12:00 AM');
    });

    it('noon (hour=12) → 12:xx PM', () => {
        expect(WeatherAPI.formatTideTime({ hour: 12, minute: 45 })).toBe('12:45 PM');
    });

    it('11 PM', () => {
        expect(WeatherAPI.formatTideTime({ hour: 23, minute: 59 })).toBe('11:59 PM');
    });
});

// ── fallbackWeather ───────────────────────────────────────────────────────────

describe('fallbackWeather', () => {
    it('returns FORECAST_DAYS items', () => {
        const result = WeatherAPI.fallbackWeather();
        expect(result).toHaveLength(CONFIG.FORECAST_DAYS);
    });

    it('each item has all required WeatherDay fields', () => {
        WeatherAPI.fallbackWeather().forEach(day => {
            expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(typeof day.tempMax).toBe('number');
            expect(typeof day.tempMin).toBe('number');
            expect(typeof day.precipitation).toBe('number');
            expect(typeof day.windSpeed).toBe('number');
            expect(typeof day.windDir).toBe('number');
            expect(typeof day.weatherCode).toBe('number');
            expect(typeof day.pressure).toBe('number');
            expect(['rising', 'falling', 'stable']).toContain(day.pressureTrend);
        });
    });

    it('dates are sequential starting from today', () => {
        const days = WeatherAPI.fallbackWeather();
        const today = new Date().toISOString().slice(0, 10);
        expect(days[0]!.date).toBe(today);
        for (let i = 1; i < days.length; i++) {
            const prev = new Date(days[i - 1]!.date);
            const curr = new Date(days[i]!.date);
            expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
        }
    });
});

// ── fallbackTides ─────────────────────────────────────────────────────────────

describe('fallbackTides', () => {
    it('returns an entry for each forecast day', () => {
        const result = WeatherAPI.fallbackTides();
        expect(Object.keys(result)).toHaveLength(CONFIG.FORECAST_DAYS);
    });

    it('each date key is YYYY-MM-DD format', () => {
        const result = WeatherAPI.fallbackTides();
        Object.keys(result).forEach(key => {
            expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    it('each day has tide events with valid types', () => {
        const result = WeatherAPI.fallbackTides();
        Object.values(result).forEach(tides => {
            expect(tides.length).toBeGreaterThan(0);
            tides.forEach(t => {
                expect(['H', 'L']).toContain(t.type);
                expect(t.hour).toBeGreaterThanOrEqual(0);
                expect(t.hour).toBeLessThan(24);
            });
        });
    });
});

// ── fetchAll (fetch mocking) ──────────────────────────────────────────────────

describe('fetchAll', () => {
    beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
    afterEach(() => { vi.unstubAllGlobals(); });

    it('returns weather and tides on success', async () => {
        const mockWeatherResponse: OpenMeteoResponse = makeWeatherResponse([{
            date: '2024-06-15', tempMax: 85, tempMin: 70,
            precipitation: 0, windSpeed: 8, windDir: 90, code: 0,
            pressures: new Array(24).fill(1013) as number[],
        }]);

        const mockTidesResponse = {
            predictions: [
                { t: '2024-06-15 06:30', v: '1.2', type: 'H' },
            ],
        };

        const fetchMock = vi.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockWeatherResponse,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockTidesResponse,
            });

        vi.stubGlobal('fetch', fetchMock);

        const result = await WeatherAPI.fetchAll();
        expect(result.error).toBeNull();
        expect(result.weather).toHaveLength(1);
        expect(result.weather[0]!.date).toBe('2024-06-15');
        expect(result.tides['2024-06-15']).toBeDefined();
    });

    it('returns fallback data and error message on network failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

        const result = await WeatherAPI.fetchAll();
        expect(result.error).toBe('Network error');
        expect(result.weather).toHaveLength(CONFIG.FORECAST_DAYS);
        expect(Object.keys(result.tides)).toHaveLength(CONFIG.FORECAST_DAYS);
    });

    it('returns fallback and error when weather API returns non-ok status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

        const result = await WeatherAPI.fetchAll();
        expect(result.error).toContain('503');
        expect(result.weather).toHaveLength(CONFIG.FORECAST_DAYS);
    });
});
