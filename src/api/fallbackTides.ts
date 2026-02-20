    import {CONFIG} from '../config';
import type {
    TideEvent, TideType
    ,
} from '../types';
// ── Fallbacks when APIs are unavailable ────────────────────────

    /**
     * Generates synthetic tide data for the forecast period.
     *
     * Models Brevard County's mixed semidiurnal pattern by shifting the base
     * high tide time ~50 minutes per day. Used when the NOAA API is unavailable.
     *
     * @returns Fallback tide events grouped by "YYYY-MM-DD" date key.
     */
    function fallbackTides(): Record<string, TideEvent[]> {
        const tides: Record<string, TideEvent[]> = {};
        const today = new Date();

        for (let d = 0; d < CONFIG.FORECAST_DAYS; d++) {
            const date    = new Date(today);
            date.setDate(date.getDate() + d);
            const dateStr = date.toISOString().slice(0, 10);

            // Brevard County has a mixed semidiurnal pattern; shift ~50 min/day
            const shift = (d * 0.83) % 24;
            const h0    = (6 + shift) % 24;

            tides[dateStr] = [
                { hour: Math.floor(h0),             minute: 0,  height: 1.1,  type: 'H' as TideType },
                { hour: Math.floor((h0 + 6)  % 24), minute: 20, height: -0.1, type: 'L' as TideType },
                { hour: Math.floor((h0 + 12) % 24), minute: 45, height: 0.9,  type: 'H' as TideType },
                { hour: Math.floor((h0 + 18) % 24), minute: 55, height: 0.0,  type: 'L' as TideType },
            ].filter(t => t.hour >= 0 && t.hour < 24);
        }

        return tides;
    }

    export default fallbackTides;