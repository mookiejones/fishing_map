import { TideEvent,NoaaPrediction } from "../types";
/**
     * Groups raw NOAA prediction rows by date and converts time strings to
     * plain `{hour, minute}` numbers.
     *
     * Time strings are parsed manually (not via `new Date()`) to avoid
     * browser timezone misinterpretation of the station's local time values.
     *
     * @param predictions - Array of raw `NoaaPrediction` rows from NOAA.
     * @returns Tide events grouped by "YYYY-MM-DD" date key.
     */
    function processTides(predictions: NoaaPrediction[]): Record<string, TideEvent[]> {
        const byDate: Record<string, TideEvent[]> = {};

        for (const p of predictions) {
            // p.t format: "YYYY-MM-DD HH:MM"
            const spaceIdx  = p.t.indexOf(' ');
            const datePart  = p.t.slice(0, spaceIdx);
            const timePart  = p.t.slice(spaceIdx + 1);
            const colonIdx  = timePart.indexOf(':');
            const hour      = parseInt(timePart.slice(0, colonIdx), 10);
            const minute    = parseInt(timePart.slice(colonIdx + 1), 10);

            if (!byDate[datePart]) byDate[datePart] = [];
            byDate[datePart]!.push({
                hour,
                minute,
                height: parseFloat(p.v),
                type:   p.type,
            });
        }

        return byDate;
    }

    export default processTides;