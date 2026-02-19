// ============================================================
// theme.ts — MUI dark nautical theme
// ============================================================

import { createTheme } from '@mui/material/styles';

export const SIDEBAR_WIDTH = 320;

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
