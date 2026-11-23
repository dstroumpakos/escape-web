'use client';

import { useMemo } from 'react';

/** Small deterministic PRNG so server and client render the same drips. */
function seeded(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

interface BloodDripsProps {
  count?: number;
  seed?: number;
  /** Longest drip in px */
  maxLength?: number;
  /** Seconds a drip takes to run its full length */
  speed?: number;
  /** Let drops fall off the ends, on a loop */
  falling?: boolean;
  className?: string;
  color?: string;
  /** Draw the thin pool of blood along the top edge */
  band?: boolean;
}

/**
 * Blood running down from the top edge of its container.
 * Put it inside a `relative` parent; it fills the width and hangs below the top.
 */
export function BloodDrips({
  count = 12,
  seed = 1,
  maxLength = 60,
  speed = 4,
  falling = true,
  className = '',
  color = '#a3000d',
  band = true,
}: BloodDripsProps) {
  const drips = useMemo(() => {
    const rand = seeded(seed);
    return Array.from({ length: count }, (_, i) => {
      const x = ((i + 0.15 + rand() * 0.7) / count) * 100;
      const len = maxLength * (0.25 + rand() * 0.75);
      const width = 3 + rand() * 5;
      const delay = rand() * 3;
      const dur = speed * (0.7 + rand() * 0.8);
      return { x, len, width, delay, dur, drop: rand() > 0.35 };
    });
  }, [count, seed, maxLength, speed]);

  return (
    <div aria-hidden className={`horror-motion horror-still pointer-events-none absolute inset-x-0 top-0 ${className}`}>
      {/* Pooling band along the top edge */}
      {band && (
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color} 8%, ${color} 92%, transparent)` }}
        />
      )}
      {drips.map((d, i) => (
        <div key={i} className="absolute top-0" style={{ left: `${d.x}%`, width: d.width }}>
          <div
            className="origin-top rounded-b-full"
            style={{
              height: d.len,
              width: d.width,
              background: `linear-gradient(180deg, ${color}, #6d0009 70%, #3d0005)`,
              boxShadow: `inset -1px 0 1px rgba(255,120,120,0.25)`,
              animation: `drip-grow ${d.dur}s cubic-bezier(.5,0,.3,1) ${d.delay}s both`,
            }}
          />
          {/* Bulb at the tip */}
          <div
            className="absolute rounded-full"
            style={{
              top: d.len - d.width * 0.6,
              left: -d.width * 0.2,
              width: d.width * 1.4,
              height: d.width * 1.5,
              background: color,
              animation: `drip-grow ${d.dur}s cubic-bezier(.5,0,.3,1) ${d.delay}s both`,
              transformOrigin: `50% ${-d.len}px`,
            }}
          />
          {falling && d.drop && (
            <div
              className="absolute rounded-full"
              style={{
                top: d.len,
                left: 0,
                width: d.width,
                height: d.width * 1.6,
                background: color,
                animation: `drop-fall ${d.dur * 1.6}s cubic-bezier(.55,0,1,.45) ${d.delay + d.dur}s infinite`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
