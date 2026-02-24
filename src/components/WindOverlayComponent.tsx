// ============================================================
// WindOverlayComponent.tsx — Animated particle wind overlay
//   Renders flowing streamlines on a canvas, earth.nullschool
//   style: dark background, speed-colored trails, fade in/out.
// ============================================================
// Color scale (mph):  0=navy · 8=blue · 15=cyan · 25=green
//                    35=gold · 50=orange · 80+=red
// ============================================================

import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface Props {
    /** When false the canvas is hidden (animation keeps running). */
    visible:   boolean;
    /**
     * Dominant wind direction in meteorological degrees (from).
     * 0/360 = from North (blowing South), 90 = from East (blowing West).
     */
    windDir:   number;
    /** Wind speed in mph — drives particle velocity and color. */
    windSpeed: number;
}

interface Particle {
    x:      number;
    y:      number;
    age:    number;
    maxAge: number;
    speed:  number;
}

const PARTICLE_COUNT = 300;

// ── Color helpers ─────────────────────────────────────────────

function lerpRgb(
    a: [number, number, number],
    b: [number, number, number],
    t: number,
): string {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${bl})`;
}

/**
 * Maps wind speed (mph) to a CSS color string using a
 * nullschool-inspired gradient: calm=navy → moderate=cyan →
 * strong=green → gale=gold → storm=orange → extreme=red.
 */
function windColor(mph: number): string {
    const stops: [number, [number, number, number]][] = [
        [0,  [10,  35,  90]],   // deep navy
        [8,  [20, 110, 220]],   // blue
        [15, [33, 212, 245]],   // cyan
        [25, [0,  200,  83]],   // green
        [35, [255, 200,   0]],  // gold
        [50, [255,  87,  34]],  // orange
        [80, [183,  28,  28]],  // dark red
    ];
    for (let i = 0; i < stops.length - 1; i++) {
        const [s0, c0] = stops[i]!;
        const [s1, c1] = stops[i + 1]!;
        if (mph <= s1) {
            const t = Math.max(0, Math.min(1, (mph - s0) / (s1 - s0)));
            return lerpRgb(c0, c1, t);
        }
    }
    return 'rgb(183,28,28)';
}

// ── Component ─────────────────────────────────────────────────

/**
 * Canvas-based animated wind particle overlay rendered directly
 * over the Google Map div.  Particles stream in the direction the
 * wind is blowing, with fade-in/out trails and speed-coded color.
 *
 * The canvas animation runs continuously; visibility is toggled
 * via `display` CSS so the animation stays warm on re-enable.
 *
 * Must be mounted inside an `<APIProvider>` + `<Map>` context.
 */
export default function WindOverlayComponent({ visible, windDir, windSpeed }: Props) {
    const map      = useMap();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // ── Main effect — restart when wind conditions change ─────
    useEffect(() => {
        if (!map) return;

        // -- Canvas --
        const mapDiv = map.getDiv();
        const canvas  = document.createElement('canvas');
        canvas.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;' +
            'pointer-events:none;z-index:200;';
        canvas.style.display = visible ? 'block' : 'none';
        mapDiv.appendChild(canvas);
        canvasRef.current = canvas;

        const ctx = canvas.getContext('2d')!;

        // -- Wind vector in screen space --
        // windDir is FROM direction; particles travel TO (windDir + 180°)
        // Screen: x-right = East, y-down = South
        //   ux = -sin(windDir_rad)  →  from N(0°): 0, from E(90°): -1, from W(270°): +1
        //   uy =  cos(windDir_rad)  →  from N(0°): +1 (down=S), from S(180°): -1 (up=N)
        const rad = (windDir * Math.PI) / 180;
        const ux  = -Math.sin(rad);
        const uy  =  Math.cos(rad);

        // Pixel speed: windSpeed 0→calm, 30→~6 px/frame @60fps
        const baseSpeed = Math.max(0.5, windSpeed * 0.22);
        const color     = windColor(windSpeed);

        // -- Particle lifecycle --
        let w = 0, h = 0;
        const particles: Particle[] = [];

        function respawn(p: Particle, staggerAge = false): void {
            p.maxAge = 80 + Math.random() * 200;
            p.speed  = baseSpeed * (0.55 + Math.random() * 0.9);
            p.age    = staggerAge ? Math.floor(Math.random() * p.maxAge) : 0;

            // 30% of particles enter from the upwind edge for natural flow
            if (Math.random() < 0.3) {
                if (Math.abs(ux) >= Math.abs(uy)) {
                    p.x = ux > 0 ? -4 : w + 4;
                    p.y = Math.random() * h;
                } else {
                    p.x = Math.random() * w;
                    p.y = uy > 0 ? -4 : h + 4;
                }
            } else {
                p.x = Math.random() * w;
                p.y = Math.random() * h;
            }
        }

        function resize(): void {
            w = mapDiv.offsetWidth;
            h = mapDiv.offsetHeight;
            canvas.width  = w;
            canvas.height = h;
            particles.length = 0;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const p: Particle = { x: 0, y: 0, age: 0, maxAge: 200, speed: 0 };
                respawn(p, true); // staggered ages → immediate density on load
            }
        }

        resize();

        // -- Animation loop --
        let animId = 0;

        function frame(): void {
            animId = requestAnimationFrame(frame);

            // Trail fade: use destination-out so we reduce existing pixel alpha
            // rather than painting an opaque dark color over the transparent canvas.
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = 0.07;
            ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;

            ctx.lineWidth = 1.5;

            for (const p of particles) {
                // Slight turbulence perpendicular to flow for organic feel
                const turb  = (Math.random() - 0.5) * 0.28;
                const speed = p.speed;
                const nx    = p.x + (ux - turb * uy) * speed;
                const ny    = p.y + (uy + turb * ux) * speed;

                // Fade in over first 10% of life, fade out over last 20%
                const t     = p.age / p.maxAge;
                const alpha = t < 0.10
                    ? t / 0.10
                    : t > 0.80
                        ? (1 - t) / 0.20
                        : 1;

                ctx.globalAlpha  = alpha * 0.78;
                ctx.strokeStyle  = color;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(nx, ny);
                ctx.stroke();

                p.x = nx;
                p.y = ny;
                p.age++;

                if (nx < -30 || nx > w + 30 || ny < -30 || ny > h + 30 || p.age >= p.maxAge) {
                    respawn(p);
                }
            }

            ctx.globalAlpha = 1;
        }

        frame();

        // Resize canvas when the map container changes size
        const obs = new ResizeObserver(resize);
        obs.observe(mapDiv);

        return () => {
            cancelAnimationFrame(animId);
            obs.disconnect();
            canvas.remove();
            canvasRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, windDir, windSpeed]); // visible handled separately below

    // ── Visibility toggle — no animation restart ───────────────
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.style.display = visible ? 'block' : 'none';
        }
    }, [visible]);

    return null;
}
