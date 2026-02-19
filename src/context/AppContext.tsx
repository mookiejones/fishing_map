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
    SelectedSpecies, FishingSpot, SpotResult,
} from '../types';

// ── Types ────────────────────────────────────────────────────

export type DataStatus = 'loading' | 'ok' | 'error';

export interface SelectedSpot {
    spot:   FishingSpot;
    result: SpotResult;
}

export interface ScoredSpot {
    spot:   FishingSpot;
    result: SpotResult;
}

interface AppContextValue {
    // API key
    apiKey:      string;
    saveApiKey:  (key: string) => void;

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

    useEffect(() => {
        WeatherAPI.fetchAll().then(({ weather, tides, error }) => {
            setWeatherDays(weather);
            setTidesByDate(tides);
            setDataStatus(error ? 'error' : 'ok');
        });
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
        return FISHING_SPOTS.flatMap(spot => {
            const result = FishingEngine.rateSpot(spot, conditions, selectedSpecies);
            return result ? [{ spot, result }] : [];
        });
    }, [conditions, selectedSpecies]);

    const value: AppContextValue = {
        apiKey, saveApiKey,
        weatherDays, tidesByDate, dataStatus,
        selectedDay, setSelectedDay,
        selectedSpecies, setSelectedSpecies,
        selectedSpot, setSelectedSpot,
        conditions, scoredSpots,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
