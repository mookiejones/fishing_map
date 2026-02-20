# 🎣 Brevard County Fishing Hotspots

[![CI](https://github.com/mookiejones/fishing_map/actions/workflows/ci.yml/badge.svg)](https://github.com/mookiejones/fishing_map/actions/workflows/ci.yml)
[![Deploy](https://github.com/mookiejones/fishing_map/actions/workflows/deploy.yml/badge.svg)](https://github.com/mookiejones/fishing_map/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0969da?logo=github)](https://mookiejones.github.io/fishing_map/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MUI](https://img.shields.io/badge/MUI-v5-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Tested with Vitest](https://img.shields.io/badge/Vitest-261%20tests-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

An interactive fishing map for **Brevard County, Florida** targeting Tarpon, Snook, and Redfish. It combines a 7-day weather forecast, NOAA tide predictions, and a 100-point scoring engine to surface the best spots and windows each day.

**Live app:** https://mookiejones.github.io/fishing_map/

---

## Features

- **7-day forecast panel** — wind, pressure, precipitation, and tide overview for each day
- **Scored map markers** — each hotspot scored 0–100 and color-coded (green → red) based on current conditions
- **Per-species filtering** — toggle between Tarpon (▲), Snook (●), Redfish (▼), or view all
- **Tide integration** — NOAA hi-lo tide schedule; dawn/dusk prime windows boosted in scoring
- **Habitat overlays** — toggle oyster beds and seagrass beds on the map
- **Spot drawer** — tap any marker for score breakdown, best fishing window, tips, and habitat notes
- **No backend** — weather data from [Open-Meteo](https://open-meteo.com) (free, no key), tides from [NOAA CO-OPS](https://tidesandcurrents.noaa.gov) (free, no key)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Maps API key](https://console.cloud.google.com/) with the Maps JavaScript API enabled

### Install and run

```bash
npm install
npm run dev      # http://localhost:5173
```

On first load the app shows a setup banner — enter your Google Maps API key to display the map. The key is saved to `localStorage` and never leaves your browser.

### Build for production

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

---

## Scoring Engine

Each spot is scored out of **100 points** per day:

| Factor | Max | Notes |
|--------|-----|-------|
| Wind speed | 25 | Lower wind = better sight-fishing |
| Barometric pressure | 25 | Rising high pressure = active feeding |
| Tides | 30 | Preferred tide type + dawn/dusk alignment |
| Temperature | 20 | Species-specific thermal comfort range |

Ratings: **Excellent** ≥78 · **Good** ≥57 · **Fair** ≥37 · **Poor** <37

---

## Tech Stack

- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Material-UI v5](https://mui.com) (dark nautical theme)
- [Vite 5](https://vitejs.dev) (build + HMR)
- [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/) for map rendering
- [Vitest](https://vitest.dev) + jsdom for unit tests (261 tests across 5 suites)

---

## Project Structure

```
src/
├── engine.ts            # 100-point scoring logic
├── api/                 # Open-Meteo + NOAA fetch + processing (one file per function)
├── spots.ts             # 14 hardcoded Brevard County hotspots
├── config.ts            # API key (env var / localStorage) + constants
├── utils.ts             # buildConditions(), capitalize()
├── types.ts             # Shared TypeScript types
├── theme.ts             # MUI dark theme
├── context/
│   └── AppContext.tsx   # All app state; no prop drilling
├── components/          # One file per component
│   ├── TopBar.tsx
│   ├── Sidebar.tsx
│   ├── FishingMap.tsx
│   ├── SpotDrawer.tsx
│   └── ...
└── data/
    ├── overlays.ts      # Oyster bed + seagrass polygon coordinates
    └── boatRamps.ts     # 12 public boat ramp locations
```

---

## Testing

```bash
npm run test:run   # run all tests once
npm run test       # watch mode
```

261 tests covering the scoring engine, API data processing, utility functions, and all spot/overlay data.

---

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via `.github/workflows/deploy.yml`. To enable for a fork: **Settings → Pages → Source → GitHub Actions**.
