import { Box, Typography } from '@mui/material';
import degToCompass from '../api/degToCompass';
import WIND_COLOR_STOPS from '../wind/windColorStops';
import type { WindFieldStatus } from '../wind/useWindField';

interface Props {
    speedMph:    number | null;
    directionDeg: number | null;
    status:      WindFieldStatus;
}

const GLASS = {
    bgcolor:          'rgba(7, 18, 32, 0.82)',
    backdropFilter:   'blur(14px)',
    border:           '1px solid rgba(176, 210, 230, 0.18)',
    borderRadius:     '12px',
    boxShadow:        '0 10px 28px rgba(0, 0, 0, 0.35)',
    color:            '#e0eef8',
} as const;

const MAX_MPH = WIND_COLOR_STOPS[WIND_COLOR_STOPS.length - 1]?.mph ?? 56;
const TICKS = [0, 10, 20, 30, 50];

const GRADIENT = `linear-gradient(90deg, ${WIND_COLOR_STOPS.map(stop => {
    const [r, g, b] = stop.rgb;
    return `rgb(${r}, ${g}, ${b}) ${(stop.mph / MAX_MPH) * 100}%`;
}).join(', ')})`;

/**
 * Compact speed key for the wind layer. The ramp is the same table the
 * map raster uses, so the bar matches the colors on the water.
 */
export default function WindLegend({ speedMph, directionDeg, status }: Props) {
    const speed = speedMph == null ? '—' : `${Math.round(speedMph)}`;
    const compass = directionDeg == null ? '' : ` ${degToCompass(directionDeg)}`;
    const source = status === 'loading'
        ? 'Loading forecast'
        : status === 'fallback'
            ? 'Estimated'
            : 'Open-Meteo';

    return (
        <Box sx={{ ...GLASS, px: 1.25, py: 1, width: 'min(228px, 100%)', pointerEvents: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
                <Typography sx={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 700, color: '#8fb4cc' }}>
                    WIND
                </Typography>
                <Typography sx={{ fontSize: 10, color: '#8fb4cc' }}>{source}</Typography>
            </Box>
            <Typography sx={{ fontSize: 16, fontWeight: 650, lineHeight: 1.2, mb: 0.75 }}>
                {speed}
                <Box component="span" sx={{ fontSize: 11, fontWeight: 500, color: '#8fb4cc', ml: 0.5 }}>
                    mph{compass}
                </Box>
                <Box component="span" sx={{ fontSize: 11, fontWeight: 500, color: '#8fb4cc' }}>
                    {' · Cocoa Beach'}
                </Box>
            </Typography>
            <Box sx={{
                height: 8,
                borderRadius: 99,
                background: GRADIENT,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
            }} />
            <Box sx={{ position: 'relative', height: 14, mt: 0.25 }}>
                {TICKS.map(mph => (
                    <Typography
                        key={mph}
                        sx={{
                            position: 'absolute',
                            left: `${(mph / MAX_MPH) * 100}%`,
                            transform: mph === 0 ? 'none' : mph === TICKS[TICKS.length - 1] ? 'translateX(-100%)' : 'translateX(-50%)',
                            fontSize: 9,
                            color: '#8fb4cc',
                            lineHeight: '14px',
                        }}
                    >
                        {mph}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
}
