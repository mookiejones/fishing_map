// ============================================================
// App.tsx — Layout shell; all state lives in AppProvider
// ============================================================

import React from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { fishingTheme, SIDEBAR_WIDTH } from './theme';
import { AppProvider, useAppContext } from './context/AppContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import FishingMap from './components/FishingMap';
import SpotDrawer from './components/SpotDrawer';

function Layout() {
    const { selectedSpot, setSelectedSpot } = useAppContext();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopBar />
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar />
                <Box sx={{ flex: 1, position: 'relative' }}>
                    <FishingMap />
                </Box>
            </Box>
            {selectedSpot && (
                <SpotDrawer
                    sidebarWidth={SIDEBAR_WIDTH}
                    onClose={() => setSelectedSpot(null)}
                />
            )}
        </Box>
    );
}

export default function App() {
    return (
        <ThemeProvider theme={fishingTheme}>
            <CssBaseline />
            <AppProvider>
                <Layout />
            </AppProvider>
        </ThemeProvider>
    );
}
