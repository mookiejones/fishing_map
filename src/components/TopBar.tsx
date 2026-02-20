// ============================================================
// TopBar.tsx — App header with title and data status chip
// ============================================================

import React from 'react';
import { AppBar, Toolbar, Typography, Chip, Stack } from '@mui/material';
import { useAppContext } from '../context/AppContext';
import type { DataStatus } from '../context/AppContext';

/** Maps each `DataStatus` to its display label and MUI chip color. */
const STATUS_CONFIG: Record<DataStatus, { label: string; color: 'success' | 'warning' | 'error' }> = {
    loading: { label: 'Loading…',     color: 'warning' },
    ok:      { label: 'Live data',    color: 'success' },
    error:   { label: 'Offline data', color: 'error'   },
};

/** Fixed app header displaying the title and a live/offline data status chip. */
export default function TopBar() {
    const { dataStatus } = useAppContext();
    const { label, color } = STATUS_CONFIG[dataStatus];

    return (
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', zIndex: t => t.zIndex.drawer + 1 }}>
            <Toolbar variant="dense" sx={{ gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5, flex: 1 }}>
                    🎣 Brevard County Fishing Hotspots
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={label} color={color} size="small" />
                </Stack>
            </Toolbar>
        </AppBar>
    );
}
