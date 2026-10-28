import fillWindRaster from './fillWindRaster';
import pickParticleCount from './pickParticleCount';
import projectToCanvas from './projectToCanvas';
import sampleWind from './sampleWind';
import stepParticle from './stepParticle';
import type { MapView, WindField, WindParticle } from './types';

/** One real-time second stands in for this many hours of wind travel. */
const VISUAL_HOURS_PER_SECOND = 0.2;
const RASTER_ALPHA = 168;
const TRAIL_BUCKETS = 5;

export interface WindOverlayController {
    setFrame(field: WindField | null, timeIndex: number): void;
    destroy(): void;
}

/**
 * Draws the wind field on `mapPane` (above the tiles, under markers and
 * habitat polygons). Two canvases: a smoothed speed raster, and short
 * white streaks that follow the vector field.
 *
 * The class is created lazily, after the Maps script exists. Extending
 * `OverlayView` at module scope would throw on import, before the script loads.
 */
export default function attachWindOverlay(map: google.maps.Map): WindOverlayController {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const colorCanvas = document.createElement('canvas');
    const particleCanvas = document.createElement('canvas');
    const raster = document.createElement('canvas');
    for (const canvas of [colorCanvas, particleCanvas]) {
        canvas.style.position = 'absolute';
        canvas.style.pointerEvents = 'none';
        canvas.setAttribute('aria-hidden', 'true');
    }
    particleCanvas.style.zIndex = '1';

    let field: WindField | null = null;
    let timeIndex = 0;
    let view: MapView | null = null;
    let dpr = 1;
    let rasterKey = '';
    const particles: WindParticle[] = [];
    let raf = 0;
    let lastFrame = 0;
    let running = false;
    const listeners: google.maps.MapsEventListener[] = [];

    const overlay = new google.maps.OverlayView();

    const colorCtx = () => colorCanvas.getContext('2d');
    const particleCtx = () => particleCanvas.getContext('2d');

    function respawn(particle: WindParticle): void {
        const place = spawnBox();
        particle.lat = place.south + Math.random() * (place.north - place.south);
        particle.lng = place.west + Math.random() * (place.east - place.west);
        particle.age = 0;
        particle.maxAge = 50 + Math.floor(Math.random() * 70);
        particle.speedScale = 0.65 + Math.random() * 0.7;
        particle.trail = [];
    }

    function spawnBox(): { north: number; south: number; east: number; west: number } {
        if (view && field) {
            const north = Math.min(view.north, field.north);
            const south = Math.max(view.south, field.south);
            const east = Math.min(view.east, field.east);
            const west = Math.max(view.west, field.west);
            if (north > south && east > west) return { north, south, east, west };
        }
        if (field) {
            return { north: field.north, south: field.south, east: field.east, west: field.west };
        }
        return { north: 28.6, south: 28.1, east: -80.4, west: -80.9 };
    }

    function blankParticle(): WindParticle {
        const particle: WindParticle = {
            lat: 0, lng: 0, age: 0, maxAge: 80, speedScale: 1, trail: [],
        };
        respawn(particle);
        return particle;
    }

    function ensurePopulation(reset: boolean): void {
        if (!view) return;
        const target = reduceMotion ? 0 : pickParticleCount(view.width, view.height, coarse);
        if (reset) particles.length = 0;
        while (particles.length < target) particles.push(blankParticle());
        if (particles.length > target) particles.length = target;
    }

    function rebuildRaster(): void {
        if (!field) return;
        const key = `${timeIndex}:${field.times.length}:${field.u[0] ?? 0}`;
        if (key === rasterKey && raster.width > 0) return;
        const w = field.nLng * 4;
        const h = field.nLat * 4;
        const pixels = fillWindRaster(field, timeIndex, w, h, RASTER_ALPHA, 3);
        raster.width = w;
        raster.height = h;
        const image = new ImageData(w, h);
        image.data.set(pixels);
        raster.getContext('2d')?.putImageData(image, 0, 0);
        rasterKey = key;
    }

    function paintColor(): void {
        const ctx = colorCtx();
        if (!ctx || !view || !field || raster.width === 0) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, view.width, view.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const nw = projectToCanvas(field.north, field.west, view);
        const se = projectToCanvas(field.south, field.east, view);
        ctx.drawImage(raster, nw.x, nw.y, se.x - nw.x, se.y - nw.y);
    }

    function syncView(): void {
        const projection = overlay.getProjection();
        const bounds = map.getBounds();
        if (!projection || !bounds || !colorCanvas.isConnected) return;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const north = ne.lat();
        const south = sw.lat();
        const east = ne.lng();
        const west = sw.lng();
        if (!(east > west) || !(north > south)) return;

        const nw = projection.fromLatLngToDivPixel(new google.maps.LatLng(north, west));
        const se = projection.fromLatLngToDivPixel(new google.maps.LatLng(south, east));
        if (!nw || !se) return;

        const cssW = se.x - nw.x;
        const cssH = se.y - nw.y;
        if (cssW < 2 || cssH < 2) return;

        for (const canvas of [colorCanvas, particleCanvas]) {
            canvas.style.left = `${nw.x}px`;
            canvas.style.top = `${nw.y}px`;
            canvas.style.width = `${cssW}px`;
            canvas.style.height = `${cssH}px`;
        }

        const nextDpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
        const bw = Math.max(1, Math.round(cssW * nextDpr));
        const bh = Math.max(1, Math.round(cssH * nextDpr));
        const resized = Math.abs(colorCanvas.width - bw) > 2 || Math.abs(colorCanvas.height - bh) > 2;
        if (resized) {
            dpr = nextDpr;
            colorCanvas.width = bw;
            colorCanvas.height = bh;
            particleCanvas.width = bw;
            particleCanvas.height = bh;
        }

        view = { north, south, east, west, width: cssW, height: cssH };
        if (resized) ensurePopulation(true);
        else ensurePopulation(false);
        paintColor();
    }

    function drawParticles(): void {
        const ctx = particleCtx();
        if (!ctx || !view) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, view.width, view.height);
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.35;
        ctx.strokeStyle = '#ffffff';

        for (let bucket = 0; bucket < TRAIL_BUCKETS; bucket++) {
            ctx.globalAlpha = ((bucket + 1) / TRAIL_BUCKETS) * 0.82;
            ctx.beginPath();
            for (const particle of particles) {
                const n = particle.trail.length;
                if (n === 0) continue;
                const start = Math.floor((bucket / TRAIL_BUCKETS) * n);
                const end = bucket === TRAIL_BUCKETS - 1 ? n : Math.floor(((bucket + 1) / TRAIL_BUCKETS) * n);
                for (let i = start; i < end; i++) {
                    const a = particle.trail[i];
                    if (!a) continue;
                    const b = i + 1 < n
                        ? particle.trail[i + 1]
                        : { lat: particle.lat, lng: particle.lng };
                    if (!b) continue;
                    const pa = projectToCanvas(a.lat, a.lng, view);
                    const pb = projectToCanvas(b.lat, b.lng, view);
                    if (offscreen(pa) && offscreen(pb)) continue;
                    ctx.moveTo(pa.x, pa.y);
                    ctx.lineTo(pb.x, pb.y);
                }
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    function offscreen(p: { x: number; y: number }): boolean {
        if (!view) return true;
        return p.x < -30 || p.y < -30 || p.x > view.width + 30 || p.y > view.height + 30;
    }

    function stepAll(hours: number): void {
        if (!view || !field) return;
        for (const particle of particles) {
            const sample = sampleWind(field, timeIndex, particle.lat, particle.lng);
            const projected = projectToCanvas(particle.lat, particle.lng, view);
            const left = offscreen(projected) || !sample || particle.age >= particle.maxAge;
            if (left) {
                respawn(particle);
                continue;
            }
            stepParticle(particle, sample, hours);
        }
    }

    function frame(now: number): void {
        raf = requestAnimationFrame(frame);
        if (document.hidden || !view || !field) return;
        const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 0.016;
        lastFrame = now;
        stepAll(dt * VISUAL_HOURS_PER_SECOND);
        drawParticles();
    }

    function start(): void {
        if (running || reduceMotion) return;
        running = true;
        lastFrame = 0;
        raf = requestAnimationFrame(frame);
    }

    function stop(): void {
        running = false;
        cancelAnimationFrame(raf);
    }

    overlay.onAdd = () => {
        const pane = overlay.getPanes()?.mapPane;
        if (!pane) return;
        pane.appendChild(colorCanvas);
        pane.appendChild(particleCanvas);
        listeners.push(map.addListener('bounds_changed', syncView));
        start();
        syncView();
    };

    overlay.draw = () => {
        syncView();
    };

    overlay.onRemove = () => {
        stop();
        colorCanvas.remove();
        particleCanvas.remove();
    };

    const resizeObserver = new ResizeObserver(() => syncView());
    resizeObserver.observe(map.getDiv());
    overlay.setMap(map);

    return {
        setFrame(nextField, nextIndex) {
            const fieldChanged = nextField !== field;
            const indexChanged = nextIndex !== timeIndex;
            field = nextField;
            timeIndex = nextField
                ? Math.max(0, Math.min(nextField.times.length - 1, nextIndex | 0))
                : 0;
            if (fieldChanged || indexChanged) {
                rasterKey = '';
                rebuildRaster();
                if (fieldChanged) ensurePopulation(true);
                paintColor();
            }
        },
        destroy() {
            stop();
            resizeObserver.disconnect();
            for (const listener of listeners) listener.remove();
            listeners.length = 0;
            overlay.setMap(null);
            overlay.onAdd = () => {};
            overlay.draw = () => {};
            overlay.onRemove = () => {};
        },
    };
}
