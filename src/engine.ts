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

export const FishingEngine = {

    // ── Main entry: rate a spot for a given day's conditions ────────
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

    // ── Wind: 0–25 pts ─────────────────────────────────────────────
    // Lower wind = calmer water, better sight-fishing visibility.
    scoreWind(mph: number): number {
        if (mph < 5)  return 25;
        if (mph < 10) return 20;
        if (mph < 15) return 13;
        if (mph < 20) return 6;
        if (mph < 25) return 2;
        return 0;
    },

    // ── Barometric Pressure: 0–25 pts ──────────────────────────────
    // Rising high pressure = active fish feeding near the surface.
    // A falling barometer drives fish deep and suppresses feeding.
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

    // ── Tides: 0–30 pts ────────────────────────────────────────────
    // Tide changes create current that concentrates bait and predators.
    // Preferred tide type during prime hours (dawn/dusk) scores highest.
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

    // ── Temperature: 0–20 pts ──────────────────────────────────────
    // Uses air temp as a proxy for water temp (FL water is ~3°F cooler).
    // Each species has an optimal thermal comfort range.
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

    // ── Daily aggregate rating for the sidebar day cards ───────────
    getDailyRating(conditions: DayConditions): Rating {
        const wind     = this.scoreWind(conditions.windSpeed);
        const pressure = this.scorePressure(conditions.pressure, conditions.pressureTrend);
        const temp     = Math.max(5, 15 - Math.abs(conditions.tempMax - 78) * 0.4);
        const tides    = conditions.tides.length > 0 ? 14 : 12;

        return this.getRating(wind + pressure + temp + tides);
    },

    // ── Helpers ────────────────────────────────────────────────────
    getRating(score: number): Rating {
        if (score >= 78) return 'excellent';
        if (score >= 57) return 'good';
        if (score >= 37) return 'fair';
        return 'poor';
    },

    getRatingColor(rating: Rating): string {
        const colors: Record<Rating, string> = {
            excellent: '#00c851',
            good:      '#ffc107',
            fair:      '#ff7a00',
            poor:      '#f44336',
        };
        return colors[rating];
    },

    // Suggest the best fishing window based on tides and spot preference
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

export function fmtHour(h: number): string {
    const display = h % 12 || 12;
    return `${display}:00 ${h < 12 ? 'AM' : 'PM'}`;
}
