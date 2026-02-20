// ============================================================
// App.tsx — Layout shell; all state lives in AppProvider
// ============================================================

import { ThemeProvider, CssBaseline } from '@mui/material';
import { fishingTheme } from './theme';
import { AppProvider } from './context/AppContext';
import MainContainer from './containers/MainContainer';


/**
 * Root application component.
 *
 * Wraps the entire tree with:
 * - `ThemeProvider` — applies the dark nautical MUI theme.
 * - `CssBaseline` — normalizes browser default styles.
 * - `AppProvider` — provides all app state via React Context.
 *
 * No state is held here; everything lives in `AppProvider`.
 */
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
