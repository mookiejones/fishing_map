import {CONFIG} from '../config';
import type {
    TideEvent, 
    NoaaResponse,
} from '../types';
import fallbackTides from './fallbackTides';
import processTides from './processTides';
/**
     * Fetches NOAA hi-lo tide predictions for the forecast period.
     *
     * Uses `CONFIG.NOAA_STATION` (Port Canaveral). If the NOAA API returns an
     * error payload, falls back to `fallbackTides()`.
     *
     * @throws If the HTTP response status is not OK.
     * @returns Tide events grouped by "YYYY-MM-DD" date key.
     */

    const fetchTides= async ():Promise<Record<string,TideEvent[]>  > => {

        const today   = new Date();
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + CONFIG.FORECAST_DAYS - 1);

        const fmt = (d: Date): string => d.toISOString().slice(0, 10).replace(/-/g, '');

        const params = new URLSearchParams({
            begin_date:  fmt(today),
            end_date:    fmt(endDate),
            station:     CONFIG.NOAA_STATION,
            product:     'predictions',
            datum:       'MLLW',
            time_zone:   'lst',     // Local Standard Time
            interval:    'hilo',    // Hi/Lo events only
            units:       'english',
            application: 'fishing_hotspot_map',
            format:      'json',
        });

        const res = await fetch(
            `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?${params}`,
        );
        if (!res.ok) throw new Error(`NOAA API returned ${res.status}`);

        const data = await res.json() as NoaaResponse;

        if (data.error ?? !data.predictions) {
            console.warn('[WeatherAPI] NOAA error:', data.error?.message);
            return fallbackTides();
        }

        return processTides(data.predictions!);

    }

    export default fetchTides;