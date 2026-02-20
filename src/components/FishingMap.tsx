// ============================================================
// FishingMap.tsx — Google Map with scored hotspot markers,
//   user location, and habitat overlays (oyster / seagrass)
// ============================================================

import { APIProvider, Map, Marker, useApiIsLoaded ,AdvancedMarker} from '@vis.gl/react-google-maps';
import { useAppContext } from '../context/AppContext';
import { OYSTER_BEDS, SEAGRASS_BEDS } from '../data/overlays';
import { BOAT_RAMPS } from '../data/boatRamps';
import type { ScoredSpot } from '../context/AppContext';
import SetupBanner from './SetupBannerComponent';
import HabitatOverlaysComponent from './HabitatOverlaysComponent';
import MAP_STYLES from './mapStyles';
import { CONFIG } from '../config';
import speciesPath from './speciesPath';

const { AdvancedMarkerElement } = google.maps.marker;

const { SymbolPath :{CIRCLE}} = google.maps;
const PLACEHOLDER_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

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
        userLocation, showOysterBeds, showSeagrass, showBoatRamps,
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

                    {/* Boat ramp markers */}
                    {showBoatRamps && BOAT_RAMPS.map(ramp => (
                        <Marker
                            key={ramp.id}
                            position={{ lat: ramp.lat, lng: ramp.lng }}
                            title={ramp.name}
                            icon={{
                                path:         google.maps.SymbolPath.CIRCLE,
                                fillColor:    '#00b4d8',
                                fillOpacity:  0.9,
                                strokeColor:  '#ffffff',
                                strokeWeight: 1.5,
                                scale:        7,
                            }}
                            zIndex={500}
                        />
                    ))}

                    {/* User location — outer ring + inner dot */}
                    {userLocation && (
                        <>
                            <Marker
                                position={userLocation}
                                title="Your location"
                                icon={{
                                    path:          CIRCLE,
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
                                    path:         CIRCLE,
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




