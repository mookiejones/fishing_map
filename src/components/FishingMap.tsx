// ============================================================
// FishingMap.tsx — Google Map with scored hotspot markers
// ============================================================

import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Stack } from '@mui/material';
import { APIProvider, Map, Marker, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { CONFIG } from '../config';
import type { FishingSpot, SpotResult } from '../types';
import type { SelectedSpot } from '../App';

const MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry',        stylers: [{ color: '#0a1628' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#7aaac8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#071220' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#071e33' }] },
    { featureType: 'road',  elementType: 'geometry', stylers: [{ color: '#1a3550' }] },
    { featureType: 'poi',   stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
];

interface ScoredSpot {
    spot:   FishingSpot;
    result: SpotResult;
}

interface Props {
    apiKey:       string;
    scoredSpots:  ScoredSpot[];
    selectedSpot: SelectedSpot | null;
    onSpotClick:  (s: SelectedSpot) => void;
    onSaveKey:    (key: string) => void;
    sidebarWidth: number;
}

const PLACEHOLDER_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

export default function FishingMap({ apiKey, scoredSpots, selectedSpot, onSpotClick, onSaveKey, sidebarWidth }: Props) {
    const isPlaceholder = !apiKey || apiKey === PLACEHOLDER_KEY;

    if (isPlaceholder) {
        return <SetupBanner onSave={onSaveKey} />;
    }

    return (
        <APIProvider apiKey={apiKey}>
            <MapInner
                scoredSpots={scoredSpots}
                selectedSpot={selectedSpot}
                onSpotClick={onSpotClick}
            />
        </APIProvider>
    );
}

function MapInner({ scoredSpots, selectedSpot, onSpotClick }: {
    scoredSpots:  ScoredSpot[];
    selectedSpot: SelectedSpot | null;
    onSpotClick:  (s: SelectedSpot) => void;
}) {
    const loaded = useApiIsLoaded();

    return (
        <Map
            defaultCenter={CONFIG.MAP_CENTER}
            defaultZoom={CONFIG.MAP_ZOOM}
            mapId={null}
            styles={MAP_STYLES}
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
        >
            {loaded && scoredSpots.map(({ spot, result }) => {
                const isSelected = selectedSpot?.spot.id === spot.id;
                const icon: google.maps.Symbol = {
                    path:        google.maps.SymbolPath.CIRCLE,
                    fillColor:   result.color,
                    fillOpacity: 0.9,
                    strokeColor: isSelected ? '#ffffff' : result.color,
                    strokeWeight: isSelected ? 3 : 1.5,
                    scale:       isSelected ? 14 : 11,
                };

                return (
                    <Marker
                        key={spot.id}
                        position={{ lat: spot.lat, lng: spot.lng }}
                        title={`${spot.name} — ${result.rating} (${result.score})`}
                        icon={icon}
                        zIndex={isSelected ? 10 : result.score}
                        onClick={() => onSpotClick({ spot, result })}
                    />
                );
            })}
        </Map>
    );
}

function SetupBanner({ onSave }: { onSave: (key: string) => void }) {
    const [draft, setDraft] = useState('');

    return (
        <Box sx={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'background.default',
        }}>
            <Paper elevation={4} sx={{ p: 4, maxWidth: 480, width: '100%', mx: 2 }}>
                <Typography variant="h6" gutterBottom>Google Maps API Key Required</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter your Maps JavaScript API key to display the interactive map.
                    Weather and tide data are already loading in the sidebar.
                </Typography>
                <Stack direction="row" spacing={1}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="AIzaSy…"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && draft.trim() && onSave(draft.trim())}
                    />
                    <Button
                        variant="contained"
                        disabled={!draft.trim()}
                        onClick={() => onSave(draft.trim())}
                    >
                        Save
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
