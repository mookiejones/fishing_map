import type { FishingSpot, DayConditions, TideEvent } from '../../src/types';

export const incomingSpot: FishingSpot = {
    id: 'test-incoming',
    name: 'Test Incoming Spot',
    lat: 28.0,
    lng: -80.5,
    species: ['redfish', 'snook'],
    description: 'Test',
    features: ['flats'],
    tidePreference: 'incoming',
    tips: [],
};

export const outgoingSpot: FishingSpot = {
    ...incomingSpot,
    id: 'test-outgoing',
    tidePreference: 'outgoing',
    species: ['tarpon', 'snook'],
};

export const baseTides: TideEvent[] = [
    { hour: 6,  minute: 30, height:  1.2, type: 'H' },  // dawn high
    { hour: 12, minute: 15, height: -0.1, type: 'L' },
    { hour: 18, minute: 45, height:  0.9, type: 'H' },  // dusk high
    { hour: 23, minute: 55, height:  0.0, type: 'L' },
];

export const baseConditions: DayConditions = {
    windSpeed:     8,
    windDir:       90,
    pressure:      1020,
    pressureTrend: 'rising',
    tempMax:       80,
    tempMin:       68,
    precipitation: 0,
    weatherCode:   1,
    tides:         baseTides,
};
