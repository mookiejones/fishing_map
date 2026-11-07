import formatWindTime from './formatWindTime';

export interface DayTick {
    /** First hour index of this calendar day in the series. */
    start: number;
    /** Last hour index of this calendar day in the series. */
    end:   number;
    label: string;
}

/**
 * Groups forecast hours by calendar day. The slider gives each group a
 * share of the track proportional to how many hours it contains, so a
 * two-hour stub at the start cannot sit on top of the next day.
 */
export default function dayTickIndexes(times: readonly string[]): DayTick[] {
    const groups: DayTick[] = [];
    times.forEach((iso, index) => {
        const key = iso.slice(0, 10);
        const last = groups[groups.length - 1];
        if (!last || !times[last.start]?.startsWith(key)) {
            groups.push({ start: index, end: index, label: formatWindTime(iso).day });
            return;
        }
        last.end = index;
    });
    return groups;
}
