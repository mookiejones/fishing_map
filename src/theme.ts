// ============================================================
// theme.ts — MUI dark nautical theme
// ============================================================

import { createTheme } from '@mui/material/styles';

/**
 * Fixed pixel width of the collapsible sidebar.
 *
 * Referenced by `Sidebar` (its own width) and `SpotDrawer` (to offset its
 * left edge so it does not overlap the sidebar).
 */
export const SIDEBAR_WIDTH = 320;

/**
 * Material-UI dark theme with a nautical color palette.
 *
 * Color roles:
 * - `primary`   — accent teal (#00b4d8), used for active states and links
 * - `secondary` — success green (#00c851), matches "excellent" rating
 * - `background` — deep navy (#071220 default, #0c1e36 paper)
 * - `error`     — red (#f44336), matches "poor" rating color
 * - `warning`   — orange (#ff7a00), matches "fair" rating color
 * - `info`      — amber (#ffc107), matches "good" rating color
 * - `success`   — green (#00c851), matches "excellent" rating color
 */
export const fishingTheme = createTheme({
    palette: {
        mode: 'dark',
        primary:    { main: '#00b4d8' },
        secondary:  { main: '#00c851' },
        background: { default: '#071220', paper: '#0c1e36' },
        divider:    '#1a3550',
        text: {
            primary:   '#e0eef8',
            secondary: '#7aaac8',
            disabled:  '#3d6585',
        },
        error:   { main: '#f44336' },
        warning: { main: '#ff7a00' },
        info:    { main: '#ffc107' },
        success: { main: '#00c851' },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    background: '#132840',
                    border: '1px solid #1a3550',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
            },
        },
    },
});
