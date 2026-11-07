/**
 * Particle budget from the viewport area.
 * Phones get fewer, shorter-lived streaks so the frame stays under a couple
 * of milliseconds; a desktop map tops out before the trails become noise.
 */
export default function pickParticleCount(
    width: number,
    height: number,
    coarsePointer: boolean,
): number {
    if (width <= 0 || height <= 0) return 0;
    const divisor = coarsePointer ? 3400 : 2100;
    const raw = Math.round((width * height) / divisor);
    const cap = coarsePointer ? 240 : 460;
    return Math.max(0, Math.min(cap, raw));
}
