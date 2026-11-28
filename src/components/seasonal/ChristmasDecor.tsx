'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useChristmas } from '@/lib/seasonal';

/**
 * Christmas on top of the site, only while it's the season (lib/seasonal.ts):
 * a string of twinkling lights hanging under the navbar and gentle snow.
 * Nothing on the page moves or changes: it is all pointer-events-none and
 * sits above the content, under the navbar. Reduced motion: lights stay lit
 * without twinkling, no snow.
 */
export function ChristmasDecor() {
  const on = useChristmas();
  if (!on) return null;
  return (
    <div aria-hidden className="pointer-events-none">
      <Snow />
      <Lights />
    </div>
  );
}

const BULB_COLORS = ['#ff3b3b', '#ffd34d', '#38d16a', '#4da3ff', '#ff7ad9'];
const SEG = 96; // px per sag of the wire

/** The wire sags between hooks; three bulbs hang from each sag. */
function Lights() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const fit = () => setCount(Math.ceil(window.innerWidth / SEG) + 1);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Points on the sag "M0 2 Q48 20 96 2" where the bulbs hang
  const bulbs = [
    { x: 20, y: 9.5 },
    { x: 48, y: 11 },
    { x: 76, y: 9.5 },
  ];

  return (
    <div className="fixed left-0 right-0 top-16 md:top-20 z-[49] h-9 overflow-hidden flex">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width={SEG} height={36} viewBox={`0 0 ${SEG} 36`} className="shrink-0 overflow-visible">
          <path d="M0 2 Q48 20 96 2" fill="none" stroke="#1d3b22" strokeWidth="1.6" />
          {bulbs.map((b, j) => {
            const n = i * 3 + j;
            const color = BULB_COLORS[n % BULB_COLORS.length];
            return (
              <g key={j} transform={`translate(${b.x} ${b.y})`}>
                <rect x={-2.2} y={0} width={4.4} height={4} rx={1} fill="#2a2a2a" />
                <ellipse
                  cx={0}
                  cy={9}
                  rx={3.6}
                  ry={5.4}
                  fill={color}
                  className="xmas-bulb"
                  style={{ color, animationDelay: `${(n * 0.37) % 2.4}s` }}
                />
              </g>
            );
          })}
        </svg>
      ))}
    </div>
  );
}

/** Soft snow on one canvas; fewer flakes on phones and in lite mode, paused while the tab is hidden. */
function Snow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lite = document.documentElement.hasAttribute('data-lite');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    type Flake = { x: number; y: number; r: number; vy: number; drift: number; phase: number; a: number };
    let flakes: Flake[] = [];

    const make = (anyY: boolean): Flake => ({
      x: Math.random() * w,
      y: anyY ? Math.random() * h : -10,
      r: 0.8 + Math.random() * 2.2,
      vy: 0.25 + Math.random() * 0.6,
      drift: 0.3 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      a: 0.35 + Math.random() * 0.5,
    });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(lite ? 35 : 90, (w * h) / (lite ? 26000 : 14000)));
      flakes = Array.from({ length: target }, () => make(true));
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let t = 0;
    const tick = () => {
      t += 0.01;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.vy;
        f.x += Math.sin(t * f.drift + f.phase) * 0.35;
        if (f.y > h + 5) Object.assign(f, make(false));
        if (f.x < -5) f.x = w + 5;
        else if (f.x > w + 5) f.x = -5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    start();
    document.addEventListener('visibilitychange', start);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', start);
    };
  }, []);

  return <canvas ref={ref} className="fixed inset-0 w-full h-full z-[46]" />;
}

/**
 * A Santa hat on the red logo square (Navbar → Logo hat), only in the season.
 * Drawn inside the square, in the square's own units (0–36 = the square), so it
 * fits the md and lg logo alike and shakes with it. The trim rests on the top
 * edge; the hat leans left and its tip with the pompom hangs down beside the
 * square, so the eye and the lettering stay clear and nothing goes above the
 * navbar on phones.
 */
export function SantaHat() {
  const on = useChristmas();
  const id = useId().replace(/:/g, '');
  if (!on) return null;
  // viewBox x -18..42, y -18..22 in square units (the square is 36)
  return (
    <svg
      aria-hidden
      viewBox="-18 -18 60 40"
      className="pointer-events-none absolute z-10 overflow-visible"
      style={{ width: `${(60 / 36) * 100}%`, left: '-50%', top: '-50%', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.55))' }}
    >
      <defs>
        <linearGradient id={`${id}-red`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4a4f" />
          <stop offset="0.5" stopColor="#d81920" />
          <stop offset="1" stopColor="#8a0a11" />
        </linearGradient>
        <linearGradient id={`${id}-fur`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dde1e7" />
        </linearGradient>
        <radialGradient id={`${id}-pom`} cx="0.38" cy="0.32" r="0.72">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.65" stopColor="#f1f3f5" />
          <stop offset="1" stopColor="#c4cad2" />
        </radialGradient>
      </defs>

      <g transform="rotate(-5 18 0)">
        {/* The hat, leaning left; the tip falls down beside the square */}
        <path
          d="M36 -3 C34 -9 28 -12 20 -12.5 C12 -13 4 -10.5 -2 -6 C-6 -2 -9 4 -10 11 C-7 8 -4 6.5 -1 6 C-1 2 -0.5 -1 0 -3 Z"
          fill={`url(#${id}-red)`}
        />
        {/* Shade inside the fold, soft light along the crown */}
        <path d="M-1 6 C-4 6.5 -7 8 -10 11 C-8.5 6 -5.5 2 -2 -0.5 C-1.4 1.5 -1.1 3.8 -1 6 Z" fill="#5c060b" opacity="0.6" />
        <path d="M31 -7.5 C25 -10.3 17 -10.8 9.5 -9.2" fill="none" stroke="#ff9a9d" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />

        {/* Fluffy trim resting on the top edge of the square */}
        <rect x="-3" y="-5.5" width="42" height="10" rx="5" fill={`url(#${id}-fur)`} />
        {[-0.5, 3.7, 7.9, 12.1, 16.3, 20.5, 24.7, 28.9, 33.1, 37.1].map((x, k) => (
          <circle key={`t${k}`} cx={x} cy={k % 2 ? -5 : -5.6} r="2.5" fill="#ffffff" />
        ))}
        {[1, 6, 11, 16, 21, 26, 31, 35.5].map((x, k) => (
          <circle key={`b${k}`} cx={x} cy={k % 2 ? 4.2 : 4.7} r="1.9" fill="#e3e6ea" />
        ))}

        {/* Pompom */}
        <circle cx="-10.5" cy="13" r="4.6" fill={`url(#${id}-pom)`} />
        <circle cx="-13" cy="11.2" r="1.7" fill="#ffffff" />
        <circle cx="-8" cy="10.6" r="1.5" fill="#ffffff" />
        <circle cx="-9.4" cy="16.4" r="1.5" fill="#e6e9ec" />
      </g>
    </svg>
  );
}
