import { useAppContext } from "../context/AppContext";
import { Box, IconButton, Tooltip } from "@mui/material";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import FishingMap from "../components/FishingMap";
import SpotDrawer from "../components/SpotDrawer";
import { SIDEBAR_WIDTH } from "../theme";
function MainContainer() {
    const { selectedSpot, setSelectedSpot, sidebarOpen, setSidebarOpen } = useAppContext();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopBar />
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                <Sidebar />

                {/* Expand button — only visible when sidebar is closed */}
                {!sidebarOpen && (
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
                )}

                <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <FishingMap />
                </Box>
            </Box>

            {selectedSpot && (
                <SpotDrawer
                    sidebarWidth={sidebarOpen ? SIDEBAR_WIDTH : 0}
                    onClose={() => setSelectedSpot(null)}
                />
            )}
        </Box>
    );
}


export default MainContainer;