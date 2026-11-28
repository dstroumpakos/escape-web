'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const NOISE_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>";

const FOG_LAYER =
  'radial-gradient(40% 60% at 20% 60%, rgba(120,110,110,0.35), transparent 70%),' +
  'radial-gradient(35% 50% at 55% 70%, rgba(110,90,90,0.30), transparent 70%),' +
  'radial-gradient(45% 55% at 85% 55%, rgba(120,100,100,0.32), transparent 70%)';

/**
 * Pages where people book, pay, sign in or manage their account. They keep the
 * calm atmosphere (grain, vignette, scanlines, fog) but get no embers, power cuts,
 * lightning: nobody should get a fright while paying.
 */
const CALM_ROUTES = [
  /^\/rooms\/[^/]+\/book(\/|$)/,
  /^\/checkout(\/|$)/,
  /^\/tickets(\/|$)/,
  /^\/profile(\/|$)/,
  /^\/notifications(\/|$)/,
  /^\/login(\/|$)/,
  /^\/signup(\/|$)/,
];

export function isCalmRoute(pathname: string) {
  return CALM_ROUTES.some((r) => r.test(pathname));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Rising embers and ash, drawn on one canvas. */
function Embers() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    // Lite mode (phones, weak devices; modeScript.ts): no animation loop at all
    if (!canvas || document.documentElement.hasAttribute('data-lite')) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = w < 640 ? 22 : 46;
    type P = { x: number; y: number; vy: number; r: number; phase: number; amp: number; life: number; ash: boolean };
    const spawn = (initial = false): P => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      vy: 0.15 + Math.random() * 0.55,
      r: 0.6 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      amp: 0.2 + Math.random() * 0.8,
      life: Math.random(),
      ash: Math.random() < 0.3,
    });
    const ps: P[] = Array.from({ length: count }, () => spawn(true));

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.y -= p.vy;
        p.x += Math.sin(t * 0.8 + p.phase) * p.amp * 0.4;
        p.life += 0.002;
        if (p.y < -10) ps[i] = spawn();
        const flick = 0.55 + 0.45 * Math.sin(t * 6 + p.phase * 3);
        const fade = Math.min(1, (h - p.y) / 200) * Math.min(1, p.y / 120);
        const a = Math.max(0, fade * flick);
        if (p.ash) {
          ctx.fillStyle = `rgba(180,160,150,${a * 0.25})`;
          ctx.fillRect(p.x, p.y, p.r * 1.4, p.r * 0.7);
        } else {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, `rgba(255,${120 + Math.floor(flick * 60)},60,${a * 0.9})`);
          g.addColorStop(0.4, `rgba(220,30,20,${a * 0.35})`);
          g.addColorStop(1, 'rgba(120,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 w-full h-full" />;
}

/**
 * Site-wide atmosphere: grain, vignette, scanlines, fog, embers,
 * all of it steady: no flashes, power cuts or glitches that blink the page.
 * Everything is pointer-events-none and sits under the navbar.
 */
export function HorrorFX() {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();
  // Calm pages and reduced-motion users get no scares
  const quiet = reduced || isCalmRoute(pathname);

  return (
    <div aria-hidden className="pointer-events-none">
      {/* Embers sit behind the fog but above the page */}
      {!quiet && (
        <div className="fx-lite-off horror-motion fixed inset-0 z-[41] opacity-70">
          <Embers />
        </div>
      )}

      {/* Ground fog */}
      <div className="fx-android-off fx-lite-still horror-motion horror-still fixed inset-x-0 bottom-0 h-[45vh] z-[42] overflow-hidden opacity-60 mix-blend-screen">
        <div
          className="absolute -inset-x-[20%] inset-y-0 blur-2xl"
          style={{ background: FOG_LAYER, animation: 'fog-drift 38s ease-in-out infinite alternate' }}
        />
        <div
          className="absolute -inset-x-[20%] inset-y-0 blur-3xl opacity-70"
          style={{ background: FOG_LAYER, animation: 'fog-drift-rev 52s ease-in-out infinite alternate' }}
        />
      </div>

      {/* Vignette */}
      <div
        className="fixed inset-0 z-[44]"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.9) 100%)',
        }}
      />

      {/* Scanlines */}
      <div
        className="fixed inset-0 z-[44] opacity-[0.06]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.9) 0px, rgba(0,0,0,0.9) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Film grain */}
      <div className="fx-android-off fx-lite-still fixed inset-0 z-[45] overflow-hidden opacity-[0.07] mix-blend-overlay">
        <div
          className="absolute -inset-[50%] w-[200%] h-[200%]"
          style={{
            backgroundImage: `url("${NOISE_SVG}")`,
            animation: reduced ? undefined : 'grain 0.9s steps(6) infinite',
          }}
        />
      </div>

    </div>
  );
}
