// ============================================================
// StructuralBarriersComponent.tsx — Imperative Google Maps
//   polylines for causeways, bridges, canals, and jetties.
// ============================================================

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import {
    STRUCTURAL_BARRIERS, BARRIER_COLOR,
} from '../data/structuralBarriers';
import type { StructuralBarrier } from '../data/structuralBarriers';

interface Props {
    /** When false all polylines are hidden without being removed from the map. */
    visible: boolean;
}

/**
 * Renders structural barrier polylines (causeways, bridges, canals, jetties)
 * imperatively via the Google Maps JavaScript API.
 *
 * Each barrier type is drawn with its own stroke color (defined in `BARRIER_COLOR`).
 * Polylines are created once, then toggled visible/invisible on prop change.
 * Must be mounted inside an `<APIProvider>` + `<Map>` context.
 *
 * @param visible - Whether the barrier polylines are currently shown.
 */
export default function StructuralBarriersComponent({ visible }: Props) {
    const map      = useMap();
    const linesRef = useRef<google.maps.Polyline[]>([]);

    // Create polylines once when the map is ready
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

        linesRef.current = lines;

        return () => {
            lines.forEach(l => l.setMap(null));
            linesRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    // Toggle visibility without recreating polylines
    useEffect(() => {
        linesRef.current.forEach(l => l.setVisible(visible));
    }, [visible]);

    return null;
}
