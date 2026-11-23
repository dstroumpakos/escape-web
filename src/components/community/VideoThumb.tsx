'use client';

import { Play } from 'lucide-react';

/** A video tile: its first frame with a play mark. */
export function VideoThumb({ url }: { url: string }) {
  return (
    <span className="relative block w-full h-full">
      <video src={url + '#t=0.1'} muted playsInline preload="metadata" className="w-full h-full object-cover pointer-events-none" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-11 h-11 rounded-full bg-black/60 flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </span>
      </span>
    </span>
  );
}
