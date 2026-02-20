// ============================================================
// engine.ts — Fishing condition scoring engine
// ============================================================
// Scoring breakdown (100 pts total):
//   Wind speed    0–25 pts  (lower wind = better sight fishing & calmer water)
//   Barometric    0–25 pts  (rising high pressure = actively feeding fish)
//   Tides         0–30 pts  (preferred tide type + prime dawn/dusk alignment)
//   Temperature   0–20 pts  (species-specific thermal comfort range)
// ============================================================

import type {
    FishingSpot, DayConditions, SelectedSpecies, Species,
    SpotScores, SpotResult, TideEvent, Rating, PressureTrend,
} from './types';

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
            wind:        this.scoreWind(conditions.windSpeed),
            pressure:    this.scorePressure(conditions.pressure, conditions.pressureTrend),
            tides:       this.scoreTides(conditions.tides, spot),
            temperature: this.scoreTemperature(conditions.tempMax, primarySpecies),
        };

        const total  = scores.wind + scores.pressure + scores.tides + scores.temperature;
        const rating = this.getRating(total);

        return {
            score:    Math.round(Math.min(100, total)),
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
     * Scores the day's tides on a 0–30 point scale.
     *
     * Scoring components:
     * - **Activity** (0–8): more tide events → more tidal flushing → higher score.
     * - **Preference** (5 or 12): whether the spot's preferred tide type occurs.
     * - **Prime bonus** (0 or 10): whether the preferred tide falls in a dawn or
     *   dusk window (5–9 h or 16–20 h local time).
     *
     * Returns 14 (neutral) when no tides are available.
     *
     * @param tides - Hi-lo tide schedule for the day.
     * @param spot  - The fishing spot (provides `tidePreference`).
     * @returns Tides sub-score (0–30).
     */
    scoreTides(tides: TideEvent[], spot: FishingSpot): number {
        if (tides.length === 0) return 14;

        // Points for having multiple tide events (tidal flushing activity)
        const activityScore = Math.min(8, tides.length * 2);

        // Points for preferred tide type occurring anywhere in the day
        const hasPreferred = tides.some(t =>
            spot.tidePreference === 'incoming' ? t.type === 'H' : t.type === 'L',
        );
        const preferenceScore = hasPreferred ? 12 : 5;

        // Bonus when the preferred tide falls during prime feeding windows
        const primeBonus = this.primeTideBonus(tides, spot);

        return Math.min(30, activityScore + preferenceScore + primeBonus);
    },

    /**
     * Returns 10 if any preferred tide event falls within a prime feeding window
     * (dawn: 5–9 h, dusk: 16–20 h), otherwise 0.
     *
     * @param tides - Hi-lo tide schedule for the day.
     * @param spot  - The fishing spot (provides `tidePreference`).
     * @returns 10 or 0.
     */
    primeTideBonus(tides: TideEvent[], spot: FishingSpot): number {
        for (const t of tides) {
            const isDawn = t.hour >= 5 && t.hour <= 9;
            const isDusk = t.hour >= 16 && t.hour <= 20;
            const isPreferred = spot.tidePreference === 'incoming'
                ? t.type === 'H'
                : t.type === 'L';

            if (isPreferred && (isDawn || isDusk)) return 10;
        }
        return 0;
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
            tarpon:  { min: 70, optimal: 82, max: 94 },
            snook:   { min: 58, optimal: 75, max: 90 },
            redfish: { min: 48, optimal: 70, max: 88 },
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
     * Produces a single aggregate `Rating` for a day card in the sidebar.
     *
     * Uses a simplified temperature proxy (distance from a 78 °F target)
     * rather than per-species scoring, since no species is selected at this level.
     *
     * @param conditions - Weather and tide conditions for the day.
     * @returns A `Rating` string ('excellent' | 'good' | 'fair' | 'poor').
     */
    getDailyRating(conditions: DayConditions): Rating {
        const wind     = this.scoreWind(conditions.windSpeed);
        const pressure = this.scorePressure(conditions.pressure, conditions.pressureTrend);
        const temp     = Math.max(5, 15 - Math.abs(conditions.tempMax - 78) * 0.4);
        const tides    = conditions.tides.length > 0 ? 14 : 12;

        return this.getRating(wind + pressure + temp + tides);
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
     * Suggests the best fishing window as a human-readable string.
     *
     * Priority order:
     * 1. Preferred tide type during a prime window (dawn or dusk) →
     *    e.g. "Dawn tide (~6:00 AM)"
     * 2. Any preferred tide at any time →
     *    e.g. "Around 11:00 AM (high tide)"
     * 3. No preferred tide in the schedule → "Dawn and dusk periods"
     * 4. No tides at all → "Dawn and dusk periods"
     *
     * @param tides - Hi-lo tide schedule for the day.
     * @param spot  - The fishing spot (provides `tidePreference`).
     * @returns A descriptive string shown in the SpotDrawer.
     */
    getBestTime(tides: TideEvent[], spot: FishingSpot): string {
        if (tides.length === 0) return 'Dawn and dusk periods';

        const isPreferred = (t: TideEvent): boolean =>
            spot.tidePreference === 'incoming' ? t.type === 'H' : t.type === 'L';

        // Ideal: preferred tide during a prime window
        for (const t of tides) {
            if (!isPreferred(t)) continue;
            if (t.hour >= 5  && t.hour <= 9)  return `Dawn tide (~${fmtHour(t.hour)})`;
            if (t.hour >= 16 && t.hour <= 20) return `Dusk tide (~${fmtHour(t.hour)})`;
        }

        // Fall back to any preferred tide
        const pref = tides.find(isPreferred);
        if (pref) {
            const label = pref.type === 'H' ? 'high' : 'low';
            return `Around ${fmtHour(pref.hour)} (${label} tide)`;
        }

        return 'Dawn and dusk periods';
    },
};

/**
 * Formats a 24-hour integer as a 12-hour clock string with AM/PM.
 *
 * Minutes are always shown as `:00` — this is intentional since the function
 * is used with whole-hour tide event times.
 *
 * @param h - Hour in 24-hour format (0–23).
 * @returns Formatted time string, e.g. `'6:00 AM'` or `'12:00 PM'`.
 */
export function fmtHour(h: number): string {
    const display = h % 12 || 12;
    return `${display}:00 ${h < 12 ? 'AM' : 'PM'}`;
}
