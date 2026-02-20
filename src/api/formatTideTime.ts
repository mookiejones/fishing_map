import { TideEvent } from '../types';
/**
     * Formats a tide event time object as a 12-hour AM/PM string.
     *
     * @param event - An object with `hour` (0–23) and `minute` (0–59).
     * @returns A formatted string such as `'6:30 AM'` or `'12:05 PM'`.
     */
    function formatTideTime({ hour, minute }: Pick<TideEvent, 'hour' | 'minute'>): string {
        const h    = hour % 12 || 12;
        const m    = String(minute).padStart(2, '0');
        const ampm = hour < 12 ? 'AM' : 'PM';
        return `${h}:${m} ${ampm}`;
    }

    export default formatTideTime;