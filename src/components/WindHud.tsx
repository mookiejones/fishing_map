import { Box } from '@mui/material';
import WindLegend from './WindLegend';
import WindTimeSlider from './WindTimeSlider';
import type { WindFieldStatus } from '../wind/useWindField';

interface Props {
    times:        readonly string[];
    index:        number;
    onChange:     (index: number) => void;
    playing:      boolean;
    onTogglePlay: () => void;
    speedMph:     number | null;
    directionDeg: number | null;
    status:       WindFieldStatus;
}

/** Legend and time slider stacked over the lower edge of the map. */
export default function WindHud({
    times, index, onChange, playing, onTogglePlay, speedMph, directionDeg, status,
}: Props) {
    return (
        <Box sx={{
            position: 'absolute',
            zIndex: 2,
            left: 12,
            right: 58,
            bottom: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 1,
            pointerEvents: 'none',
        }}>
            <WindLegend speedMph={speedMph} directionDeg={directionDeg} status={status} />
            <WindTimeSlider
                times={times}
                index={index}
                onChange={onChange}
                playing={playing}
                onTogglePlay={onTogglePlay}
                disabled={status === 'loading' || status === 'idle'}
            />
        </Box>
    );
}
