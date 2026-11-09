import { describe, it, expect } from 'vitest';
import { rateDay } from '../../src/engine/rateDay';
import { FishingEngine } from '../../src/engine';
import type { FishingSpot, WeatherDay, WeatherWindow } from '../../src/types';

const flat: FishingSpot = {
    id: 'flat',
    name: 'Flat',
    lat: 28.3,
    lng: -80.7,
    species: ['snook'],
    description: '',
    features: ['flats'],
    tidePreference: 'incoming',
    tideRegime: 'lagoon',
    tips: [],
};

function dayWith(dawnWind: number, duskWind: number): WeatherDay {
    const dawn: WeatherWindow = { windSpeed: dawnWind, windDir: 90, tempF: 78, precipitation: 0, pressure: 1018 };
    const dusk: WeatherWindow = { windSpeed: duskWind, windDir: 90, tempF: 78, precipitation: 0, pressure: 1018 };
    return {
        date: '2026-10-28',
        tempMax: 88,
        tempMin: 70,
        precipitation: 0.4,
        windSpeed: Math.max(dawnWind, duskWind),
        windDir: 90,
        weatherCode: 1,
        pressure: 1018,
        pressureTrend: 'stable',
        dawn,
        dusk,
    };
}

describe('rateDay', () => {
    it('picks the calmer window and uses the same rating thresholds as a marker', () => {
        const summary = rateDay(dayWith(4, 28), [], 'snook', [flat]);
        expect(summary.period).toBe('dawn');
        expect(summary.conditions.windSpeed).toBe(4);
        expect(summary.rating).toBe(FishingEngine.getRating(summary.score));
    });

    it('rates a calm dawn higher than a gale at both windows', () => {
        const calm = rateDay(dayWith(4, 6), [], 'snook', [flat]);
        const gale = rateDay(dayWith(30, 32), [], 'snook', [flat]);
        expect(calm.score).toBeGreaterThan(gale.score);
    });
});
