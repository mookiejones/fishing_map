const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface WindTimeLabel {
    /** `Wed 28` */
    day:  string;
    /** `10 PM` */
    hour: string;
}

/** Splits a `YYYY-MM-DDTHH:MM` local timestamp into slider labels. */
export default function formatWindTime(iso: string): WindTimeLabel {
    const year = Number(iso.slice(0, 4));
    const month = Number(iso.slice(5, 7));
    const day = Number(iso.slice(8, 10));
    let hour = Number(iso.slice(11, 13));
    if (!Number.isFinite(hour)) hour = 0;
    if (hour === 24) hour = 0;
    const weekday = DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? '';
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const suffix = hour < 12 ? 'AM' : 'PM';
    return {
        day:  `${weekday} ${day}`,
        hour: `${h12} ${suffix}`,
    };
}
