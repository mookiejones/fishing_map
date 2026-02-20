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
            tides:         this.scoreWaterMovement(conditions.tides, conditions),
            temperature:   this.scoreTemperature(conditions.tempMax, primarySpecies),
            windDirection: this.scoreWindDirection(conditions.windDir),
            coldFront:     this.scoreColdFront(conditions.pressureTrend, conditions.windDir),
            precipitation: this.scorePrecipitation(conditions.precipitation),
        };

        const total  = scores.wind + scores.pressure + scores.tides + scores.temperature
                     + scores.windDirection + scores.coldFront + scores.precipitation;
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
     * Scores wind direction on a 0–10 point scale for Indian River Lagoon fishing.
     *
     * The IRL is a wind-driven system. SE/E winds push water onto the western grass
     * flats, improving depth and visibility. N/NW winds blow water off the flats,
     * drop water levels, and commonly accompany cold fronts.
     *
     * @param windDir - Dominant wind direction in meteorological degrees (0–360, 0/360 = N).
     * @returns Wind direction sub-score (0–10).
     */
    scoreWindDirection(windDir: number): number {
        if (windDir >= 90  && windDir <= 160) return 10;  // E to SE — ideal for IRL flats
        if (windDir >= 60  && windDir <= 200) return 7;   // NE to S — generally good
        if (windDir >= 200 && windDir <= 250) return 4;   // SSW to WSW — neutral
        if (windDir >= 250 && windDir <= 290) return 2;   // W to WNW — unfavorable
        return 0;  // NW through N to NNE (>290 or <60) — worst; cold-front direction
    },

    /**
     * Scores cold-front risk on a 0–10 point scale.
     *
     * Active cold fronts are the single biggest fishing killer in Florida inshore
     * waters. Falling pressure combined with northerly winds signals an approaching
     * or active front. Post-front high pressure + northerly winds means water has
     * cooled and fish are lethargic.
     *
     * @param trend   - Barometric pressure trend for the day.
     * @param windDir - Dominant wind direction in degrees.
     * @returns Cold front sub-score (0–10). Higher = no front present.
     */
    scoreColdFront(trend: PressureTrend, windDir: number): number {
        const isNortherly = windDir > 290 || windDir < 60;  // NW through N to NNE
        if (trend === 'falling' && isNortherly) return 0;   // Active front — worst
        if (trend === 'rising'  && isNortherly) return 4;   // Post-front recovery
        if (trend === 'falling' && !isNortherly) return 6;  // Pre-front push — brief bite
        return 10;  // Stable/rising + non-northerly — normal or improving conditions
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
     * Scores water movement on a 0–20 point scale for the Indian River Lagoon.
     *
     * The IRL is a microtidal estuary (tidal range < 1 ft); water movement is
     * primarily driven by wind and barometric pressure changes rather than lunar
     * tides. This method uses NOAA hi-lo data only as a minor supplement while
     * weighting wind-driven and pressure-driven movement more heavily.
     *
     * Scoring components:
     * - **Tidal activity** (0–4): number of NOAA tide events as a proxy for minor
     *   water flushing through inlet connections.
     * - **Pressure activity** (0–8): any pressure change (rising or falling) stirs
     *   the water column and triggers feeding — stable pressure means stagnant water.
     * - **Wind movement** (0–8): moderate wind (5–18 mph) drives productive currents;
     *   too calm = stagnant, too strong = turbid and unfishable.
     *
     * @param tides      - NOAA hi-lo tide schedule (used as minor supplement only).
     * @param conditions - Full day conditions including wind and pressure trend.
     * @returns Water movement sub-score (0–20).
     */
    scoreWaterMovement(tides: TideEvent[], conditions: DayConditions): number {
        // Minor tidal supplement — IRL inlets do exchange some water with the ocean
        const tidalActivity = Math.min(4, tides.length);

        // Any pressure change (rise or fall) drives water level change and fish movement
        const pressureActivity = conditions.pressureTrend !== 'stable' ? 8 : 2;

        // Wind speed drives surface currents; moderate = best, calm or gale = poor
        const { windSpeed } = conditions;
        const windMovement = windSpeed >= 5 && windSpeed <= 18 ? 8
            : windSpeed < 5  ? 4   // too calm — water stagnates
            : 2;                   // too strong — turbidity, angler difficulty

        return Math.min(20, tidalActivity + pressureActivity + windMovement);
    },

    /**
     * Produces a single aggregate `Rating` for a day card in the sidebar.
     *
     * Uses a simplified temperature proxy (distance from a 78 °F target)
     * rather than per-species scoring, since no species is selected at this level.
     * Incorporates cold front and wind direction for a more accurate daily overview.
     *
     * @param conditions - Weather and tide conditions for the day.
     * @returns A `Rating` string ('excellent' | 'good' | 'fair' | 'poor').
     */
    getDailyRating(conditions: DayConditions): Rating {
        const wind      = this.scoreWind(conditions.windSpeed);
        const pressure  = this.scorePressure(conditions.pressure, conditions.pressureTrend);
        const temp      = Math.max(5, 15 - Math.abs(conditions.tempMax - 78) * 0.4);
        const water     = this.scoreWaterMovement(conditions.tides, conditions);
        const windDir   = this.scoreWindDirection(conditions.windDir);
        const coldFront = this.scoreColdFront(conditions.pressureTrend, conditions.windDir);
        const precip    = this.scorePrecipitation(conditions.precipitation);

        return this.getRating(wind + pressure + temp + water + windDir + coldFront + precip);
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
