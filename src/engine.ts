// ============================================================
// engine.ts — Fishing condition scoring engine
// ============================================================
// Scoring breakdown (115 pts max, capped at 100):
//   Wind speed      0–25 pts  (lower wind = better sight fishing & calmer water)
//   Barometric      0–25 pts  (rising high pressure = actively feeding fish)
//   Water movement  0–20 pts  (IRL is wind-driven, not tidal — env. shift scoring)
//   Temperature     0–20 pts  (species-specific thermal comfort range)
//   Wind direction  0–10 pts  (SE/E winds push water onto flats)
//   Cold front      0–10 pts  (falling pressure + northerly wind shuts down feeding)
//   Precipitation   0– 5 pts  (heavy rain = reduced water clarity)
// ============================================================

import type {
    FishingSpot, DayConditions, SelectedSpecies, Species,
    SpotScores, SpotResult, TideEvent, Rating, PressureTrend,
} from './types';
import { bestPhase, primeOverlap, PRIME_WINDOWS } from './engine/tidePhase';

/** Lagoon flat used when a day rating has no specific spot. */
const REFERENCE_FLAT: FishingSpot = {
    id: 'day-reference',
    name: 'Lagoon reference',
    lat: 28.35,
    lng: -80.67,
    species: ['snook', 'redfish', 'tarpon', 'black drum', 'speckled trout'],
    description: '',
    features: ['flats'],
    tidePreference: 'incoming',
    tideRegime: 'lagoon',
    tips: [],
};

/**
 * Pure scoring engine with no external dependencies or side effects.
 *
 * All methods are synchronous and deterministic — the same inputs always
 * produce the same outputs, making them straightforward to unit-test.
 */
export const FishingEngine = {

    /**
     * Scores a single spot against one day's conditions for a given species filter.
     *
     * Returns `null` when the spot does not target the selected species,
     * which signals the caller to omit a marker for that (spot × species) pair.
     *
     * @param spot            - The fishing location to evaluate.
     * @param conditions      - Weather and tide conditions for the day.
     * @param selectedSpecies - The active species filter ('all' to include all spots).
     * @returns A `SpotResult` with score, rating, color, sub-scores, and best time,
     *          or `null` if the spot is excluded by the species filter.
     */
    rateSpot(
        spot: FishingSpot,
        conditions: DayConditions,
        selectedSpecies: SelectedSpecies,
    ): SpotResult | null {
        // Exclude spots that don't target the selected species
        if (selectedSpecies !== 'all' && !spot.species.includes(selectedSpecies)) {
            return null;
        }

        // Use the selected species (or the spot's primary species) for temp scoring
        const primarySpecies: Species =
            selectedSpecies !== 'all' ? selectedSpecies : spot.species[0]!;

        const scores: SpotScores = {
            wind:          this.scoreWind(conditions.windSpeed),
            pressure:      this.scorePressure(conditions.pressure, conditions.pressureTrend),
            tides:         this.scoreWaterMovement(conditions.tides, conditions, spot),
            temperature:   this.scoreTemperature(conditions.tempMax, primarySpecies),
            windDirection: this.scoreWindDirection(conditions.windDir),
            coldFront:     this.scoreColdFront(conditions.pressureTrend, conditions.windDir),
            precipitation: this.scorePrecipitation(conditions.precipitation),
        };

        const total  = scores.wind + scores.pressure + scores.tides + scores.temperature
                     + scores.windDirection + scores.coldFront + scores.precipitation;
        const score  = Math.round(Math.min(100, total));
        const rating = this.getRating(score);

        return {
            score,
            rating,
            color:    this.getRatingColor(rating),
            scores,
            bestTime: this.getBestTime(conditions.tides, spot),
        };
    },

    /**
     * Scores wind speed on a 0–25 point scale.
     *
     * Lower wind means calmer water and better sight-fishing visibility.
     * Scores step down in fixed bands: calm (<5 mph) = 25, gale (≥25 mph) = 0.
     *
     * @param mph - Maximum wind speed in miles per hour.
     * @returns Wind sub-score (0–25).
     */
    scoreWind(mph: number): number {
        if (mph < 5)  return 25;
        if (mph < 10) return 20;
        if (mph < 15) return 13;
        if (mph < 20) return 6;
        if (mph < 25) return 2;
        return 0;
    },

    /**
     * Scores barometric pressure on a 0–25 point scale.
     *
     * Rising high pressure correlates with active surface feeding; a falling
     * barometer suppresses feeding and drives fish deeper. The base score is
     * determined by the absolute pressure band, then adjusted by a trend bonus
     * (+4 rising, +1 stable, −6 falling). The result is clamped to [0, 25].
     *
     * @param hPa  - Average surface pressure in hectopascals.
     * @param trend - Barometric trend direction for the day.
     * @returns Pressure sub-score (0–25).
     */
    scorePressure(hPa: number, trend: PressureTrend): number {
        let base: number;
        if      (hPa >= 1023) base = 21;   // High pressure
        else if (hPa >= 1015) base = 17;   // Moderate-high
        else if (hPa >= 1008) base = 11;   // Near-normal
        else if (hPa >= 1000) base = 6;    // Low
        else                  base = 2;    // Very low / storm

        const trendBonus: Record<PressureTrend, number> = {
            rising:  4,
            stable:  1,
            falling: -6,
        };

        return Math.max(0, Math.min(25, base + trendBonus[trend]));
    },

    /**
     * Points for the preferred moving tide, capped by how much ocean tide
     * the spot actually sees. Tide height is ignored: a 5 ft Trident Pier
     * high is not a 5 ft tide on a Mosquito Lagoon flat.
     *
     * micro 0–4, lagoon 0–8, inlet 0–12.
     */
    scoreTides(tides: TideEvent[], spot: FishingSpot): number {
        const cap = spot.tideRegime === 'micro' ? 4 : spot.tideRegime === 'inlet' ? 12 : 8;
        const phase = bestPhase(tides, spot.tidePreference);
        if (!phase) return 0;
        const overlap = primeOverlap(phase);
        if (overlap >= 90) return cap;
        if (overlap >= 30) return Math.round(cap * 0.75);
        const duringDay = phase.endMin > 0 && phase.startMin < 24 * 60;
        return duringDay ? Math.round(cap * 0.4) : 0;
    },

    /**
     * Scores water temperature on a 0–20 point scale for a given species.
     *
     * Air temperature is used as a proxy for water temperature; Florida
     * inshore water runs roughly 3 °F cooler than air. Each species has an
     * optimal water temperature where it scores 20. Scores decay linearly
     * with distance from optimal, flooring at 5 within the comfort range
     * and falling to 0 when the temperature exceeds the species' min/max.
     *
     * @param airTempF - Daily high air temperature in °F.
     * @param species  - Target species being scored.
     * @returns Temperature sub-score (0–20).
     */
    scoreTemperature(airTempF: number, species: Species): number {
        const waterTempF = airTempF - 3;

        const ranges: Record<Species, { min: number; optimal: number; max: number }> = {
            tarpon:          { min: 70, optimal: 82, max: 94 },
            snook:           { min: 58, optimal: 75, max: 90 },
            redfish:         { min: 48, optimal: 70, max: 88 },
            'black drum':    { min: 45, optimal: 68, max: 85 },
            'speckled trout':{ min: 45, optimal: 68, max: 82 },
        };

        const r = ranges[species];

        if (waterTempF < r.min || waterTempF > r.max) {
            const overshoot = waterTempF < r.min
                ? r.min - waterTempF
                : waterTempF - r.max;
            return Math.max(0, 8 - overshoot);
        }

        const distFromOptimal = Math.abs(waterTempF - r.optimal);
        return Math.max(5, Math.round(20 - distFromOptimal * 0.75));
    },

    /**
     * East to southeast wind pushes water onto the western flats. A northeast
     * sea breeze (about 25–70°) is everyday fishable wind on this coast, not
     * a north wind. Only northwest through north (300–360 and 0–25°) is the
     * cold-front direction.
     */
    scoreWindDirection(windDir: number): number {
        const d = normalizeDir(windDir);
        if (d >= 70 && d < 150) return 10;
        if (d >= 40 && d < 70)  return 7;
        if (d >= 25 && d < 40)  return 5;
        if (d >= 150 && d < 200) return 6;
        if (d >= 200 && d < 250) return 4;
        if (d >= 250 && d < 300) return 2;
        return 0;
    },

    /**
     * Scores cold-front risk, 0–10. Higher means no front.
     *
     * A front is falling pressure together with a northwest or north wind.
     * Northeast wind is not that wind. The pressure trend itself has to be a
     * real day-over-day change; the afternoon dip is removed upstream.
     */
    scoreColdFront(trend: PressureTrend, windDir: number): number {
        const isNortherly = isFrontWind(windDir);
        if (trend === 'falling' && isNortherly) return 0;
        if (trend === 'rising'  && isNortherly) return 4;
        if (trend === 'falling' && !isNortherly) return 6;
        return 10;
    },

    /**
     * Scores precipitation on a 0–5 point scale.
     *
     * Heavy rainfall washes tannins and sediment into the lagoon, reducing water
     * clarity and suppressing sight-fishing and surface feeding.
     *
     * @param precipIn - Total daily precipitation in inches.
     * @returns Precipitation sub-score (0–5).
     */
    scorePrecipitation(precipIn: number): number {
        if (precipIn < 0.10) return 5;   // No rain — ideal clarity
        if (precipIn < 0.25) return 3;   // Light rain — manageable
        if (precipIn < 0.50) return 1;   // Moderate — murky water
        return 0;                         // Heavy rain — poor visibility
    },

    /**
     * Water movement, 0–20. Wind is shared. Tide timing is weighted by regime
     * so an ocean station cannot outscore a microtidal flat.
     */
    scoreWaterMovement(tides: TideEvent[], conditions: DayConditions, spot: FishingSpot): number {
        const timing = this.scoreTides(tides, spot);
        const pressureActivity = conditions.pressureTrend !== 'stable' ? 6 : 2;
        const { windSpeed } = conditions;
        const windMovement = windSpeed >= 5 && windSpeed <= 18 ? 8
            : windSpeed < 5 ? 4
            : 2;

        if (spot.tideRegime === 'inlet') {
            return Math.min(20, timing + windMovement);
        }
        if (spot.tideRegime === 'micro') {
            return Math.min(20, timing + pressureActivity + windMovement);
        }
        return Math.min(20, timing + Math.round(pressureActivity / 2) + windMovement);
    },

    /**
     * Day-card rating. Same `rateSpot` formula as the markers, on a lagoon
     * reference flat. Species `"all"` uses snook as the thermal reference
     * only here; the sidebar's day chip uses `rateDay`, which medians the
     * real spots.
     */
    getDailyRating(conditions: DayConditions, species: SelectedSpecies = 'all'): Rating {
        const scoredSpecies = species === 'all' ? 'snook' : species;
        return this.rateSpot(REFERENCE_FLAT, conditions, scoredSpecies)!.rating;
    },

    /**
     * Maps a numeric score to a `Rating` string.
     *
     * Thresholds: ≥78 excellent · ≥57 good · ≥37 fair · <37 poor.
     *
     * @param score - Aggregate score (typically 0–100).
     * @returns The corresponding `Rating`.
     */
    getRating(score: number): Rating {
        if (score >= 78) return 'excellent';
        if (score >= 57) return 'good';
        if (score >= 37) return 'fair';
        return 'poor';
    },

    /**
     * Returns the hex color associated with a `Rating`.
     *
     * Colors match the MUI theme palette and the map marker fill colors:
     * excellent = #00c851 (green), good = #ffc107 (amber),
     * fair = #ff7a00 (orange), poor = #f44336 (red).
     *
     * @param rating - A `Rating` string.
     * @returns A six-character hex color string, e.g. '#00c851'.
     */
    getRatingColor(rating: Rating): string {
        const colors: Record<Rating, string> = {
            excellent: '#00c851',
            good:      '#ffc107',
            fair:      '#ff7a00',
            poor:      '#f44336',
        };
        return colors[rating];
    },

    /**
     * Names the moving water, not the slack turn.
     *
     * Incoming is the rise that ends at high water. Outgoing is the fall
     * that ends at low water. Minutes are kept. A limb that overlaps
     * dawn (05:00–09:00) or dusk (16:00–20:00) is labeled with that period.
     */
    getBestTime(tides: TideEvent[], spot: FishingSpot): string {
        if (tides.length === 0) return 'Dawn and dusk periods';

        const phase = bestPhase(tides, spot.tidePreference);
        if (!phase) {
            return spot.tideRegime === 'micro'
                ? 'Dawn and dusk — wind-driven flat'
                : 'Dawn and dusk periods';
        }

        // Incoming ends at high water. Outgoing ends at low water.
        const verb = phase.kind === 'incoming' ? 'Incoming until' : 'Outgoing until';
        const clock = fmtHour(Math.floor(modDay(phase.endMin) / 60), modDay(phase.endMin) % 60);
        if (spot.tideRegime === 'micro') {
            return `Wind-driven flat. Weak ${verb.toLowerCase()} ${clock}`;
        }
        const dawn = overlapWith(phase, PRIME_WINDOWS[0]!);
        const dusk = overlapWith(phase, PRIME_WINDOWS[1]!);
        if (dawn >= 30 || dusk >= 30) {
            const period = dawn >= dusk ? 'Dawn' : 'Dusk';
            return `${period}: ${verb} ${clock}`;
        }
        return `${verb} ${clock}`;
    },
};

function normalizeDir(windDir: number): number {
    return ((windDir % 360) + 360) % 360;
}

/** Northwest through north. Northeast sea breeze is excluded. */
function isFrontWind(windDir: number): boolean {
    const d = normalizeDir(windDir);
    return d >= 300 || d < 25;
}

function modDay(minutes: number): number {
    return ((minutes % 1440) + 1440) % 1440;
}

function overlapWith(
    phase: { startMin: number; endMin: number },
    window: { start: number; end: number },
): number {
    return Math.max(0, Math.min(phase.endMin, window.end) - Math.max(phase.startMin, window.start));
}

/**
 * Formats a clock time as a 12-hour string.
 *
 * @param h - Hour in 24-hour format (0–23).
 * @param minute - Minute (0–59). Defaults to 0.
 * @returns Formatted time string, e.g. `'6:45 AM'` or `'12:00 PM'`.
 */
export function fmtHour(h: number, minute = 0): string {
    const display = h % 12 || 12;
    const m = String(minute).padStart(2, '0');
    return `${display}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}
