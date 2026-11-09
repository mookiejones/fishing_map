import { FISHING_SPOTS } from '../spots';
import { FishingEngine } from '../engine';
import { conditionsForWindow } from '../utils/conditionsForWindow';
import type {
    DayConditions, FishingSpot, Rating, SelectedSpecies, TideEvent, WeatherDay,
} from '../types';

export interface DayScore {
    score: number;
    rating: Rating;
    period: 'dawn' | 'dusk';
    conditions: DayConditions;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid]!;
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/**
 * Day-card score. Each spot is rated with `rateSpot` at dawn and at dusk,
 * and the card shows the median of those best scores. Same formula as the
 * markers, so the chip and the pins cannot drift apart.
 */
export function rateDay(
    day: WeatherDay,
    tides: TideEvent[],
    species: SelectedSpecies,
    spots: FishingSpot[] = FISHING_SPOTS,
): DayScore {
    const periods = ['dawn', 'dusk'] as const;
    let best: DayScore | null = null;

    for (const period of periods) {
        const conditions = conditionsForWindow(day, period, tides);
        const scores: number[] = [];
        for (const spot of spots) {
            const targets = species === 'all'
                ? spot.species
                : spot.species.includes(species) ? [species] : [];
            let spotBest = -1;
            for (const target of targets) {
                const result = FishingEngine.rateSpot(spot, conditions, target);
                if (result && result.score > spotBest) spotBest = result.score;
            }
            if (spotBest >= 0) scores.push(spotBest);
        }
        if (scores.length === 0) continue;
        const score = median(scores);
        if (!best || score > best.score) {
            best = { score, rating: FishingEngine.getRating(score), period, conditions };
        }
    }

    if (best) return best;
    const conditions = conditionsForWindow(day, 'dawn', tides);
    return { score: 0, rating: 'poor', period: 'dawn', conditions };
}
