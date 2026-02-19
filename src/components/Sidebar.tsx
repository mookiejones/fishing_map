// ============================================================
// Sidebar.tsx — Species filter, day cards, conditions, tides
// ============================================================

import React from 'react';
import {
    Box, Typography, ToggleButton, ToggleButtonGroup, Card,
    CardActionArea, CardContent, Chip, Stack, Divider,
    CircularProgress, List, ListItem, ListItemText,
} from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CompressIcon from '@mui/icons-material/Compress';
import WaterIcon from '@mui/icons-material/Water';
import { SIDEBAR_WIDTH } from '../theme';
import { WeatherAPI } from '../api';
import { FishingEngine } from '../engine';
import type { WeatherDay, TideEvent, DayConditions, SelectedSpecies } from '../types';

interface Props {
    weatherDays:    WeatherDay[];
    tidesByDate:    Record<string, TideEvent[]>;
    selectedDay:    number;
    selectedSpecies: SelectedSpecies;
    conditions:     DayConditions | null;
    onSelectDay:    (i: number) => void;
    onSelectSpecies: (s: SelectedSpecies) => void;
}

const SPECIES_OPTIONS: { value: SelectedSpecies; label: string }[] = [
    { value: 'all',     label: 'All' },
    { value: 'tarpon',  label: 'Tarpon' },
    { value: 'snook',   label: 'Snook' },
    { value: 'redfish', label: 'Redfish' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ratingChipColor(rating: string): 'success' | 'warning' | 'error' | 'default' {
    if (rating === 'excellent') return 'success';
    if (rating === 'good')      return 'warning';
    if (rating === 'fair')      return 'default';
    return 'error';
}

export default function Sidebar({
    weatherDays, tidesByDate, selectedDay, selectedSpecies,
    conditions, onSelectDay, onSelectSpecies,
}: Props) {
    return (
        <Box sx={{
            width: SIDEBAR_WIDTH,
            minWidth: SIDEBAR_WIDTH,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
        }}>
            {/* Species filter */}
            <Box sx={{ p: 1.5, pb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    TARGET SPECIES
                </Typography>
                <ToggleButtonGroup
                    value={selectedSpecies}
                    exclusive
                    onChange={(_, v) => v && onSelectSpecies(v as SelectedSpecies)}
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

            {/* Day cards */}
            <Box sx={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {weatherDays.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ p: 1.5, pt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                7-DAY FORECAST
                            </Typography>
                            <Stack spacing={0.75}>
                                {weatherDays.map((day, i) => {
                                    const d          = new Date(day.date + 'T12:00:00');
                                    const dayName    = i === 0 ? 'Today' : DAY_NAMES[d.getDay()]!;
                                    const tides      = tidesByDate[day.date] ?? [];
                                    const conditions = { windSpeed: day.windSpeed, windDir: day.windDir, pressure: day.pressure, pressureTrend: day.pressureTrend, tempMax: day.tempMax, tempMin: day.tempMin, precipitation: day.precipitation, weatherCode: day.weatherCode, tides };
                                    const rating     = FishingEngine.getDailyRating(conditions);
                                    const wx         = WeatherAPI.weatherInfo(day.weatherCode);
                                    const isSelected = i === selectedDay;

                                    return (
                                        <Card
                                            key={day.date}
                                            elevation={0}
                                            sx={{ outline: isSelected ? '2px solid' : 'none', outlineColor: 'primary.main' }}
                                        >
                                            <CardActionArea onClick={() => onSelectDay(i)}>
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

                        {conditions && (
                            <>
                                <Divider />
                                <Box sx={{ p: 1.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        CONDITIONS
                                    </Typography>
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
                                </Box>

                                {conditions.tides.length > 0 && (
                                    <>
                                        <Divider />
                                        <Box sx={{ p: 1.5 }}>
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
                                        </Box>
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}

function CondRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ color: 'text.secondary', fontSize: 14, display: 'flex' }}>{icon}</Box>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 52 }}>{label}</Typography>
            <Typography variant="caption">{children}</Typography>
        </Stack>
    );
}
