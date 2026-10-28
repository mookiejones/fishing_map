import { Box, IconButton, Typography } from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import dayTickIndexes from '../wind/dayTickIndexes';
import formatWindTime from '../wind/formatWindTime';

interface Props {
    times:        readonly string[];
    index:        number;
    onChange:     (index: number) => void;
    playing:      boolean;
    onTogglePlay: () => void;
    disabled?:    boolean;
}

/**
 * Hour scrubber modeled on windy.com's bottom bar: day labels on the
 * track, a play control, and the active local time.
 */
export default function WindTimeSlider({
    times, index, onChange, playing, onTogglePlay, disabled = false,
}: Props) {
    const max = Math.max(0, times.length - 1);
    const safe = Math.max(0, Math.min(max, index));
    const formatted = times[safe] ? formatWindTime(times[safe]!) : null;
    const label = formatted?.hour ?? '';
    const day = formatted?.day ?? '';
    const weekday = day.split(' ')[0] ?? '';
    const ticks = dayTickIndexes(times);
    const pct = max === 0 ? 0 : (safe / max) * 100;

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1,
            py: 0.75,
            width: '100%',
            maxWidth: 680,
            pointerEvents: 'auto',
            bgcolor: 'rgba(7, 18, 32, 0.82)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(176, 210, 230, 0.18)',
            borderRadius: '14px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.35)',
        }}>
            <IconButton
                size="small"
                onClick={onTogglePlay}
                disabled={disabled || times.length < 2}
                aria-label={playing ? 'Pause wind animation' : 'Play wind animation'}
                sx={{
                    width: 34,
                    height: 34,
                    bgcolor: '#00b4d8',
                    color: '#041018',
                    flexShrink: 0,
                    '&:hover': { bgcolor: '#33c3e0' },
                    '&.Mui-disabled': { bgcolor: '#1a3550', color: '#7aaac8' },
                }}
            >
                {playing ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
            </IconButton>

            <Box sx={{ position: 'relative', flex: 1, height: 36, minWidth: 0 }}>
                <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', height: 14 }}>
                    {ticks.map(tick => (
                        <Box
                            key={tick.start}
                            sx={{
                                flex: `${tick.end - tick.start + 1} 1 0`,
                                minWidth: 0,
                                containerType: 'inline-size',
                                overflow: 'hidden',
                            }}
                        >
                            <Typography sx={{
                                textAlign: 'center',
                                fontSize: 10,
                                letterSpacing: '0.04em',
                                color: '#8fb4cc',
                                lineHeight: '14px',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                '@container (max-width: 52px)': { visibility: 'hidden' },
                            }}>
                                {tick.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Box
                    component="input"
                    type="range"
                    min={0}
                    max={max}
                    step={1}
                    value={safe}
                    disabled={disabled || times.length === 0}
                    aria-label="Wind forecast hour"
                    aria-valuetext={formatted ? `${day} ${label}` : 'Loading'}
                    onChange={event => onChange(Number(event.target.value))}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: 18,
                        margin: 0,
                        appearance: 'none',
                        background: 'transparent',
                        cursor: disabled ? 'default' : 'pointer',
                        '&::-webkit-slider-runnable-track': {
                            height: 4,
                            borderRadius: 99,
                            background: `linear-gradient(90deg, #00b4d8 ${pct}%, rgba(143, 180, 204, 0.35) ${pct}%)`,
                        },
                        '&::-moz-range-track': {
                            height: 4,
                            borderRadius: 99,
                            background: 'rgba(143, 180, 204, 0.35)',
                        },
                        '&::-moz-range-progress': {
                            height: 4,
                            borderRadius: 99,
                            background: '#00b4d8',
                        },
                        '&::-webkit-slider-thumb': {
                            appearance: 'none',
                            width: 16,
                            height: 16,
                            marginTop: '-6px',
                            borderRadius: '50%',
                            background: '#fff',
                            border: '2px solid #00b4d8',
                            boxShadow: '0 0 0 3px rgba(0, 180, 216, 0.25)',
                        },
                        '&::-moz-range-thumb': {
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: '#fff',
                            border: '2px solid #00b4d8',
                        },
                    }}
                />
            </Box>

            <Typography sx={{
                width: 78,
                flexShrink: 0,
                textAlign: 'right',
                fontSize: 12,
                fontWeight: 650,
                color: '#e0eef8',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
            }}>
                {formatted ? `${weekday} ${label}` : ''}
            </Typography>
        </Box>
    );
}
