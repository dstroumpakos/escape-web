'use client';

/**
 * A room photo in a portrait card, always whole (nothing cut, whatever its
 * shape): the photo sits centred over a blurred copy of itself that fills
 * the rest of the card. Portrait posters fill it almost edge to edge.
 */
export function PosterImage({ src, alt }: { src: string; alt: string }) {
  return (
    <>
      <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60" />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
      />
    </>
  );
}
