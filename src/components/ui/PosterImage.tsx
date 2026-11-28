'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A room photo in a portrait card. Portrait posters fill the card (little is
 * cut). Landscape or square photos would lose their sides that way, so they
 * are shown whole instead, centred over a blurred copy of themselves.
 */
export function PosterImage({ src, alt }: { src: string; alt: string }) {
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  const ref = useRef<HTMLImageElement>(null);
  const check = (img: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = img;
    // Card is 5:7 (0.71). Close to that: fill. Wider than 0.9 (square, landscape): show whole.
    if (w && h && w / h > 0.9) setFit('contain');
  };
  // A cached photo can finish loading before React listens for onLoad
  useEffect(() => {
    if (ref.current?.complete) check(ref.current);
  }, [src]);
  return (
    <>
      {fit === 'contain' && (
        <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        ref={ref}
        onLoad={(e) => check(e.currentTarget)}
        className={`absolute inset-0 w-full h-full transition-transform duration-300 group-hover:scale-105 ${
          fit === 'cover' ? 'object-cover' : 'object-contain pb-12'
        }`}
      />
    </>
  );
}
