// ============================================================
// FishingMap.tsx — Google Map with scored hotspot markers,
//   user location, habitat overlays, and structural barriers
// ============================================================

import { APIProvider, Map, Marker, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { useAppContext } from '../context/AppContext';
import { OYSTER_BEDS, SEAGRASS_BEDS } from '../data/overlays';
import { BOAT_RAMPS } from '../data/boatRamps';
import type { ScoredSpot } from '../context/AppContext';
import type { Species } from '../types';
import SetupBanner from './SetupBannerComponent';
import HabitatOverlaysComponent from './HabitatOverlaysComponent';
import StructuralBarriersComponent from './StructuralBarriersComponent';
import MAP_STYLES from './mapStyles';
import { CONFIG } from '../config';

const PLACEHOLDER_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

/** Body fill color per species — differentiates fish icons on the map. */
const SPECIES_COLOR: Record<Species, string> = {
    tarpon:           '#FFD700',   // gold
    snook:            '#00b4d8',   // teal
    redfish:          '#FF6B35',   // orange
    'black drum':     '#78909C',   // blue-grey
    'speckled trout': '#AB47BC',   // purple
};

/**
 * Builds a data-URI SVG fish icon.
 * @param bodyColor   - Fill color for the fish body (encodes species).
 * @param strokeColor - Outline color (encodes fishing rating, or white when selected).
 * @param w           - Rendered icon width in pixels.
 * @param h           - Rendered icon height in pixels.
 */
function fishIconUrl(bodyColor: string, strokeColor: string, w: number, h: number): string {
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 24" width="${w}" height="${h}">` +
        // Forked tail
        `<polygon points="4,12 11,5 11,19" fill="${bodyColor}"/>` +
        // Body ellipse — stroke encodes rating
        `<ellipse cx="22" cy="12" rx="13" ry="8" fill="${bodyColor}" stroke="${strokeColor}" stroke-width="2"/>` +
        // Eye
        `<circle cx="30" cy="10" r="2.2" fill="white"/>` +
        `<circle cx="30.5" cy="10" r="1.1" fill="#222"/>` +
        `</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Top-level map component.
 * Shows `<SetupBanner>` when no valid API key is configured; otherwise wraps `<MapInner>` in `<APIProvider>`.
 */
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

/**
 * Inner map component rendered after the Google Maps API is loaded.
 * Renders habitat polygon overlays, one `<Marker>` per scored (spot × species) pair,
 * and the user's current location as a pulsing blue dot (when geolocation is granted).
 * Must be mounted inside an `<APIProvider>`.
 */
export function MapInner() {
    const {
        scoredSpots, selectedSpot, setSelectedSpot,
        userLocation, showOysterBeds, showSeagrass, showBoatRamps, showStructuralBarriers,
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
                    <HabitatOverlaysComponent
                        polygons={OYSTER_BEDS}
                        visible={showOysterBeds}
                        strokeColor="#c8a84b"
                        fillColor="#c8a84b"
                        fillOpacity={0.25}
                    />
                    <HabitatOverlaysComponent
                        polygons={SEAGRASS_BEDS}
                        visible={showSeagrass}
                        strokeColor="#00c853"
                        fillColor="#00c853"
                        fillOpacity={0.15}
                    />
                    {/* Structural barriers — causeways, bridges, canals, jetties */}
                    <StructuralBarriersComponent visible={showStructuralBarriers} />

                    {/* Fishing spot markers — one per (spot × species) */}
                    {scoredSpots.map((s: ScoredSpot) => {
                        const { spot, result, species, lat, lng } = s;
                        const isSelected = selectedSpot?.spot.id === spot.id &&
                                           selectedSpot?.species === species;

                        const [w, h] = isSelected ? [48, 32] : [36, 24];
                        const icon: google.maps.Icon = {
                            url:        fishIconUrl(SPECIES_COLOR[species], isSelected ? '#ffffff' : result.color, w, h),
                            scaledSize: new google.maps.Size(w, h),
                            anchor:     new google.maps.Point(w / 2, h / 2),
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

                    {/* Boat ramp markers — SVG sailboat icon */}
                    {showBoatRamps && (() => {
                        const boatIcon: google.maps.Icon = {
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">` +
                                `<circle cx="14" cy="14" r="13" fill="#00b4d8" stroke="white" stroke-width="1.5"/>` +
                                `<path d="M7 17 L21 17 L19 21 L9 21Z" fill="white"/>` +
                                `<line x1="14" y1="17" x2="14" y2="7" stroke="white" stroke-width="1.5"/>` +
                                `<path d="M14 7 L21 17 L14 17Z" fill="white" opacity="0.85"/>` +
                                `<path d="M14 7 L8 14 L14 14Z" fill="white" opacity="0.6"/>` +
                                `</svg>`
                            )}`,
                            scaledSize: new google.maps.Size(28, 28),
                            anchor:     new google.maps.Point(14, 14),
                        };
                        return BOAT_RAMPS.map(ramp => (
                            <Marker
                                key={ramp.id}
                                position={{ lat: ramp.lat, lng: ramp.lng }}
                                title={ramp.name}
                                icon={boatIcon}
                                zIndex={500}
                            />
                        ));
                    })()}

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




