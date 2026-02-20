// ============================================================
// App.tsx — Layout shell; all state lives in AppProvider
// ============================================================

import { ThemeProvider, CssBaseline } from '@mui/material';
import { fishingTheme } from './theme';
import { AppProvider } from './context/AppContext';
import MainContainer from './containers/MainContainer';


export default function App() {
    return (
        <ThemeProvider theme={fishingTheme}>
            <CssBaseline />
            <AppProvider>
                <MainContainer />
            </AppProvider>
        </ThemeProvider>
    );
}
