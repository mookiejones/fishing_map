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
  ├── fetches Open-Meteo (hourly dawn/dusk windows) and NOAA tides on mount
  ├── requests browser geolocation on mount
  ├── scores each spot at dawn and dusk with FishingEngine.rateSpot and keeps the better window
  ├── day cards use rateDay, the median of those same rateSpot scores
  └── exposes everything via useAppContext()

On screens under 600px the forecast is a bottom sheet (MainContainer). Wider screens dock the sidebar.

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
| `src/engine.ts` | `FishingEngine` — up to 115 points, capped at 100: wind 25, pressure 25, water movement 20, temperature 20, wind direction 10, cold front 10, precipitation 5. Thresholds: ≥78 excellent, ≥57 good, ≥37 fair |
| `src/engine/rateDay.ts` | Day-card score. Median of `rateSpot` at dawn and dusk |
| `src/engine/tidePhase.ts` | Incoming is low→high. Outgoing is high→low |
| `src/api/` | Open-Meteo (inches, hourly) and NOAA CO-OPS `lst_ldt` tides for station 8721604. A failed feed does not replace the other |
| `src/spots.ts` | 14 Brevard spots with species, tide preference, and tide regime (`micro`, `lagoon`, `inlet`) |
| `src/data/overlays.ts` | Hand-drawn oyster and seagrass polygons. The UI labels them approximate |
| `src/data/boatRamps.ts` | Public boat ramps. Bairs Cove is the Haulover ramp. Oars & Paddles is the launch beside Dragon Point |
| `src/config.ts` | Maps key (`localStorage` `fishing_map_gkey` or `VITE_GOOGLE_MAPS_API_KEY`), map center, NOAA station, weather coords |
| `src/utils/conditionsForWindow.ts` | Builds `DayConditions` for a dawn or dusk window |
| `src/time/forecastDates.ts` | Local `America/New_York` date keys. Do not use `toISOString()` for the fishing day |
| `src/theme.ts` | MUI dark nautical theme + `SIDEBAR_WIDTH = 320` |
| `src/types.ts` | All shared TypeScript types and interfaces |

### Map layer

Uses `@vis.gl/react-google-maps` v1.5.x. Important: **`Polygon` is not exported** by this package version — habitat overlays are implemented imperatively via `google.maps.Polygon` inside `HabitatOverlaysComponent.tsx` using `useMap()` + `useRef`. Map markers only render after `useApiIsLoaded()` returns true.

Species markers are small fish icons. Color is the rating. The species is the icon color (`SPECIES_COLOR` in `FishingMap.tsx`). When every species is shown, markers are offset by at most ~120 m (`src/map/speciesMarkerOffset.ts`).

`src/components/FishingMap.tsx` imports:
- `mapStyles.tsx` — dark nautical `MAP_STYLES` array
- `HabitatOverlaysComponent.tsx` — imperative polygon lifecycle
- `SetupBannerComponent.tsx` — shown when no valid API key

`WindOverlayComponent.tsx` is the particle wind layer. Another branch owns that file. Do not restyle or rewrite it here. It receives the scored window's wind speed and direction through props.

`src/vite-env.d.ts` references `@types/google.maps`. TypeScript 6 does not load that package unless a source file references it.

### GitHub Pages deployment

CI/CD via `.github/workflows/deploy.yml` — builds and deploys on every push to `main`. Vite's `base` is `/fishing_map/` when `GITHUB_ACTIONS=true` (see `vite.config.ts`). Live URL: `https://mookiejones.github.io/fishing_map/`

To activate for a new fork: **Settings → Pages → Source → GitHub Actions**.

### API key flow

Read at startup from `localStorage.getItem('fishing_map_gkey')`, then `VITE_GOOGLE_MAPS_API_KEY`. The setup banner saves a key without a reload and `APIProvider` remounts. If the Pages workflow injects `VITE_GOOGLE_MAPS_API_KEY`, that key is inside the public JavaScript bundle. Restrict it by HTTP referrer in Google Cloud (the Pages origin and `http://localhost:5173/*` for development). Open-Meteo and NOAA require no keys.
