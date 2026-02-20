import { describe, it, expect } from 'vitest';
import { FishingEngine, fmtHour } from './engine';
import type { FishingSpot, DayConditions, TideEvent } from './types';

// ── Shared fixtures ───────────────────────────────────────────

const incomingSpot: FishingSpot = {
    id: 'test-incoming',
    name: 'Test Incoming Spot',
    lat: 28.0,
    lng: -80.5,
    species: ['redfish', 'snook'],
    description: 'Test',
    features: ['flats'],
    tidePreference: 'incoming',
    tips: [],
};

const outgoingSpot: FishingSpot = {
    ...incomingSpot,
    id: 'test-outgoing',
    tidePreference: 'outgoing',
    species: ['tarpon', 'snook'],
};

const baseTides: TideEvent[] = [
    { hour: 6,  minute: 30, height:  1.2, type: 'H' },  // dawn high
    { hour: 12, minute: 15, height: -0.1, type: 'L' },
    { hour: 18, minute: 45, height:  0.9, type: 'H' },  // dusk high
    { hour: 23, minute: 55, height:  0.0, type: 'L' },
];

const baseConditions: DayConditions = {
    windSpeed:     8,
    windDir:       90,
    pressure:      1020,
    pressureTrend: 'rising',
    tempMax:       80,
    tempMin:       68,
    precipitation: 0,
    weatherCode:   1,
    tides:         baseTides,
};

// ── FishingEngine.scoreWind ───────────────────────────────────

describe('FishingEngine.scoreWind', () => {
    it('returns 25 for calm conditions (< 5 mph)', () => {
        expect(FishingEngine.scoreWind(0)).toBe(25);
        expect(FishingEngine.scoreWind(4)).toBe(25);
    });

    it('returns 20 for light wind (5–9 mph)', () => {
        expect(FishingEngine.scoreWind(5)).toBe(20);
        expect(FishingEngine.scoreWind(9)).toBe(20);
    });

    it('returns 13 for moderate wind (10–14 mph)', () => {
        expect(FishingEngine.scoreWind(10)).toBe(13);
        expect(FishingEngine.scoreWind(14)).toBe(13);
    });

    it('returns 6 for fresh wind (15–19 mph)', () => {
        expect(FishingEngine.scoreWind(15)).toBe(6);
        expect(FishingEngine.scoreWind(19)).toBe(6);
    });

    it('returns 2 for strong wind (20–24 mph)', () => {
        expect(FishingEngine.scoreWind(20)).toBe(2);
        expect(FishingEngine.scoreWind(24)).toBe(2);
    });

    it('returns 0 for gale conditions (≥ 25 mph)', () => {
        expect(FishingEngine.scoreWind(25)).toBe(0);
        expect(FishingEngine.scoreWind(60)).toBe(0);
    });
});

// ── FishingEngine.scorePressure ───────────────────────────────

describe('FishingEngine.scorePressure', () => {
    it('caps at 25 maximum (high pressure + rising)', () => {
        expect(FishingEngine.scorePressure(1023, 'rising')).toBe(25);  // 21 + 4
        expect(FishingEngine.scorePressure(1030, 'rising')).toBe(25);
    });

    it('applies +1 trend bonus for stable pressure', () => {
        expect(FishingEngine.scorePressure(1030, 'stable')).toBe(22);  // 21 + 1
    });

    it('applies −6 penalty for falling barometer', () => {
        expect(FishingEngine.scorePressure(1023, 'falling')).toBe(15); // 21 − 6
        expect(FishingEngine.scorePressure(1015, 'falling')).toBe(11); // 17 − 6
    });

    it('never returns a negative value', () => {
        expect(FishingEngine.scorePressure(990, 'falling')).toBe(0);   // 2 − 6 → 0
        expect(FishingEngine.scorePressure(980, 'falling')).toBe(0);
    });

    it('scores lower pressure bands correctly', () => {
        expect(FishingEngine.scorePressure(1014, 'stable')).toBe(12);  // 11 + 1 (≥1008 band)
        expect(FishingEngine.scorePressure(1007, 'stable')).toBe(7);   //  6 + 1 (≥1000 band)
        expect(FishingEngine.scorePressure(999,  'stable')).toBe(3);   //  2 + 1 (< 1000 band)
        expect(FishingEngine.scorePressure(1015, 'stable')).toBe(18);  // 17 + 1 (≥1015 band)
    });
});

// ── FishingEngine.scoreTemperature ───────────────────────────

describe('FishingEngine.scoreTemperature', () => {
    // Water temp = air temp − 3

    it('returns 20 at each species optimal temperature', () => {
        // Tarpon optimal = 82°F water → 85°F air
        expect(FishingEngine.scoreTemperature(85, 'tarpon')).toBe(20);
        // Snook optimal = 75°F water → 78°F air
        expect(FishingEngine.scoreTemperature(78, 'snook')).toBe(20);
        // Redfish optimal = 70°F water → 73°F air
        expect(FishingEngine.scoreTemperature(73, 'redfish')).toBe(20);
    });

    it('returns 0 when well below minimum range', () => {
        // Tarpon min = 70°F water (73°F air); 60°F air → water=57, overshoot=13 → max(0,8−13)=0
        expect(FishingEngine.scoreTemperature(60, 'tarpon')).toBe(0);
        // Redfish min = 48°F water (51°F air); 40°F air → water=37, overshoot=11 → max(0,8−11)=0
        expect(FishingEngine.scoreTemperature(40, 'redfish')).toBe(0);
    });

    it('returns 0 when well above maximum range', () => {
        // Snook max = 90°F water (93°F air); 105°F air → water=102, overshoot=12 → max(0,8−12)=0
        expect(FishingEngine.scoreTemperature(105, 'snook')).toBe(0);
        // Tarpon max = 94°F water (97°F air); 110°F air → water=107, overshoot=13 → 0
        expect(FishingEngine.scoreTemperature(110, 'tarpon')).toBe(0);
    });

    it('never returns a negative score', () => {
        expect(FishingEngine.scoreTemperature(20,  'tarpon')).toBeGreaterThanOrEqual(0);
        expect(FishingEngine.scoreTemperature(120, 'snook')).toBeGreaterThanOrEqual(0);
    });

    it('scores decrease as temperature moves from optimal', () => {
        const atOptimal  = FishingEngine.scoreTemperature(78, 'snook');
        const slightlyOff = FishingEngine.scoreTemperature(82, 'snook');
        const farOff     = FishingEngine.scoreTemperature(90, 'snook');
        expect(atOptimal).toBeGreaterThan(slightlyOff);
        expect(slightlyOff).toBeGreaterThan(farOff);
    });
});

// ── FishingEngine.scoreTides ──────────────────────────────────

describe('FishingEngine.scoreTides', () => {
    it('returns 14 when no tides are provided', () => {
        expect(FishingEngine.scoreTides([], incomingSpot)).toBe(14);
    });

    it('scores higher when preferred tide type is present', () => {
        const withPreferred: TideEvent[]    = [{ hour: 10, minute: 0, height: 1.0, type: 'H' }];
        const withoutPreferred: TideEvent[] = [{ hour: 10, minute: 0, height: 0.0, type: 'L' }];
        expect(FishingEngine.scoreTides(withPreferred, incomingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides(withoutPreferred, incomingSpot));
    });

    it('grants prime bonus for preferred tide at dawn (5–9)', () => {
        const dawnH:   TideEvent[] = [{ hour: 6,  minute: 0, height: 1.2, type: 'H' }];
        const middayH: TideEvent[] = [{ hour: 11, minute: 0, height: 1.2, type: 'H' }];
        expect(FishingEngine.scoreTides(dawnH,   incomingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides(middayH, incomingSpot));
    });

    it('grants prime bonus for preferred tide at dusk (16–20)', () => {
        const duskH:   TideEvent[] = [{ hour: 18, minute: 0, height: 1.2, type: 'H' }];
        const middayH: TideEvent[] = [{ hour: 11, minute: 0, height: 1.2, type: 'H' }];
        expect(FishingEngine.scoreTides(duskH,   incomingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides(middayH, incomingSpot));
    });

    it('uses L tide preference for outgoing spots', () => {
        const dawnL: TideEvent[] = [{ hour: 7, minute: 0, height: -0.1, type: 'L' }];
        const dawnH: TideEvent[] = [{ hour: 7, minute: 0, height:  1.2, type: 'H' }];
        expect(FishingEngine.scoreTides(dawnL, outgoingSpot))
            .toBeGreaterThan(FishingEngine.scoreTides(dawnH, outgoingSpot));
    });

    it('never exceeds 30', () => {
        expect(FishingEngine.scoreTides(baseTides, incomingSpot)).toBeLessThanOrEqual(30);
    });

    it('scores more tide events higher (up to the cap)', () => {
        const oneTide:  TideEvent[] = [{ hour: 6, minute: 0, height: 1.2, type: 'H' }];
        const twoTides: TideEvent[] = [
            { hour: 6, minute: 0, height: 1.2, type: 'H' },
            { hour: 12, minute: 0, height: -0.1, type: 'L' },
        ];
        expect(FishingEngine.scoreTides(twoTides, incomingSpot))
            .toBeGreaterThanOrEqual(FishingEngine.scoreTides(oneTide, incomingSpot));
    });
});

// ── FishingEngine.getRating ───────────────────────────────────

describe('FishingEngine.getRating', () => {
    it('returns "excellent" at and above 78', () => {
        expect(FishingEngine.getRating(78)).toBe('excellent');
        expect(FishingEngine.getRating(100)).toBe('excellent');
    });

    it('returns "good" from 57 to 77', () => {
        expect(FishingEngine.getRating(57)).toBe('good');
        expect(FishingEngine.getRating(77)).toBe('good');
    });

    it('returns "fair" from 37 to 56', () => {
        expect(FishingEngine.getRating(37)).toBe('fair');
        expect(FishingEngine.getRating(56)).toBe('fair');
    });

    it('returns "poor" below 37', () => {
        expect(FishingEngine.getRating(36)).toBe('poor');
        expect(FishingEngine.getRating(0)).toBe('poor');
    });
});

// ── FishingEngine.getRatingColor ─────────────────────────────

describe('FishingEngine.getRatingColor', () => {
    const hexColor = /^#[0-9a-f]{6}$/i;

    it('returns a hex color for each rating', () => {
        expect(FishingEngine.getRatingColor('excellent')).toMatch(hexColor);
        expect(FishingEngine.getRatingColor('good')).toMatch(hexColor);
        expect(FishingEngine.getRatingColor('fair')).toMatch(hexColor);
        expect(FishingEngine.getRatingColor('poor')).toMatch(hexColor);
    });

    it('excellent is green (#00c851), poor is red (#f44336)', () => {
        expect(FishingEngine.getRatingColor('excellent')).toBe('#00c851');
        expect(FishingEngine.getRatingColor('poor')).toBe('#f44336');
    });

    it('all four ratings return distinct colors', () => {
        const colors = (['excellent', 'good', 'fair', 'poor'] as const).map(r =>
            FishingEngine.getRatingColor(r),
        );
        const unique = new Set(colors);
        expect(unique.size).toBe(4);
    });
});

// ── FishingEngine.getBestTime ─────────────────────────────────

describe('FishingEngine.getBestTime', () => {
    it('returns a fallback string when tides array is empty', () => {
        expect(FishingEngine.getBestTime([], incomingSpot)).toBe('Dawn and dusk periods');
    });

    it('identifies dawn preferred tide (hour 5–9)', () => {
        const dawnH: TideEvent[] = [{ hour: 6, minute: 0, height: 1.2, type: 'H' }];
        expect(FishingEngine.getBestTime(dawnH, incomingSpot)).toContain('Dawn');
    });

    it('identifies dusk preferred tide (hour 16–20)', () => {
        const duskH: TideEvent[] = [{ hour: 18, minute: 30, height: 0.9, type: 'H' }];
        expect(FishingEngine.getBestTime(duskH, incomingSpot)).toContain('Dusk');
    });

    it('falls back to any preferred tide when no prime window matches', () => {
        const middayH: TideEvent[] = [{ hour: 11, minute: 0, height: 1.2, type: 'H' }];
        const result = FishingEngine.getBestTime(middayH, incomingSpot);
        expect(result).toContain('high');
    });

    it('falls back to "Dawn and dusk periods" when no preferred tide exists', () => {
        // incoming spot, but only L tides available
        const onlyL: TideEvent[] = [{ hour: 11, minute: 0, height: -0.1, type: 'L' }];
        expect(FishingEngine.getBestTime(onlyL, incomingSpot)).toBe('Dawn and dusk periods');
    });

    it('uses L tide as preferred for outgoing spots', () => {
        const dawnL: TideEvent[] = [{ hour: 7, minute: 0, height: -0.1, type: 'L' }];
        expect(FishingEngine.getBestTime(dawnL, outgoingSpot)).toContain('Dawn');
    });
});

// ── FishingEngine.rateSpot ────────────────────────────────────

describe('FishingEngine.rateSpot', () => {
    it('returns null when species filter excludes the spot', () => {
        // incomingSpot has redfish + snook, not tarpon
        expect(FishingEngine.rateSpot(incomingSpot, baseConditions, 'tarpon')).toBeNull();
    });

    it('returns a SpotResult when species matches', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'snook');
        expect(result).not.toBeNull();
        expect(result?.score).toBeGreaterThan(0);
        expect(result?.score).toBeLessThanOrEqual(100);
    });

    it('returns a result when selectedSpecies is "all"', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'all');
        expect(result).not.toBeNull();
    });

    it('result contains all required fields', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'all');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('rating');
        expect(result).toHaveProperty('color');
        expect(result).toHaveProperty('bestTime');
        expect(result?.scores).toHaveProperty('wind');
        expect(result?.scores).toHaveProperty('pressure');
        expect(result?.scores).toHaveProperty('tides');
        expect(result?.scores).toHaveProperty('temperature');
    });

    it('score is always capped at 100', () => {
        const perfect: DayConditions = {
            ...baseConditions,
            windSpeed:     2,
            pressure:      1025,
            pressureTrend: 'rising',
            tempMax:       78,   // snook optimal
        };
        const result = FishingEngine.rateSpot(incomingSpot, perfect, 'snook');
        expect(result?.score).toBeLessThanOrEqual(100);
    });

    it('score sum of sub-scores matches total (before cap)', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'snook')!;
        const { wind, pressure, tides, temperature } = result.scores;
        expect(result.score).toBeLessThanOrEqual(wind + pressure + tides + temperature);
    });

    it('rating corresponds to score', () => {
        const result = FishingEngine.rateSpot(incomingSpot, baseConditions, 'all')!;
        const expected = FishingEngine.getRating(result.score);
        expect(result.rating).toBe(expected);
    });
});

// ── FishingEngine.getDailyRating ──────────────────────────────

describe('FishingEngine.getDailyRating', () => {
    it('returns a valid Rating string', () => {
        const rating = FishingEngine.getDailyRating(baseConditions);
        expect(['excellent', 'good', 'fair', 'poor']).toContain(rating);
    });

    it('rates poor conditions lower than good conditions', () => {
        const poor: DayConditions = {
            ...baseConditions,
            windSpeed:     40,
            pressure:      985,
            pressureTrend: 'falling',
            tempMax:       50,
        };
        const good: DayConditions = {
            ...baseConditions,
            windSpeed:     3,
            pressure:      1025,
            pressureTrend: 'rising',
            tempMax:       78,
        };

        const poorRating = FishingEngine.getDailyRating(poor);
        const goodRating = FishingEngine.getDailyRating(good);

        const order = ['poor', 'fair', 'good', 'excellent'];
        expect(order.indexOf(goodRating)).toBeGreaterThan(order.indexOf(poorRating));
    });
});

// ── fmtHour ───────────────────────────────────────────────────

describe('fmtHour', () => {
    it('formats midnight (0) as 12:00 AM', () => {
        expect(fmtHour(0)).toBe('12:00 AM');
    });

    it('formats noon (12) as 12:00 PM', () => {
        expect(fmtHour(12)).toBe('12:00 PM');
    });

    it('formats morning hours as AM', () => {
        expect(fmtHour(6)).toBe('6:00 AM');
        expect(fmtHour(11)).toBe('11:00 AM');
    });

    it('formats afternoon/evening hours as PM', () => {
        expect(fmtHour(13)).toBe('1:00 PM');
        expect(fmtHour(18)).toBe('6:00 PM');
        expect(fmtHour(23)).toBe('11:00 PM');
    });
});
