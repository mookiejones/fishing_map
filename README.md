# 🎣 Brevard County Fishing Hotspots

[![CI](https://github.com/mookiejones/fishing_map/actions/workflows/ci.yml/badge.svg)](https://github.com/mookiejones/fishing_map/actions/workflows/ci.yml)

[![Deploy](https://github.com/mookiejones/fishing_map/actions/workflows/deploy.yml/badge.svg)](https://github.com/mookiejones/fishing_map/actions/workflows/deploy.yml)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-0969da?logo=github)](https://mookiejones.github.io/fishing_map/)

[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[![MUI](https://img.shields.io/badge/MUI-9-007FFF?logo=mui&logoColor=white)](https://mui.com/)

[![Tested with Vitest](https://img.shields.io/badge/Tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

An interactive fishing map for **Brevard County, Florida** — Indian River Lagoon, Banana River, and the Cocoa Beach inlets — targeting tarpon, snook, redfish, black drum, and speckled trout. It scores dawn and dusk from an hourly forecast and NOAA tide predictions.

**Live app:** https://mookiejones.github.io/fishing_map/

---

## Features

- **Scored map markers** — each hotspot scored 0–100 at dawn and at dusk. The better window wins. Color is the rating
- **Per-species filtering** — tarpon, snook, redfish, black drum, speckled trout, or all
- **Tide integration** — NOAA hi-lo for Trident Pier (8721604) in local daylight time. Incoming is the rise into high water. Outgoing is the fall into low water. Microtidal flats are not scored as if they had the ocean range
- **Habitat overlays** — oyster and seagrass polygons, labeled as hand-drawn approximations
- **Phone layout** — the map is the whole screen. Forecast and species open in a bottom sheet
- **Spot drawer** — score breakdown, the scored window, and local tips
- **No backend** — weather from [Open-Meteo](https://open-meteo.com) (precipitation in inches), tides from [NOAA CO-OPS](https://tidesandcurrents.noaa.gov)

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

On first load the app shows a setup banner. Enter a Google Maps JavaScript API key. It is saved in `localStorage` under `fishing_map_gkey`.

Restrict the key by HTTP referrer in Google Cloud. The Pages build inlines `VITE_GOOGLE_MAPS_API_KEY` into the public bundle, so an unrestricted key can be copied from the site. Allow the Pages origin and `http://localhost:5173/*` for local development. Open-Meteo and NOAA do not need keys.

### Build for production

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

---

## Scoring Engine

Each spot is scored out of **100** (the parts sum to 115 and the total is capped):

| Factor | Max | Notes |
|--------|-----|-------|
| Wind speed | 25 | Lower wind scores higher. Dawn and dusk use the hourly mean, not the daily max |
| Wind direction | 10 | East to southeast is best on the flats. A northeast sea breeze is not a north wind |
| Barometric pressure | 25 | Level plus the change at 08:00 versus yesterday. The normal afternoon dip is not a front |
| Water movement | 20 | Preferred moving tide, weighted by `tideRegime`. Height is ignored. Micro flats (Mosquito Lagoon) cap the tide share at 4 |
| Cold front | 10 | Falling pressure plus a northwest or north wind |
| Temperature | 20 | Species comfort, from the window's air temperature minus 3°F as a water proxy |
| Precipitation | 5 | Inches. Rain outside the scored window does not count against it |

The day chip is the median of those same spot scores. Thresholds: **Excellent** ≥78 · **Good** ≥57 · **Fair** ≥37 · **Poor** <37.

---

## Tech Stack

- [React 19](https://react.dev) + [TypeScript 6](https://www.typescriptlang.org)
- [Material UI 9](https://mui.com)
- [Vite 8](https://vitejs.dev)
- [@vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/)
- [Vitest](https://vitest.dev) + jsdom

---

## Project Structure

```
src/
├── engine.ts            # rateSpot and the shared score
├── engine/rateDay.ts    # day-card median
├── engine/tidePhase.ts  # incoming and outgoing limbs
├── api/                 # Open-Meteo + NOAA, one file per function
├── spots.ts             # 14 Brevard County hotspots
├── time/forecastDates.ts
├── config.ts            # API key and station 8721604
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

Vitest covers scoring, tide phase, dawn and dusk windows, and partial fetch fallbacks.

---

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via `.github/workflows/deploy.yml`. To enable for a fork: **Settings → Pages → Source → GitHub Actions**.
