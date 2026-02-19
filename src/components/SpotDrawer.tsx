// ============================================================
// SpotDrawer.tsx — Bottom drawer with spot details and scores
// ============================================================

import React from 'react';
import {
    Drawer, Box, Stack, Typography, IconButton, Chip,
    LinearProgress, Grid, List, ListItem, ListItemText, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SIDEBAR_WIDTH } from '../theme';
import { capitalize } from '../utils';
import { useAppContext } from '../context/AppContext';
import type { SelectedSpot } from '../context/AppContext';

interface Props {
    sidebarWidth: number;
    onClose:      () => void;
}

const SCORE_BARS: { key: keyof SelectedSpot['result']['scores']; label: string; max: number }[] = [
    { key: 'wind',        label: 'Wind',        max: 25 },
    { key: 'pressure',    label: 'Pressure',    max: 25 },
    { key: 'tides',       label: 'Tides',       max: 30 },
    { key: 'temperature', label: 'Temperature', max: 20 },
];

function ratingColor(rating: string): 'success' | 'warning' | 'error' | 'default' {
    if (rating === 'excellent') return 'success';
    if (rating === 'good')      return 'warning';
    if (rating === 'fair')      return 'default';
    return 'error';
}

export default function SpotDrawer({ sidebarWidth, onClose }: Props) {
    const { selectedSpot } = useAppContext();
    if (!selectedSpot) return null;

    const { spot, result } = selectedSpot;

    return (
        <Drawer
            anchor="bottom"
            open
            onClose={onClose}
            PaperProps={{
                sx: {
                    left:         sidebarWidth,
                    borderRadius: '12px 12px 0 0',
                    maxHeight:    '55vh',
                    overflow:     'auto',
                    bgcolor:      'background.paper',
                    border:       '1px solid',
                    borderColor:  'divider',
                    borderBottom: 'none',
                },
            }}
        >
            <Box sx={{ p: 2.5 }}>
                {/* Header */}
                <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>{spot.name}</Typography>
                            <Chip
                                label={`${result.rating.toUpperCase()} · ${result.score}/100`}
                                color={ratingColor(result.rating)}
                                size="small"
                            />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">{spot.description}</Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                    {/* Score breakdown */}
                    <Grid item xs={12} sm={5}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            SCORE BREAKDOWN
                        </Typography>
                        <Stack spacing={1}>
                            {SCORE_BARS.map(({ key, label, max }) => {
                                const val = result.scores[key];
                                const pct = (val / max) * 100;
                                return (
                                    <Box key={key}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="caption" color="text.secondary">{label}</Typography>
                                            <Typography variant="caption">{val}/{max}</Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={pct}
                                            sx={{
                                                height: 6, borderRadius: 3,
                                                bgcolor: 'divider',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: pct >= 75 ? 'success.main' : pct >= 50 ? 'warning.main' : 'error.main',
                                                },
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                            Best time: <Typography component="span" variant="caption" color="primary.main">{result.bestTime}</Typography>
                        </Typography>
                    </Grid>

                    {/* Species + tips */}
                    <Grid item xs={12} sm={7}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                                    TARGET SPECIES
                                </Typography>
                                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                                    {spot.species.map(s => (
                                        <Chip key={s} label={capitalize(s)} size="small" color="primary" variant="outlined" />
                                    ))}
                                    {spot.features.map(f => (
                                        <Chip key={f} label={f} size="small" variant="outlined" sx={{ borderColor: 'divider', color: 'text.secondary' }} />
                                    ))}
                                </Stack>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    LOCAL TIPS
                                </Typography>
                                <List dense disablePadding>
                                    {spot.tips.map((tip, i) => (
                                        <ListItem key={i} disablePadding sx={{ alignItems: 'flex-start' }}>
                                            <ListItemText
                                                primary={`• ${tip}`}
                                                primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Drawer>
    );
}
