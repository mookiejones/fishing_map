
import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, Marker, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps';
import type { OverlayPolygon } from '../data/overlays';

// ── Imperative polygon overlay manager ───────────────────────

export interface HabitatOverlaysProps {
    polygons:     OverlayPolygon[];
    visible:      boolean;
    strokeColor:  string;
    fillColor:    string;
    fillOpacity:  number;
}

function HabitatOverlaysComponent({ polygons, visible, strokeColor, fillColor, fillOpacity }: HabitatOverlaysProps) {
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


export default HabitatOverlaysComponent;