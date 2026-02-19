// ============================================================
// FishingMap.tsx — Google Map with scored hotspot markers,
//   user location, and habitat overlays (oyster / seagrass)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, Stack } from '@mui/material';
import { APIProvider, Map, Marker, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { CONFIG } from '../config';
import { useAppContext } from '../context/AppContext';
import { OYSTER_BEDS, SEAGRASS_BEDS } from '../data/overlays';
import type { OverlayPolygon } from '../data/overlays';
import type { ScoredSpot } from '../context/AppContext';
import type { Species } from '../types';

// ── Map style (dark nautical) ─────────────────────────────────

const MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry',           stylers: [{ color: '#0a1628' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#7aaac8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#071220' }] },
    { featureType: 'water',   elementType: 'geometry', stylers: [{ color: '#071e33' }] },
    { featureType: 'road',    elementType: 'geometry', stylers: [{ color: '#1a3550' }] },
    { featureType: 'poi',     stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
];

// ── Per-species marker shape ──────────────────────────────────

function speciesPath(species: Species): google.maps.SymbolPath {
    switch (species) {
        case 'tarpon':  return google.maps.SymbolPath.FORWARD_CLOSED_ARROW;  // ▲ triangle up
        case 'snook':   return google.maps.SymbolPath.CIRCLE;                // ● circle
        case 'redfish': return google.maps.SymbolPath.BACKWARD_CLOSED_ARROW; // ▼ triangle down
    }
}

// ── Entry point ───────────────────────────────────────────────

const PLACEHOLDER_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

export default function FishingMap() {
    const { apiKey, saveApiKey } = useAppContext();

    if (!apiKey || apiKey === PLACEHOLDER_KEY) {
        return <SetupBanner onSave={saveApiKey} />;
    }

    return (
        <APIProvider apiKey={apiKey}>
            <MapInner />
        </APIProvider>
    );
}

// ── Map content ───────────────────────────────────────────────

function MapInner() {
    const {
        scoredSpots, selectedSpot, setSelectedSpot,
        userLocation, showOysterBeds, showSeagrass,
    } = useAppContext();

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
            {loaded && (
                <>
                    {/* Imperative polygon overlays */}
                    <HabitatOverlays
                        polygons={OYSTER_BEDS}
                        visible={showOysterBeds}
                        strokeColor="#c8a84b"
                        fillColor="#c8a84b"
                        fillOpacity={0.25}
                    />
                    <HabitatOverlays
                        polygons={SEAGRASS_BEDS}
                        visible={showSeagrass}
                        strokeColor="#00c853"
                        fillColor="#00c853"
                        fillOpacity={0.15}
                    />

                    {/* Fishing spot markers — one per (spot × species) */}
                    {scoredSpots.map((s: ScoredSpot) => {
                        const { spot, result, species, lat, lng } = s;
                        const isSelected = selectedSpot?.spot.id === spot.id &&
                                           selectedSpot?.species === species;

                        const icon: google.maps.Symbol = {
                            path:         speciesPath(species),
                            fillColor:    result.color,
                            fillOpacity:  0.9,
                            strokeColor:  isSelected ? '#ffffff' : result.color,
                            strokeWeight: isSelected ? 3 : 1.5,
                            scale:        isSelected ? 14 : 11,
                        };

                        return (
                            <Marker
                                key={`${spot.id}-${species}`}
                                position={{ lat, lng }}
                                title={`${spot.name} (${species}) — ${result.rating} (${result.score})`}
                                icon={icon}
                                zIndex={isSelected ? 1000 : result.score}
                                onClick={() => setSelectedSpot({ spot, result, species })}
                            />
                        );
                    })}

                    {/* User location — outer ring + inner dot */}
                    {userLocation && (
                        <>
                            <Marker
                                position={userLocation}
                                title="Your location"
                                icon={{
                                    path:          google.maps.SymbolPath.CIRCLE,
                                    fillColor:     '#4285F4',
                                    fillOpacity:   0.15,
                                    strokeColor:   '#4285F4',
                                    strokeOpacity: 0.4,
                                    strokeWeight:  1,
                                    scale:         22,
                                }}
                                zIndex={999}
                            />
                            <Marker
                                position={userLocation}
                                title="Your location"
                                icon={{
                                    path:         google.maps.SymbolPath.CIRCLE,
                                    fillColor:    '#4285F4',
                                    fillOpacity:  1,
                                    strokeColor:  '#ffffff',
                                    strokeWeight: 2,
                                    scale:        8,
                                }}
                                zIndex={1000}
                            />
                        </>
                    )}
                </>
            )}
        </Map>
    );
}

// ── Imperative polygon overlay manager ───────────────────────

interface HabitatOverlaysProps {
    polygons:     OverlayPolygon[];
    visible:      boolean;
    strokeColor:  string;
    fillColor:    string;
    fillOpacity:  number;
}

function HabitatOverlays({ polygons, visible, strokeColor, fillColor, fillOpacity }: HabitatOverlaysProps) {
    const map = useMap();
    const instancesRef = useRef<google.maps.Polygon[]>([]);

    // Create polygons once when the map is ready
    useEffect(() => {
        if (!map) return;

        // Clean up any previous instances
        instancesRef.current.forEach(p => p.setMap(null));

        instancesRef.current = polygons.map(poly =>
            new google.maps.Polygon({
                map:          visible ? map : null,
                paths:        poly.coordinates,
                strokeColor,
                strokeOpacity: 0.85,
                strokeWeight:  1.5,
                fillColor,
                fillOpacity,
                clickable:    false,
            }),
        );

        return () => {
            instancesRef.current.forEach(p => p.setMap(null));
            instancesRef.current = [];
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    // Toggle visibility without recreating
    useEffect(() => {
        instancesRef.current.forEach(p => p.setMap(visible ? map ?? null : null));
    }, [visible, map]);

    return null;
}

// ── Setup banner (no API key) ─────────────────────────────────

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
