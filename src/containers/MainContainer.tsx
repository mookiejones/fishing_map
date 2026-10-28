import { useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Box, Button, Drawer, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import FishingMap from "../components/FishingMap";
import SpotDrawer from "../components/SpotDrawer";
import { SIDEBAR_WIDTH } from "../theme";

/**
 * Map-first layout. On a narrow screen the forecast is a bottom sheet so the
 * map is the whole view. On a wide screen the forecast is a docked column.
 */
function MainContainer() {
    const theme = useTheme();
    const isNarrow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
    const { selectedSpot, setSelectedSpot, sidebarOpen, setSidebarOpen } = useAppContext();

    useEffect(() => {
        if (isNarrow && selectedSpot) setSidebarOpen(false);
    }, [isNarrow, selectedSpot, setSidebarOpen]);

    const forecast = <Sidebar mode={isNarrow ? 'sheet' : 'dock'} />;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
            <TopBar />
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {isNarrow ? (
                    <Drawer
                        anchor="bottom"
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        slotProps={{
                            paper: {
                                sx: {
                                    maxHeight: '85vh',
                                    bgcolor: 'background.default',
                                    borderRadius: '12px 12px 0 0',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderBottom: 'none',
                                },
                            },
                        }}
                    >
                        {forecast}
                    </Drawer>
                ) : (
                    forecast
                )}

                {!sidebarOpen && (
                    isNarrow ? (
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => setSidebarOpen(true)}
                            sx={{
                                position: 'absolute',
                                left: 12,
                                top: 12,
                                zIndex: 10,
                            }}
                        >
                            Forecast
                        </Button>
                    ) : (
                        <Tooltip title="Expand sidebar" placement="right">
                            <IconButton
                                size="small"
                                onClick={() => setSidebarOpen(true)}
                                sx={{
                                    position:  'absolute',
                                    left:      4,
                                    top:       8,
                                    zIndex:    10,
                                    bgcolor:   'background.paper',
                                    border:    '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                <ChevronRightIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )
                )}

                <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', minWidth: 0 }}>
                    <FishingMap />
                </Box>
            </Box>

            {selectedSpot && (
                <SpotDrawer
                    sidebarWidth={isNarrow || !sidebarOpen ? 0 : SIDEBAR_WIDTH}
                    onClose={() => setSelectedSpot(null)}
                />
            )}
        </Box>
    );
}

export default MainContainer;
