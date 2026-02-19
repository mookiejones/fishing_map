// ============================================================
// App.tsx — Root component: state management and data fetching
// ============================================================

import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { fishingTheme, SIDEBAR_WIDTH } from './theme';
import { WeatherAPI } from './api';
import { FishingEngine } from './engine';
import { FISHING_SPOTS } from './spots';
import { buildConditions } from './utils';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import FishingMap from './components/FishingMap';
import SpotDrawer from './components/SpotDrawer';
import { CONFIG } from './config';
import type { WeatherDay, TideEvent, SelectedSpecies, FishingSpot, SpotResult } from './types';

export type DataStatus = 'loading' | 'ok' | 'error';

export interface SelectedSpot {
    spot:   FishingSpot;
    result: SpotResult;
}

export default function App() {
    const [apiKey, setApiKey]                   = useState<string>(CONFIG.GOOGLE_MAPS_API_KEY);
    const [weatherDays, setWeatherDays]         = useState<WeatherDay[]>([]);
    const [tidesByDate, setTidesByDate]         = useState<Record<string, TideEvent[]>>({});
    const [selectedDay, setSelectedDay]         = useState<number>(0);
    const [selectedSpecies, setSelectedSpecies] = useState<SelectedSpecies>('all');
    const [selectedSpot, setSelectedSpot]       = useState<SelectedSpot | null>(null);
    const [dataStatus, setDataStatus]           = useState<DataStatus>('loading');

    useEffect(() => {
        WeatherAPI.fetchAll().then(({ weather, tides, error }) => {
            setWeatherDays(weather);
            setTidesByDate(tides);
            setDataStatus(error ? 'error' : 'ok');
        });
    }, []);

    const currentDay   = weatherDays[selectedDay];
    const currentTides = currentDay ? (tidesByDate[currentDay.date] ?? []) : [];
    const conditions   = currentDay ? buildConditions(currentDay, currentTides) : null;

    const scoredSpots = conditions
        ? FISHING_SPOTS.flatMap(spot => {
            const result = FishingEngine.rateSpot(spot, conditions, selectedSpecies);
            return result ? [{ spot, result }] : [];
        })
        : [];

    const handleSaveKey = (key: string) => {
        localStorage.setItem('fishing_map_gkey', key);
        setApiKey(key);
    };

    return (
        <ThemeProvider theme={fishingTheme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <TopBar dataStatus={dataStatus} />
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <Sidebar
                        weatherDays={weatherDays}
                        tidesByDate={tidesByDate}
                        selectedDay={selectedDay}
                        selectedSpecies={selectedSpecies}
                        conditions={conditions}
                        onSelectDay={setSelectedDay}
                        onSelectSpecies={setSelectedSpecies}
                    />
                    <Box sx={{ flex: 1, position: 'relative' }}>
                        <FishingMap
                            apiKey={apiKey}
                            scoredSpots={scoredSpots}
                            selectedSpot={selectedSpot}
                            onSpotClick={setSelectedSpot}
                            onSaveKey={handleSaveKey}
                            sidebarWidth={SIDEBAR_WIDTH}
                        />
                    </Box>
                </Box>
            </Box>
            {selectedSpot && (
                <SpotDrawer
                    selected={selectedSpot}
                    onClose={() => setSelectedSpot(null)}
                    sidebarWidth={SIDEBAR_WIDTH}
                />
            )}
        </ThemeProvider>
    );
}
