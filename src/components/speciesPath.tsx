// ── Per-species marker shape ──────────────────────────────────
import type { Species } from '../types';
import { APIProvider, Map, Marker, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps';

/**
 * Returns the `google.maps.SymbolPath` shape for a given species.
 * - tarpon  → `FORWARD_CLOSED_ARROW`  (▲ triangle up)
 * - snook   → `CIRCLE`                (● circle)
 * - redfish → `BACKWARD_CLOSED_ARROW` (▼ triangle down)
 * @param species - The target species to look up.
 */
function speciesPath(species: Species): google.maps.SymbolPath {
    switch (species) {
        case 'tarpon':           return google.maps.SymbolPath.FORWARD_CLOSED_ARROW;
        case 'snook':            return google.maps.SymbolPath.CIRCLE;
        case 'redfish':          return google.maps.SymbolPath.BACKWARD_CLOSED_ARROW;
        case 'black drum':       return google.maps.SymbolPath.BACKWARD_CLOSED_ARROW;
        case 'speckled trout':   return google.maps.SymbolPath.CIRCLE;
    }
}

export default speciesPath;