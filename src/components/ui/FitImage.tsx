'use client';

/**
 * The whole photo, never cropped: room posters come in every shape (tall
 * posters, wide banners), so the photo sits inside the box and a blurred,
 * darkened copy of it fills the space around. Fill the parent (give the
 * parent a size or an aspect ratio and `relative`/`overflow-hidden`).
 */
export function FitImage({ src, alt = '', className = '', zoom = true }: { src: string; alt?: string; className?: string; zoom?: boolean }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl brightness-50 saturate-150" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`absolute inset-0 w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)] ${zoom ? 'transition-transform duration-500 group-hover:scale-105' : ''}`}
      />
    </div>
  );
}
