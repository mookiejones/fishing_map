// ============================================================
// AppContext.tsx — Global app state via React Context
// ============================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { WeatherAPI } from '../api';
import { FishingEngine } from '../engine';
import { FISHING_SPOTS } from '../spots';
import { buildConditions } from '../utils';
import { CONFIG } from '../config';
import type {
    WeatherDay, TideEvent, DayConditions,
    SelectedSpecies, Species, FishingSpot, SpotResult,
} from '../types';

// ── Types ────────────────────────────────────────────────────

export type DataStatus = 'loading' | 'ok' | 'error';

export interface SelectedSpot {
    spot:    FishingSpot;
    result:  SpotResult;
    species: Species;
}

export interface ScoredSpot {
    spot:    FishingSpot;
    result:  SpotResult;
    species: Species;
    lat:     number;
    lng:     number;
}

// Slight position offsets so per-species markers don't stack exactly
const SPECIES_OFFSET: Record<Species, { lat: number; lng: number }> = {
    tarpon:  { lat:  0.004, lng:  0.000 },
    snook:   { lat: -0.002, lng:  0.003 },
    redfish: { lat: -0.002, lng: -0.003 },
};

interface AppContextValue {
    // API key
    apiKey:     string;
    saveApiKey: (key: string) => void;

    // Remote data
    weatherDays: WeatherDay[];
    tidesByDate: Record<string, TideEvent[]>;
    dataStatus:  DataStatus;

    // Selection state
    selectedDay:        number;
    setSelectedDay:     (i: number) => void;
    selectedSpecies:    SelectedSpecies;
    setSelectedSpecies: (s: SelectedSpecies) => void;
    selectedSpot:       SelectedSpot | null;
    setSelectedSpot:    (s: SelectedSpot | null) => void;

    // Derived
    conditions:  DayConditions | null;
    scoredSpots: ScoredSpot[];

    // Map overlays
    showOysterBeds:    boolean;
    setShowOysterBeds: (v: boolean) => void;
    showSeagrass:      boolean;
    setShowSeagrass:   (v: boolean) => void;

    // User location (from browser Geolocation API)
    userLocation: { lat: number; lng: number } | null;

    // Sidebar visibility
    sidebarOpen:    boolean;
    setSidebarOpen: (v: boolean) => void;
}

// ── Context ──────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
    return ctx;
}

// ── Provider ─────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [apiKey, setApiKey]                   = useState<string>(CONFIG.GOOGLE_MAPS_API_KEY);
    const [weatherDays, setWeatherDays]         = useState<WeatherDay[]>([]);
    const [tidesByDate, setTidesByDate]         = useState<Record<string, TideEvent[]>>({});
    const [selectedDay, setSelectedDay]         = useState<number>(0);
    const [selectedSpecies, setSelectedSpecies] = useState<SelectedSpecies>('all');
    const [selectedSpot, setSelectedSpot]       = useState<SelectedSpot | null>(null);
    const [dataStatus, setDataStatus]           = useState<DataStatus>('loading');
    const [showOysterBeds, setShowOysterBeds]   = useState<boolean>(false);
    const [showSeagrass, setShowSeagrass]       = useState<boolean>(false);
    const [userLocation, setUserLocation]       = useState<{ lat: number; lng: number } | null>(null);
    const [sidebarOpen, setSidebarOpen]         = useState<boolean>(true);

    // Fetch weather + tides on mount
    useEffect(() => {
        WeatherAPI.fetchAll().then(({ weather, tides, error }) => {
            setWeatherDays(weather);
            setTidesByDate(tides);
            setDataStatus(error ? 'error' : 'ok');
        });
    }, []);

    // Request user geolocation once on mount
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => { /* silently ignore denial */ },
            { enableHighAccuracy: true, timeout: 10_000 },
        );
    }, []);

    const saveApiKey = (key: string) => {
        localStorage.setItem('fishing_map_gkey', key);
        setApiKey(key);
    };

    const conditions = useMemo<DayConditions | null>(() => {
        const day = weatherDays[selectedDay];
        if (!day) return null;
        return buildConditions(day, tidesByDate[day.date] ?? []);
    }, [weatherDays, tidesByDate, selectedDay]);

    const scoredSpots = useMemo<ScoredSpot[]>(() => {
        if (!conditions) return [];

        if (selectedSpecies !== 'all') {
            // One marker per qualifying spot, no offset
            return FISHING_SPOTS.flatMap(spot => {
                const result = FishingEngine.rateSpot(spot, conditions, selectedSpecies);
                return result
                    ? [{ spot, result, species: selectedSpecies, lat: spot.lat, lng: spot.lng }]
                    : [];
            });
        }

        // All species: one marker per (spot × species) pair, slightly offset
        return FISHING_SPOTS.flatMap(spot =>
            spot.species.flatMap(species => {
                const result = FishingEngine.rateSpot(spot, conditions, species);
                if (!result) return [];
                const { lat: dLat, lng: dLng } = SPECIES_OFFSET[species];
                return [{ spot, result, species, lat: spot.lat + dLat, lng: spot.lng + dLng }];
            }),
        );
    }, [conditions, selectedSpecies]);

    const value: AppContextValue = {
        apiKey, saveApiKey,
        weatherDays, tidesByDate, dataStatus,
        selectedDay, setSelectedDay,
        selectedSpecies, setSelectedSpecies,
        selectedSpot, setSelectedSpot,
        conditions, scoredSpots,
        showOysterBeds, setShowOysterBeds,
        showSeagrass,   setShowSeagrass,
        userLocation,
        sidebarOpen, setSidebarOpen,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
