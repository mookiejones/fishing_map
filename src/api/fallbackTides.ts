import { CONFIG } from '../config';
import type { TideEvent, TideType } from '../types';
import { forecastDates } from '../time/forecastDates';

/**
 * Generates synthetic tide times for the forecast period.
 *
 * The shape is a mixed semidiurnal schedule shifted ~50 minutes per day.
 * Heights are placeholders. Callers must label this as an estimate — it is
 * not Port Canaveral water.
 */
function fallbackTides(): Record<string, TideEvent[]> {
    const tides: Record<string, TideEvent[]> = {};
    const dates = forecastDates(CONFIG.FORECAST_DAYS);

    dates.forEach((dateStr, d) => {
        const shift = (d * 0.83) % 24;
        const h0 = (6 + shift) % 24;

        tides[dateStr] = [
            { hour: Math.floor(h0),             minute: 0,  height: 1.1, type: 'H' as TideType },
            { hour: Math.floor((h0 + 6)  % 24), minute: 20, height: -0.1, type: 'L' as TideType },
            { hour: Math.floor((h0 + 12) % 24), minute: 45, height: 0.9,  type: 'H' as TideType },
            { hour: Math.floor((h0 + 18) % 24), minute: 55, height: 0.0,  type: 'L' as TideType },
        ].filter(t => t.hour >= 0 && t.hour < 24);
    });

    return tides;
}

export default fallbackTides;
