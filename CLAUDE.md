# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- **One file per function/component**: each React component, helper function, or data module lives in its own file. Do not co-locate multiple distinct exports in one file unless they are private implementation details of a single exported symbol.
- **One test file per function**: each tested function or method gets its own `.test.ts` file in the matching `tests/<module>/` subdirectory.

## Git

After making any code changes, always commit and push them to the remote without asking for confirmation first.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc type-check + Vite production build → dist/
npm run preview  # Preview production build locally
npx tsc --noEmit # Type-check only (fastest correctness check)
npm run test     # Vitest in watch mode
npm run test:run # Vitest single run (CI / pre-push)
```

Test files live in `tests/` (mirroring the `src/` structure), with one `.test.ts` file per function. Run a single file: `npx vitest run tests/engine/scoreWind.test.ts`. Tests use jsdom environment (required because `config.ts` calls `localStorage` at import time).

## Architecture

### Data flow

```
AppProvider (src/context/AppContext.tsx)
  ├── fetches Open-Meteo weather + NOAA tide data on mount (WeatherAPI)
  ├── requests browser geolocation on mount
  ├── derives `conditions` (DayConditions) from selected day's WeatherDay + tides
  ├── derives `scoredSpots` (ScoredSpot[]) by running FishingEngine.rateSpot
  │     per (spot × species) pair — one marker per species when "all" is selected,
  │     with small lat/lng offsets so markers don't stack
  └── exposes everything via useAppContext()

App.tsx          — layout shell only; reads sidebarOpen from context
  ├── TopBar     — reads dataStatus
  ├── Sidebar    — reads/sets selectedDay, selectedSpecies, overlay toggles
  ├── FishingMap — reads scoredSpots, userLocation, overlay flags
  └── SpotDrawer — reads selectedSpot (includes which species was clicked)
```

All components call `useAppContext()` directly — no prop drilling.

### Non-React business logic

| File | Purpose |
|---|---|
| `src/engine.ts` | `FishingEngine` — 100pt scoring: Wind(25) + Pressure(25) + Tides(30) + Temp(20). Rating thresholds: ≥78 excellent, ≥57 good, ≥37 fair |
| `src/api.ts` | `WeatherAPI` — Open-Meteo (weather/pressure) + NOAA CO-OPS hi-lo tides. Both free, no auth. Fallback data used when APIs fail |
| `src/spots.ts` | `FISHING_SPOTS` — 14 hardcoded Brevard County spots with species, tidePreference, tips |
| `src/data/overlays.ts` | `OYSTER_BEDS` + `SEAGRASS_BEDS` — approximate polygon coordinates for map overlays |
| `src/data/boatRamps.ts` | `BOAT_RAMPS` — 12 public boat ramp point locations (lat/lng) for Brevard County |
| `src/config.ts` | `CONFIG` — API key (reads `localStorage` key `fishing_map_gkey`), map center, NOAA station, weather coords |
| `src/utils.ts` | `buildConditions()` — assembles `DayConditions` from `WeatherDay` + tides |
| `src/theme.ts` | MUI dark nautical theme + `SIDEBAR_WIDTH = 320` |
| `src/types.ts` | All shared TypeScript types and interfaces |

### Map layer

Uses `@vis.gl/react-google-maps` v1.5.x. Important: **`Polygon` is not exported** by this package version — habitat overlays are implemented imperatively via `google.maps.Polygon` inside `HabitatOverlaysComponent.tsx` using `useMap()` + `useRef`. Map markers only render after `useApiIsLoaded()` returns true.

Species marker shapes:
- Tarpon → `FORWARD_CLOSED_ARROW` (▲), Snook → `CIRCLE` (●), Redfish → `BACKWARD_CLOSED_ARROW` (▼)
- Marker **color** encodes fishing rating (green/yellow/orange/red); **shape** encodes species

`src/components/FishingMap.tsx` imports from split-out helpers:
- `mapStyles.tsx` — dark nautical `MAP_STYLES` array
- `speciesPath.tsx` — maps `Species` → `google.maps.SymbolPath`
- `HabitatOverlaysComponent.tsx` — imperative polygon lifecycle (create on map-ready, toggle visibility)
- `SetupBannerComponent.tsx` — shown when no valid API key

`src/containers/FisingMapContainer.tsx` (note: typo in filename) is an alternate container wrapping `MapInner` + `SetupBanner`.

### GitHub Pages deployment

CI/CD via `.github/workflows/deploy.yml` — builds and deploys on every push to `main`. Vite's `base` is `/fishing_map/` when `GITHUB_ACTIONS=true` (see `vite.config.ts`). Live URL: `https://mookiejones.github.io/fishing_map/`

To activate for a new fork: **Settings → Pages → Source → GitHub Actions**.

### API key flow

Read at startup from `localStorage.getItem('fishing_map_gkey')`, falling back to the value hardcoded in `src/config.ts`. Users can enter a key in the `SetupBanner` without reloading — it is saved to `localStorage` and `APIProvider` re-mounts with the new key. Open-Meteo and NOAA require no keys.
