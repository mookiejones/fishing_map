import { CONFIG } from '../config';
import type { TideEvent, NoaaResponse } from '../types';
import { forecastDates } from '../time/forecastDates';
import processTides from './processTides';

/**
 * Fetches NOAA hi-lo tide predictions for the forecast period.
 *
 * Uses `CONFIG.NOAA_STATION` (Trident Pier, 8721604). Timestamps come back
 * in local clock time (`lst_ldt`), including daylight time, and the date
 * window is the station's local calendar rather than UTC.
 *
 * @throws If the HTTP status is not OK, or NOAA returns an error payload.
 *         Callers decide whether to substitute a synthetic tide.
 */
const fetchTides = async (): Promise<Record<string, TideEvent[]>> => {
    const dates = forecastDates(CONFIG.FORECAST_DAYS);
    const begin = dates[0]!.replace(/-/g, '');
    const end = dates[dates.length - 1]!.replace(/-/g, '');

    const params = new URLSearchParams({
        begin_date:  begin,
        end_date:    end,
        station:     CONFIG.NOAA_STATION,
        product:     'predictions',
        datum:       'MLLW',
        time_zone:   'lst_ldt',
        interval:    'hilo',
        units:       'english',
        application: 'fishing_hotspot_map',
        format:      'json',
    });

    const res = await fetch(
        `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${params}`,
    );
    if (!res.ok) throw new Error(`NOAA API returned ${res.status}`);

    const data = await res.json() as NoaaResponse;
    if (data.error || !data.predictions) {
        throw new Error(data.error?.message ?? 'NOAA returned no predictions');
    }

    return processTides(data.predictions);
};

export default fetchTides;
