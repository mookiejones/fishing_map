// ============================================================
// StructuralBarriersComponent.tsx — Imperative Google Maps
//   polylines (causeways, bridges, canals, jetties) and markers
//   (offshore reefs, wrecks, ledges) toggled as one overlay.
// ============================================================

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import {
    STRUCTURAL_BARRIERS, BARRIER_COLOR,
    UNDERWATER_STRUCTURES, UNDERWATER_COLOR,
} from '../data/structuralBarriers';
import type { StructuralBarrier, UnderwaterStructure, UnderwaterType } from '../data/structuralBarriers';

interface Props {
    /** When false all polylines and markers are hidden without being removed from the map. */
    visible: boolean;
}

/** Builds a data-URI SVG marker icon for a given underwater feature type. */
function underwaterIconUrl(type: UnderwaterType): string {
    const bg = UNDERWATER_COLOR[type];

    const interior =
        type === 'reef'
            // Coral branch silhouette
            ? `<line x1="14" y1="20" x2="14" y2="10" stroke="white" stroke-width="2"/>` +
              `<line x1="14" y1="13" x2="10" y2="10" stroke="white" stroke-width="2"/>` +
              `<line x1="14" y1="13" x2="18" y2="10" stroke="white" stroke-width="2"/>` +
              `<line x1="10" y1="10" x2="8"  y2="7"  stroke="white" stroke-width="1.5"/>` +
              `<line x1="18" y1="10" x2="20" y2="7"  stroke="white" stroke-width="1.5"/>`
        : type === 'wreck'
            // Ship hull + mast silhouette
            ? `<path d="M7 17 L21 17 L19 21 L9 21Z" fill="white" opacity="0.9"/>` +
              `<line x1="14" y1="17" x2="14" y2="9" stroke="white" stroke-width="1.5"/>` +
              `<line x1="10" y1="12" x2="18" y2="12" stroke="white" stroke-width="1.5"/>` +
              `<path d="M14 9 L20 17 L14 17Z" fill="white" opacity="0.6"/>`
            // Ledge — horizontal rock strata
            : `<rect x="6"  y="11" width="16" height="3" rx="1" fill="white" opacity="0.9"/>` +
              `<rect x="8"  y="15" width="12" height="3" rx="1" fill="white" opacity="0.7"/>` +
              `<rect x="10" y="19" width="8"  height="2" rx="1" fill="white" opacity="0.5"/>`;

    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">` +
        `<circle cx="14" cy="14" r="13" fill="${bg}" stroke="white" stroke-width="1.5"/>` +
        interior +
        `</svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Renders all structural barrier overlays imperatively via the Google Maps JS API.
 *
 * - **Polylines**: causeways, bridges, canals, and jetties — stroke color reflects
 *   barrier type (see `BARRIER_COLOR`).
 * - **Markers**: offshore reefs, wrecks, and ledges — SVG icon reflects feature
 *   type; title shows approximate depth in feet.
 *
 * All features are created once and toggled visible/invisible on prop change.
 * Must be mounted inside an `<APIProvider>` + `<Map>` context.
 *
 * @param visible - Whether all structure overlay features are shown.
 */
export default function StructuralBarriersComponent({ visible }: Props) {
    const map        = useMap();
    const linesRef   = useRef<google.maps.Polyline[]>([]);
    const markersRef = useRef<google.maps.Marker[]>([]);

    // Create all features once when the map is ready
    useEffect(() => {
        if (!map) return;

        const lines = STRUCTURAL_BARRIERS.map((barrier: StructuralBarrier) =>
            new google.maps.Polyline({
                map,
                path:          barrier.path,
                strokeColor:   BARRIER_COLOR[barrier.type],
                strokeOpacity: 0.85,
                strokeWeight:  3,
                visible,
                zIndex:        200,
            }),
        );

        const markers = UNDERWATER_STRUCTURES.map((feature: UnderwaterStructure) => {
            const icon: google.maps.Icon = {
                url:        underwaterIconUrl(feature.type),
                scaledSize: new google.maps.Size(28, 28),
                anchor:     new google.maps.Point(14, 14),
            };
            return new google.maps.Marker({
                map,
                position: { lat: feature.lat, lng: feature.lng },
                title:    `${feature.name} (~${feature.depth} ft)`,
                icon,
                visible,
                zIndex:   150,
            });
        });

        linesRef.current   = lines;
        markersRef.current = markers;

        return () => {
            lines.forEach(l => l.setMap(null));
            markers.forEach(m => m.setMap(null));
            linesRef.current   = [];
            markersRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    // Toggle visibility without recreating features
    useEffect(() => {
        linesRef.current.forEach(l => l.setVisible(visible));
        markersRef.current.forEach(m => m.setVisible(visible));
    }, [visible]);

    return null;
}
