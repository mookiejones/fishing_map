import type { WindParticle } from './types';

const MILES_PER_DEG_LAT = 69;
const TRAIL_LIMIT = 28;

/**
 * Advances a particle by `visualHours` of exaggerated travel.
 * Real wind would crawl a few pixels a minute; the exaggeration keeps
 * the flow readable. The trail stores geographic positions, not pixels.
 */
export default function stepParticle(
    particle: WindParticle,
    sample: { u: number; v: number } | null,
    visualHours: number,
): void {
    particle.trail.push({ lat: particle.lat, lng: particle.lng });
    if (particle.trail.length > TRAIL_LIMIT) particle.trail.shift();

    if (sample && visualHours > 0) {
        const hours = visualHours * particle.speedScale;
        const milesPerDegLng = Math.max(1, MILES_PER_DEG_LAT * Math.cos((particle.lat * Math.PI) / 180));
        particle.lat += (sample.v / MILES_PER_DEG_LAT) * hours;
        particle.lng += (sample.u / milesPerDegLng) * hours;
    }
    particle.age += 1;
}
