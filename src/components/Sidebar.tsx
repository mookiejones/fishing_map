// ============================================================
// Sidebar.tsx — Species filter, day cards, conditions, tides,
//   habitat overlay toggles, and collapse/expand control
// ============================================================

import React, { useState } from 'react';
import {
    Box, Typography, ToggleButton, ToggleButtonGroup, Card,
    CardActionArea, CardContent, Chip, Stack, Divider,
    CircularProgress, List, ListItem, ListItemText,
    Switch, FormControlLabel, IconButton, Tooltip, Collapse,
} from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CompressIcon from '@mui/icons-material/Compress';
import WaterIcon from '@mui/icons-material/Water';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { SIDEBAR_WIDTH } from '../theme';
import { WeatherAPI } from '../api/api';
import { FishingEngine } from '../engine';
import { useAppContext } from '../context/AppContext';
import type { SelectedSpecies } from '../types';

const SPECIES_OPTIONS: { value: SelectedSpecies; label: string }[] = [
    { value: 'all',             label: 'All' },
    { value: 'tarpon',          label: 'Tarpon' },
    { value: 'snook',           label: 'Snook' },
    { value: 'redfish',         label: 'Redfish' },
    { value: 'black drum',      label: 'Drum' },
    { value: 'speckled trout',  label: 'Trout' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Maps a fishing rating string to a MUI chip color.
 * @param rating - One of 'excellent', 'good', 'fair', or 'poor'.
 */
function ratingChipColor(rating: string): 'success' | 'warning' | 'error' | 'default' {
    if (rating === 'excellent') return 'success';
    if (rating === 'good')      return 'warning';
    if (rating === 'fair')      return 'default';
    return 'error';
}

/**
 * Collapsible left sidebar containing:
 * - Species filter toggle buttons
 * - Map overlay (oyster beds / seagrass) switches
 * - 7-day forecast day cards
 * - Current day conditions (wind, temp, pressure, precip)
 * - Tide schedule for Port Canaveral
 */
export default function Sidebar() {
    const {
        weatherDays, tidesByDate,
        selectedDay, setSelectedDay,
        selectedSpecies, setSelectedSpecies,
        conditions,
        showOysterBeds, setShowOysterBeds,
        showSeagrass,   setShowSeagrass,
        showBoatRamps,  setShowBoatRamps,
        showStructuralBarriers, setShowStructuralBarriers,
        sidebarOpen,    setSidebarOpen,
    } = useAppContext();

    const [forecastOpen, setForecastOpen]     = useState(true);
    const [conditionsOpen, setConditionsOpen] = useState(true);

    return (
        <Box sx={{
            width:       sidebarOpen ? SIDEBAR_WIDTH : 0,
            minWidth:    sidebarOpen ? SIDEBAR_WIDTH : 0,
            overflow:    'hidden',
            transition:  'width 0.25s ease, min-width 0.25s ease',
            position:    'relative',
            display:     'flex',
            flexDirection: 'column',
            bgcolor:     'background.default',
            borderRight: '1px solid',
            borderColor: 'divider',
        }}>
            {/* Content wrapper keeps layout stable during animation */}
            <Box sx={{ width: SIDEBAR_WIDTH, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

                {/* ── Collapse button ───────────────────── */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 0.5 }}>
                    <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} placement="right">
                        <IconButton size="small" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Divider />

                {/* ── Species filter ────────────────────── */}
                <Box sx={{ p: 1.5, pb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        TARGET SPECIES
                    </Typography>
                    <ToggleButtonGroup
                        value={selectedSpecies}
                        exclusive
                        onChange={(_, v) => v && setSelectedSpecies(v as SelectedSpecies)}
                        size="small"
                        fullWidth
                    >
                        {SPECIES_OPTIONS.map(o => (
                            <ToggleButton key={o.value} value={o.value} sx={{ fontSize: 11 }}>
                                {o.label}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                <Divider />

                {/* ── Map overlays ──────────────────────── */}
                <Box sx={{ p: 1.5, pb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        MAP OVERLAYS
                    </Typography>
                    <Stack spacing={0}>
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={showOysterBeds}
                                    onChange={(_, v) => setShowOysterBeds(v)}
                                    sx={{ '& .MuiSwitch-thumb': { bgcolor: '#c8a84b' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#c8a84b !important' } }}
                                />
                            }
                            label={<Typography variant="caption">🦪 Oyster Beds</Typography>}
                            sx={{ m: 0 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={showSeagrass}
                                    onChange={(_, v) => setShowSeagrass(v)}
                                    sx={{ '& .MuiSwitch-thumb': { bgcolor: '#00c853' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#00c853 !important' } }}
                                />
                            }
                            label={<Typography variant="caption">🌿 Seagrass Areas</Typography>}
                            sx={{ m: 0 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={showBoatRamps}
                                    onChange={(_, v) => setShowBoatRamps(v)}
                                    sx={{ '& .MuiSwitch-thumb': { bgcolor: '#00b4d8' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#00b4d8 !important' } }}
                                />
                            }
                            label={<Typography variant="caption">⚓ Boat Ramps</Typography>}
                            sx={{ m: 0 }}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={showStructuralBarriers}
                                    onChange={(_, v) => setShowStructuralBarriers(v)}
                                    sx={{ '& .MuiSwitch-thumb': { bgcolor: '#FFB300' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#FFB300 !important' } }}
                                />
                            }
                            label={<Typography variant="caption">🌉 Structures</Typography>}
                            sx={{ m: 0 }}
                        />
                    </Stack>
                </Box>

                <Divider />

                {/* ── Day cards + conditions ────────────── */}
                <Box sx={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {weatherDays.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : (
                        <>
                            {/* ── 7-Day Forecast (collapsible) ── */}
                            <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    onClick={() => setForecastOpen(o => !o)}
                                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        7-DAY FORECAST
                                    </Typography>
                                    {forecastOpen
                                        ? <ExpandLessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                        : <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    }
                                </Stack>
                            </Box>
                            <Collapse in={forecastOpen}>
                                <Box sx={{ px: 1.5, pb: 1 }}>
                                    <Stack spacing={0.75}>
                                        {weatherDays.map((day, i) => {
                                            const d          = new Date(day.date + 'T12:00:00');
                                            const dayName    = i === 0 ? 'Today' : DAY_NAMES[d.getDay()]!;
                                            const tides      = tidesByDate[day.date] ?? [];
                                            const dayConds   = { windSpeed: day.windSpeed, windDir: day.windDir, pressure: day.pressure, pressureTrend: day.pressureTrend, tempMax: day.tempMax, tempMin: day.tempMin, precipitation: day.precipitation, weatherCode: day.weatherCode, tides };
                                            const rating     = FishingEngine.getDailyRating(dayConds);
                                            const wx         = WeatherAPI.weatherInfo(day.weatherCode);
                                            const isSelected = i === selectedDay;

                                            return (
                                                <Card
                                                    key={day.date}
                                                    elevation={0}
                                                    sx={{ outline: isSelected ? '2px solid' : 'none', outlineColor: 'primary.main' }}
                                                >
                                                    <CardActionArea onClick={() => setSelectedDay(i)}>
                                                        <CardContent sx={{ p: '8px 12px !important' }}>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{wx.icon}</Typography>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                        <Typography variant="body2" fontWeight={isSelected ? 700 : 400}>
                                                                            {dayName}
                                                                        </Typography>
                                                                        <Chip
                                                                            label={rating}
                                                                            size="small"
                                                                            color={ratingChipColor(rating)}
                                                                            sx={{ height: 18, fontSize: 10 }}
                                                                        />
                                                                    </Stack>
                                                                    <Stack direction="row" spacing={1}>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {Math.round(day.tempMax)}°/{Math.round(day.tempMin)}°F
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            💨 {Math.round(day.windSpeed)} mph
                                                                        </Typography>
                                                                    </Stack>
                                                                </Box>
                                                            </Stack>
                                                        </CardContent>
                                                    </CardActionArea>
                                                </Card>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            </Collapse>

                            {conditions && (
                                <>
                                    <Divider />

                                    {/* ── Conditions (collapsible) ── */}
                                    <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                            onClick={() => setConditionsOpen(o => !o)}
                                            sx={{ cursor: 'pointer', userSelect: 'none' }}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                CONDITIONS
                                            </Typography>
                                            {conditionsOpen
                                                ? <ExpandLessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                : <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                            }
                                        </Stack>
                                    </Box>
                                    <Collapse in={conditionsOpen}>
                                        <Box sx={{ px: 1.5, pb: 1 }}>
                                            <Stack spacing={0.5}>
                                                <CondRow icon={<AirIcon fontSize="inherit" />} label="Wind">
                                                    {Math.round(conditions.windSpeed)} mph {WeatherAPI.degToCompass(conditions.windDir)}
                                                </CondRow>
                                                <CondRow icon={<ThermostatIcon fontSize="inherit" />} label="Temp">
                                                    {Math.round(conditions.tempMax)}°F high
                                                </CondRow>
                                                <CondRow icon={<CompressIcon fontSize="inherit" />} label="Pressure">
                                                    {conditions.pressure} hPa ({conditions.pressureTrend})
                                                </CondRow>
                                                <CondRow icon={<WaterIcon fontSize="inherit" />} label="Precip">
                                                    {conditions.precipitation.toFixed(1)} in
                                                </CondRow>
                                            </Stack>

                                            {conditions.tides.length > 0 && (
                                                <>
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        TIDES — Port Canaveral
                                                    </Typography>
                                                    <List dense disablePadding>
                                                        {conditions.tides.map((t, i) => (
                                                            <ListItem key={i} disablePadding>
                                                                <ListItemText
                                                                    primary={`${t.type === 'H' ? '▲ High' : '▼ Low'}  ${WeatherAPI.formatTideTime(t)}`}
                                                                    secondary={`${t.height.toFixed(1)} ft`}
                                                                    primaryTypographyProps={{ variant: 'caption', color: t.type === 'H' ? 'primary.main' : 'text.secondary' }}
                                                                    secondaryTypographyProps={{ variant: 'caption' }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </>
                                            )}
                                        </Box>
                                    </Collapse>
                                </>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

/**
 * Single icon + label + value row in the CONDITIONS section.
 * @param icon     - MUI icon element shown on the left.
 * @param label    - Short descriptor (e.g. "Wind", "Temp").
 * @param children - Formatted value string rendered on the right.
 */
function CondRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ color: 'text.secondary', fontSize: 14, display: 'flex' }}>{icon}</Box>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52 }}>{label}</Typography>
            <Typography variant="caption">{children}</Typography>
        </Stack>
    );
}
