// ============================================================
// WindOverlayComponent.tsx — Wind direction + speed arrows
//   rendered as a sparse grid of Google Maps markers.
// ============================================================
// The Indian River Lagoon is a wind-driven system. Arrows show
// the direction the wind is BLOWING TO, which indicates where
// water (and bait) is being pushed — critical for IRL fishing.
// ============================================================

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface Props {
    /** When false all arrows are hidden. */
    visible:   boolean;
    /**
     * Dominant wind direction in meteorological degrees (0–360).
     * 0/360 = from North, 90 = from East, 180 = from South, 270 = from West.
     */
    windDir:   number;
    /** Maximum wind speed in mph — drives arrow scale and opacity. */
    windSpeed: number;
}

/**
 * Grid cell centres covering the IRL corridor and near-coastal offshore area.
 * Spaced ~8 miles apart so arrows read clearly without overlapping.
 */
const GRID: { lat: number; lng: number }[] = (() => {
    const points: { lat: number; lng: number }[] = [];
    // lat: Titusville to Sebastian; lng: lagoon west shore to nearshore ocean
    for (let lat = 27.90; lat <= 28.75; lat = Math.round((lat + 0.15) * 1e6) / 1e6) {
        for (let lng = -80.80; lng <= -80.44; lng = Math.round((lng + 0.12) * 1e6) / 1e6) {
            points.push({ lat, lng });
        }
    }
    return points;
})();

/**
 * Renders a grid of wind-direction arrow markers over the IRL and near-coast area.
 *
 * Each arrow is a `google.maps.Symbol` FORWARD_CLOSED_ARROW rotated to the
 * direction the wind is blowing toward (meteorological direction + 180°).
 * Arrow scale is proportional to wind speed; colour ranges from light blue
 * (calm) to deep blue (strong).
 *
 * Markers are recreated whenever wind conditions change (selected day).
 * Must be mounted inside an `<APIProvider>` + `<Map>` context.
 *
 * @param visible   - Whether the wind overlay is shown.
 * @param windDir   - Meteorological wind direction (from) in degrees.
 * @param windSpeed - Maximum wind speed in mph.
 */
export default function WindOverlayComponent({ visible, windDir, windSpeed }: Props) {
    const map        = useMap();
    const markersRef = useRef<google.maps.Marker[]>([]);

    useEffect(() => {
        if (!map) return;

        // Arrow points toward where wind is blowing
        const blowingTo = (windDir + 180) % 360;

        // Scale 2–10 based on wind speed; opacity 0.5–0.9
        const scale   = Math.max(2, Math.min(10, windSpeed * 0.4));
        const opacity = Math.max(0.5, Math.min(0.9, 0.4 + windSpeed * 0.025));

        // Colour: light cyan (calm) → deep blue (strong)
        const fillColor = windSpeed < 8  ? '#B3E5FC'
            : windSpeed < 15 ? '#4FC3F7'
            : windSpeed < 22 ? '#0288D1'
            : '#01579B';

        const symbol: google.maps.Symbol = {
            path:          google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            rotation:      blowingTo,
            scale,
            fillColor,
            fillOpacity:   opacity,
            strokeColor:   '#01579B',
            strokeWeight:  0.8,
            strokeOpacity: opacity,
        };

        const markers = GRID.map(pt =>
            new google.maps.Marker({
                map,
                position: pt,
                icon:     symbol,
                title:    `Wind: ${Math.round(windSpeed)} mph from ${compassDir(windDir)}`,
                visible,
                zIndex:   50,
                clickable: false,
            }),
        );

        markersRef.current = markers;

        return () => {
            markers.forEach(m => m.setMap(null));
            markersRef.current = [];
        };
    }, [map, windDir, windSpeed, visible]);

    // Toggle visibility only (no re-render needed)
    useEffect(() => {
        markersRef.current.forEach(m => m.setVisible(visible));
    }, [visible]);

    return null;
}

/** Converts a meteorological wind direction (degrees) to a cardinal string. */
function compassDir(deg: number): string {
    const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return dirs[Math.round(deg / 22.5) % 16]!;
}
