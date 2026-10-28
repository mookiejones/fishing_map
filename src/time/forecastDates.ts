/**
 * Calendar dates for the forecast window in a real timezone.
 *
 * `Date#toISOString()` is UTC. After 20:00 EDT that date is already
 * tomorrow, so a NOAA `begin_date` built from it skips the local fishing day.
 * These keys match Open-Meteo's `America/New_York` daily stamps.
 */
export function forecastDates(
    count: number,
    now: Date = new Date(),
    timeZone: string = 'America/New_York',
): string[] {
    const start = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);

    const noonUtc = new Date(`${start}T12:00:00Z`);
    return Array.from({ length: count }, (_, i) => {
        const day = new Date(noonUtc);
        day.setUTCDate(noonUtc.getUTCDate() + i);
        return day.toISOString().slice(0, 10);
    });
}
