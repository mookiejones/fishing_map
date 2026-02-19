// ============================================================
// overlays.ts — Approximate polygon data for habitat overlays
//   Coordinates are best-effort GIS approximations for
//   Brevard County, FL. Not survey-grade data.
// ============================================================

export interface OverlayPolygon {
    id:          string;
    name:        string;
    coordinates: { lat: number; lng: number }[];
}

// ── Oyster Beds ───────────────────────────────────────────────
// Shell reefs and oyster bars scattered through the IRL system.
export const OYSTER_BEDS: OverlayPolygon[] = [
    {
        id: 'oyster-ml-north',
        name: 'Mosquito Lagoon North Bars (Oak Hill)',
        coordinates: [
            { lat: 28.920, lng: -80.840 },
            { lat: 28.882, lng: -80.856 },
            { lat: 28.845, lng: -80.850 },
            { lat: 28.830, lng: -80.836 },
            { lat: 28.850, lng: -80.822 },
            { lat: 28.892, lng: -80.830 },
        ],
    },
    {
        id: 'oyster-ml-central',
        name: 'Mosquito Lagoon Central Oyster Patches',
        coordinates: [
            { lat: 28.770, lng: -80.840 },
            { lat: 28.742, lng: -80.850 },
            { lat: 28.712, lng: -80.843 },
            { lat: 28.710, lng: -80.828 },
            { lat: 28.732, lng: -80.822 },
            { lat: 28.768, lng: -80.828 },
        ],
    },
    {
        id: 'oyster-haulover',
        name: 'Haulover Canal Oyster Bars',
        coordinates: [
            { lat: 28.648, lng: -80.800 },
            { lat: 28.641, lng: -80.796 },
            { lat: 28.636, lng: -80.789 },
            { lat: 28.638, lng: -80.783 },
            { lat: 28.644, lng: -80.785 },
            { lat: 28.650, lng: -80.793 },
        ],
    },
    {
        id: 'oyster-canaveral-bight',
        name: 'Canaveral Bight Oyster Bars',
        coordinates: [
            { lat: 28.442, lng: -80.648 },
            { lat: 28.428, lng: -80.654 },
            { lat: 28.416, lng: -80.648 },
            { lat: 28.418, lng: -80.634 },
            { lat: 28.430, lng: -80.630 },
            { lat: 28.440, lng: -80.636 },
        ],
    },
    {
        id: 'oyster-dragon-point',
        name: 'Dragon Point / Melbourne Oyster Bar',
        coordinates: [
            { lat: 28.102, lng: -80.584 },
            { lat: 28.094, lng: -80.587 },
            { lat: 28.089, lng: -80.582 },
            { lat: 28.090, lng: -80.575 },
            { lat: 28.097, lng: -80.572 },
            { lat: 28.102, lng: -80.578 },
        ],
    },
    {
        id: 'oyster-sebastian',
        name: 'Sebastian Inlet Oyster Patches',
        coordinates: [
            { lat: 27.876, lng: -80.467 },
            { lat: 27.866, lng: -80.464 },
            { lat: 27.858, lng: -80.458 },
            { lat: 27.860, lng: -80.450 },
            { lat: 27.869, lng: -80.454 },
            { lat: 27.878, lng: -80.461 },
        ],
    },
];

// ── Seagrass Beds ─────────────────────────────────────────────
// Submerged aquatic vegetation (SAV) beds, primarily shoal grass
// and manatee grass, throughout the IRL/Mosquito Lagoon system.
export const SEAGRASS_BEDS: OverlayPolygon[] = [
    {
        id: 'grass-ml-north',
        name: 'Mosquito Lagoon Northern Seagrass',
        coordinates: [
            { lat: 28.900, lng: -80.845 },
            { lat: 28.800, lng: -80.850 },
            { lat: 28.700, lng: -80.845 },
            { lat: 28.620, lng: -80.838 },
            { lat: 28.620, lng: -80.820 },
            { lat: 28.700, lng: -80.826 },
            { lat: 28.800, lng: -80.832 },
            { lat: 28.900, lng: -80.828 },
        ],
    },
    {
        id: 'grass-ml-south',
        name: 'Mosquito Lagoon South / IRL North Seagrass',
        coordinates: [
            { lat: 28.620, lng: -80.838 },
            { lat: 28.570, lng: -80.838 },
            { lat: 28.520, lng: -80.833 },
            { lat: 28.520, lng: -80.820 },
            { lat: 28.570, lng: -80.822 },
            { lat: 28.620, lng: -80.820 },
        ],
    },
    {
        id: 'grass-titusville',
        name: 'Titusville IRL Flats Seagrass',
        coordinates: [
            { lat: 28.615, lng: -80.760 },
            { lat: 28.560, lng: -80.758 },
            { lat: 28.520, lng: -80.752 },
            { lat: 28.520, lng: -80.738 },
            { lat: 28.560, lng: -80.742 },
            { lat: 28.615, lng: -80.746 },
        ],
    },
    {
        id: 'grass-banana-north',
        name: 'Banana River No-Motor Zone (North)',
        coordinates: [
            { lat: 28.555, lng: -80.695 },
            { lat: 28.500, lng: -80.703 },
            { lat: 28.445, lng: -80.706 },
            { lat: 28.445, lng: -80.685 },
            { lat: 28.500, lng: -80.682 },
            { lat: 28.555, lng: -80.675 },
        ],
    },
    {
        id: 'grass-banana-south',
        name: 'Banana River No-Motor Zone (South)',
        coordinates: [
            { lat: 28.445, lng: -80.706 },
            { lat: 28.390, lng: -80.710 },
            { lat: 28.350, lng: -80.706 },
            { lat: 28.350, lng: -80.686 },
            { lat: 28.390, lng: -80.684 },
            { lat: 28.445, lng: -80.685 },
        ],
    },
    {
        id: 'grass-irl-south',
        name: 'South IRL Seagrass (Melbourne to Sebastian)',
        coordinates: [
            { lat: 28.120, lng: -80.615 },
            { lat: 28.050, lng: -80.622 },
            { lat: 27.960, lng: -80.614 },
            { lat: 27.880, lng: -80.590 },
            { lat: 27.880, lng: -80.572 },
            { lat: 27.960, lng: -80.596 },
            { lat: 28.050, lng: -80.604 },
            { lat: 28.120, lng: -80.598 },
        ],
    },
];
