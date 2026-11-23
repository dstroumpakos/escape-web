'use client';

import { useEffect, useRef } from 'react';

export interface EyePair {
  /** % from the left of the container */
  x: number;
  /** % from the top of the container */
  y: number;
  /** Eye width in px */
  size?: number;
  /** Seconds before they open */
  delay?: number;
  tilt?: number;
}

/**
 * Glowing eyes in the dark. Pupils follow the pointer, they blink out of sync,
 * and they shut and vanish if the pointer gets too close.
 */
export function WatchingEyes({ pairs, className = '' }: { pairs: EyePair[]; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const groups = Array.from(el.querySelectorAll<HTMLElement>('[data-eyes]'));
    const pupils = groups.map((g) => Array.from(g.querySelectorAll<HTMLElement>('[data-pupil]')));
    let px = window.innerWidth / 2;
    let py = window.innerHeight / 3;
    let raf = 0;

    const update = () => {
      raf = 0;
      groups.forEach((g, i) => {
        const r = g.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const max = r.height * 0.22;
        const k = Math.min(1, dist / 300);
        const tx = (dx / dist) * max * 1.6 * k;
        const ty = (dy / dist) * max * k;
        pupils[i].forEach((p) => (p.style.transform = `translate(${tx}px, ${ty}px)`));
        // Shy: they close when you come near
        g.style.opacity = dist < 140 ? '0' : '';
      });
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} aria-hidden className={`horror-motion horror-still pointer-events-none absolute inset-0 ${className}`}>
      {pairs.map((p, i) => {
        const size = p.size ?? 22;
        const blinkDur = 4 + ((i * 37) % 50) / 10;
        return (
          <div
            key={i}
            data-eyes
            className="absolute flex transition-opacity duration-300"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              gap: size * 0.7,
              transform: `rotate(${p.tilt ?? 0}deg)`,
              animation: `fade-in 2.5s ease-out ${p.delay ?? 1}s both`,
            }}
          >
            {[0, 1].map((e) => (
              <div
                key={e}
                className="relative overflow-hidden"
                style={{
                  width: size,
                  height: size * 0.55,
                  borderRadius: e === 0 ? '60% 40% 50% 50% / 70% 70% 40% 40%' : '40% 60% 50% 50% / 70% 70% 40% 40%',
                  background: 'radial-gradient(circle at 50% 55%, #ffd36b 0%, #ff4a1a 35%, #a3000d 75%, #3d0005 100%)',
                  boxShadow: '0 0 12px rgba(255,60,30,0.85), 0 0 30px rgba(200,16,27,0.6)',
                  animation: `eye-blink ${blinkDur}s ease-in-out ${(i * 0.7) % 3}s infinite`,
                }}
              >
                <div
                  data-pupil
                  className="absolute left-1/2 top-1/2 transition-transform duration-150 ease-out"
                  style={{
                    width: size * 0.16,
                    height: size * 0.46,
                    marginLeft: -size * 0.08,
                    marginTop: -size * 0.23,
                    borderRadius: '50%',
                    background: '#0a0000',
                  }}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
