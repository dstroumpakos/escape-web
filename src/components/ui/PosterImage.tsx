'use client';

/**
 * A room image filling its card in the Companies section. The company or the
 * admin crops it to the card beforehand (RoomCardCrop.tsx); an uncropped photo
 * is centred.
 */
export function PosterImage({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  );
}
