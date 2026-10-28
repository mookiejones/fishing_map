// ============================================================
// AppContext.tsx — Global app state via React Context
// ============================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { WeatherAPI } from '../api/api';
import { FishingEngine } from '../engine';
import { rateDay } from '../engine/rateDay';
import { FISHING_SPOTS } from '../spots';
import { conditionsForWindow } from '../utils/conditionsForWindow';
import { CONFIG } from '../config';
import type {
    WeatherDay, TideEvent, DayConditions,
    SelectedSpecies, Species, FishingSpot, SpotResult, DataOrigin,
} from '../types';

// ── Types ────────────────────────────────────────────────────

/** Remote data fetch state. Synthetic feeds are never reported as live. */
export type DataStatus = 'loading' | DataOrigin;

/** A fishing spot that the user has clicked on the map, paired with its computed result. */
export interface SelectedSpot {
    spot:    FishingSpot;
    result:  SpotResult;
    /** The specific species that was scored for this selection. */
    species: Species;
    /** The bite window this result was scored for. */
    period:  'dawn' | 'dusk';
}

/** A scored spot ready to render as a map marker, with a (possibly offset) lat/lng position. */
export interface ScoredSpot {
    spot:    FishingSpot;
    result:  SpotResult;
    species: Species;
    /** Latitude of the marker. Offset slightly when several species share a spot. */
    lat:     number;
    /** Longitude of the marker. Offset slightly when several species share a spot. */
    lng:     number;
    /** Which bite window produced `result`. */
    period:  'dawn' | 'dusk';
}

// Slight position offsets so per-species markers don't stack exactly
const SPECIES_OFFSET: Record<Species, { lat: number; lng: number }> = {
    tarpon:           { lat:  0.004, lng:  0.000 },
    snook:            { lat: -0.002, lng:  0.003 },
    redfish:          { lat: -0.002, lng: -0.003 },
    'black drum':     { lat:  0.002, lng:  0.006 },
    'speckled trout': { lat:  0.002, lng: -0.006 },
};

/** Shape of the global context value consumed by all child components. */
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
    showOysterBeds:         boolean;
    setShowOysterBeds:      (v: boolean) => void;
    showSeagrass:           boolean;
    setShowSeagrass:        (v: boolean) => void;
    showBoatRamps:          boolean;
    setShowBoatRamps:       (v: boolean) => void;
    showStructuralBarriers: boolean;
    setShowStructuralBarriers: (v: boolean) => void;
    showWindOverlay:        boolean;
    setShowWindOverlay:     (v: boolean) => void;

    // User location (from browser Geolocation API)
    userLocation: { lat: number; lng: number } | null;

    // Sidebar visibility
    sidebarOpen:    boolean;
    setSidebarOpen: (v: boolean) => void;
}

// ── Context ──────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

/**
 * Returns the global app context.
 * @throws If called outside of an `<AppProvider>` subtree.
 */
export function useAppContext(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
    return ctx;
}

// ── Provider ─────────────────────────────────────────────────

/**
 * Top-level context provider.
 * Owns all application state: API key, weather/tide data, selections, and map overlay toggles.
 * Fetches weather and tide data via `WeatherAPI.fetchAll()` on mount and requests browser geolocation.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
    const [apiKey, setApiKey]                   = useState<string>(CONFIG.GOOGLE_MAPS_API_KEY);
    const [weatherDays, setWeatherDays]         = useState<WeatherDay[]>([]);
    const [tidesByDate, setTidesByDate]         = useState<Record<string, TideEvent[]>>({});
    const [selectedDay, setSelectedDay]         = useState<number>(0);
    const [selectedSpecies, setSelectedSpecies] = useState<SelectedSpecies>('all');
    const [selectedSpot, setSelectedSpot]       = useState<SelectedSpot | null>(null);
    const [dataStatus, setDataStatus]           = useState<DataStatus>('loading');
    const [showOysterBeds, setShowOysterBeds]               = useState<boolean>(false);
    const [showSeagrass, setShowSeagrass]                   = useState<boolean>(false);
    const [showBoatRamps, setShowBoatRamps]                 = useState<boolean>(false);
    const [showStructuralBarriers, setShowStructuralBarriers] = useState<boolean>(false);
    const [showWindOverlay, setShowWindOverlay]               = useState<boolean>(false);
    const [userLocation, setUserLocation]                     = useState<{ lat: number; lng: number } | null>(null);
    const [sidebarOpen, setSidebarOpen]         = useState<boolean>(true);

    // Fetch weather + tides on mount
    useEffect(() => {
        WeatherAPI.fetchAll().then(({ weather, tides, origin }) => {
            setWeatherDays(weather);
            setTidesByDate(tides);
            setDataStatus(origin);
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

    const selectDay = (i: number) => {
        setSelectedDay(i);
        setSelectedSpot(null);
    };

    const conditions = useMemo<DayConditions | null>(() => {
        const day = weatherDays[selectedDay];
        if (!day) return null;
        return rateDay(day, tidesByDate[day.date] ?? [], selectedSpecies).conditions;
    }, [weatherDays, tidesByDate, selectedDay, selectedSpecies]);

    const scoredSpots = useMemo<ScoredSpot[]>(() => {
        const day = weatherDays[selectedDay];
        if (!day) return [];
        const tides = tidesByDate[day.date] ?? [];

        const scoreSpecies = (spot: FishingSpot, species: Species): ScoredSpot | null => {
            let best: { result: SpotResult; period: 'dawn' | 'dusk' } | null = null;
            for (const period of ['dawn', 'dusk'] as const) {
                const result = FishingEngine.rateSpot(
                    spot,
                    conditionsForWindow(day, period, tides),
                    species,
                );
                if (result && (!best || result.score > best.result.score)) {
                    best = { result, period };
                }
            }
            if (!best) return null;
            const offset = selectedSpecies === 'all' ? SPECIES_OFFSET[species] : { lat: 0, lng: 0 };
            return {
                spot,
                result: best.result,
                species,
                period: best.period,
                lat: spot.lat + offset.lat,
                lng: spot.lng + offset.lng,
            };
        };

        if (selectedSpecies !== 'all') {
            return FISHING_SPOTS.flatMap(spot => {
                const scored = scoreSpecies(spot, selectedSpecies);
                return scored ? [scored] : [];
            });
        }

        return FISHING_SPOTS.flatMap(spot =>
            spot.species.flatMap(species => {
                const scored = scoreSpecies(spot, species);
                return scored ? [scored] : [];
            }),
        );
    }, [weatherDays, tidesByDate, selectedDay, selectedSpecies]);

    const value: AppContextValue = {
        apiKey, saveApiKey,
        weatherDays, tidesByDate, dataStatus,
        selectedDay, setSelectedDay: selectDay,
        selectedSpecies, setSelectedSpecies,
        selectedSpot, setSelectedSpot,
        conditions, scoredSpots,
        showOysterBeds,          setShowOysterBeds,
        showSeagrass,            setShowSeagrass,
        showBoatRamps,           setShowBoatRamps,
        showStructuralBarriers,  setShowStructuralBarriers,
        showWindOverlay,         setShowWindOverlay,
        userLocation,
        sidebarOpen, setSidebarOpen,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
