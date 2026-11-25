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
 * lightning or passing figure: nobody should get a fright while paying.
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
    if (!canvas) return;
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
 * The ghost that drifts across the bottom of the screen now and then: a thin
 * woman with long hair over her face, her dress thinning into the fog. Her
 * edges smoke, a cold glow hangs round her, and she floats rather than walks.
 * Halfway across she stops, tilts her head at you and her eyes light up
 * (ghost-head / ghost-eyes run in step with ghost-walk, all 11s).
 */
function Figure() {
  return (
    <svg viewBox="0 0 124 400" className="h-full w-auto overflow-visible">
      <defs>
        <linearGradient id="gh-body" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="400">
          <stop offset="0" stopColor="#040306" />
          <stop offset="0.6" stopColor="#07060b" stopOpacity="0.95" />
          <stop offset="0.85" stopColor="#0b0a12" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0b0a12" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="gh-eye">
          <stop offset="0" stopColor="#eaf2ff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#9db8ff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#9db8ff" stopOpacity="0" />
        </radialGradient>
        {/* Smoky, shifting edges */}
        <filter id="gh-smoke" x="-30%" y="-10%" width="160%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves="2" seed="7">
            <animate attributeName="baseFrequency" dur="7s" values="0.018 0.05;0.024 0.07;0.018 0.05" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="8" />
        </filter>
      </defs>
      <g className="ghost-float" filter="url(#gh-smoke)" fill="url(#gh-body)">
        {/* Dress, narrow at the waist, torn at the hem */}
        <path d="M54 62 C 50 70, 42 74, 36 82 C 30 120, 30 170, 32 220 C 30 270, 24 330, 12 392 L 22 378 L 27 398 L 36 382 L 43 400 L 51 384 L 59 400 L 67 384 L 75 400 L 83 382 L 92 398 L 99 378 L 110 392 C 98 330, 92 270, 90 220 C 92 170, 92 120, 88 82 C 82 74, 74 70, 70 62 Z" />
        {/* Long thin arms, hanging, fingers spread */}
        <path d="M38 84 C 30 120, 26 170, 24 232 L 19 262 L 22 263 L 26 242 L 26 266 L 29 266 L 30 242 L 32 262 L 35 260 L 33 232 C 36 180, 40 130, 45 96 Z" />
        <path d="M86 84 C 94 120, 98 170, 100 232 L 105 262 L 102 263 L 98 242 L 98 266 L 95 266 L 94 242 L 92 262 L 89 260 L 91 232 C 88 180, 84 130, 79 96 Z" />
        {/* Head and hair; the head tilts towards you when she stops */}
        <g className="ghost-head">
          <ellipse cx="62" cy="46" rx="13" ry="17" />
          <path d="M47 38 C 44 62, 40 102, 35 150 L 32 194 L 39 178 L 43 198 L 47 172 L 50 132 C 52 100, 52 72, 54 50 Z" />
          <path d="M77 38 C 80 62, 86 102, 90 150 L 93 192 L 86 176 L 82 196 L 78 170 L 75 130 C 73 100, 72 72, 70 50 Z" />
          <path d="M49 34 C 52 26, 72 26, 75 34 C 74 60, 72 84, 70 104 L 66 90 L 63 112 L 60 92 L 56 106 C 53 84, 50 60, 49 34 Z" />
          <g className="ghost-eyes">
            <circle cx="57" cy="49" r="7" fill="url(#gh-eye)" />
            <circle cx="68" cy="49" r="7" fill="url(#gh-eye)" />
            <circle cx="57" cy="49" r="1.6" fill="#f2f6ff" />
            <circle cx="68" cy="49" r="1.6" fill="#f2f6ff" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * Site-wide atmosphere: grain, vignette, scanlines, fog, embers,
 * random power cuts and lightning, a passing figure, and a glitch between pages.
 * Everything is pointer-events-none and sits under the navbar.
 */
export function HorrorFX() {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();
  const [flickerKey, setFlickerKey] = useState(0);
  const [lightningKey, setLightningKey] = useState(0);
  const [ghostKey, setGhostKey] = useState(0);
  const [routeKey, setRouteKey] = useState(0);
  const prevPath = useRef(pathname);
  // Calm pages and reduced-motion users get no scares
  const quiet = reduced || isCalmRoute(pathname);
  // The ghost only walks across the home page
  const ghostHere = !quiet && pathname === '/';

  // Random power cuts
  useEffect(() => {
    if (quiet) return;
    let to: ReturnType<typeof setTimeout>;
    const schedule = () => {
      to = setTimeout(() => {
        setFlickerKey((k) => k + 1);
        schedule();
      }, 16000 + Math.random() * 22000);
    };
    schedule();
    return () => clearTimeout(to);
  }, [quiet]);

  // Lightning, a little more often
  useEffect(() => {
    if (quiet) return;
    let to: ReturnType<typeof setTimeout>;
    const schedule = () => {
      to = setTimeout(() => {
        setLightningKey((k) => k + 1);
        schedule();
      }, 9000 + Math.random() * 14000);
    };
    schedule();
    return () => clearTimeout(to);
  }, [quiet]);

  // The figure
  useEffect(() => {
    if (!ghostHere) return;
    let to: ReturnType<typeof setTimeout>;
    const schedule = (first = false) => {
      to = setTimeout(() => {
        setGhostKey((k) => k + 1);
        schedule();
      }, first ? 7000 + Math.random() * 5000 : 38000 + Math.random() * 35000);
    };
    schedule(true);
    return () => clearTimeout(to);
  }, [ghostHere]);

  // Glitch cut between pages
  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    setRouteKey((k) => k + 1);
  }, [pathname]);

  return (
    <div aria-hidden className="pointer-events-none">
      {/* Embers sit behind the fog but above the page */}
      {!quiet && (
        <div className="horror-motion fixed inset-0 z-[41] opacity-70">
          <Embers />
        </div>
      )}

      {/* Ground fog */}
      <div className="horror-motion horror-still fixed inset-x-0 bottom-0 h-[45vh] z-[42] overflow-hidden opacity-60 mix-blend-screen">
        <div
          className="absolute -inset-x-[20%] inset-y-0 blur-2xl"
          style={{ background: FOG_LAYER, animation: 'fog-drift 38s ease-in-out infinite alternate' }}
        />
        <div
          className="absolute -inset-x-[20%] inset-y-0 blur-3xl opacity-70"
          style={{ background: FOG_LAYER, animation: 'fog-drift-rev 52s ease-in-out infinite alternate' }}
        />
      </div>

      {/* The figure */}
      {ghostKey > 0 && ghostHere && (
        <div
          key={`g${ghostKey}`}
          className="horror-motion fixed bottom-0 left-0 z-[43] h-[58vh] opacity-0"
          style={{ animation: 'ghost-walk 11s linear forwards' }}
        >
          {/* A cold glow round her, so she stands out from the dark page */}
          <div
            className="h-full opacity-80"
            style={{ filter: 'blur(0.6px) drop-shadow(0 0 6px rgba(140,165,215,0.45)) drop-shadow(0 0 22px rgba(110,140,210,0.28))' }}
          >
            <Figure />
          </div>
        </div>
      )}

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
      <div className="fixed inset-0 z-[45] overflow-hidden opacity-[0.07] mix-blend-overlay">
        <div
          className="absolute -inset-[50%] w-[200%] h-[200%]"
          style={{
            backgroundImage: `url("${NOISE_SVG}")`,
            animation: reduced ? undefined : 'grain 0.9s steps(6) infinite',
          }}
        />
      </div>

      {/* Lightning */}
      {lightningKey > 0 && !quiet && (
        <div
          key={`l${lightningKey}`}
          className="horror-motion fixed inset-0 z-[46] bg-[#dfe6ff] opacity-0 mix-blend-overlay"
          style={{ animation: 'lightning 1.6s ease-out forwards' }}
        />
      )}

      {/* Power cut */}
      {flickerKey > 0 && !quiet && (
        <div
          key={`f${flickerKey}`}
          className="horror-motion fixed inset-0 z-[46] bg-black opacity-0"
          style={{ animation: 'power-flicker 1.1s steps(1) forwards' }}
        />
      )}

      {/* Between pages */}
      {routeKey > 0 && (
        <div
          key={`r${routeKey}`}
          className="horror-motion fixed inset-0 z-[70] bg-black"
          style={{ animation: 'route-glitch 0.55s steps(1) forwards' }}
        >
          <div
            className="absolute inset-x-0 top-1/2 h-[2px] bg-brand-red-light shadow-[0_0_20px_rgba(255,40,50,0.9)]"
            style={{ transform: 'translateY(-50%)' }}
          />
        </div>
      )}
    </div>
  );
}
