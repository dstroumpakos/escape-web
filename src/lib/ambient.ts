'use client';

import { useSyncExternalStore } from 'react';

/**
 * The site's background music on/off (components/horror/AmbientMusic.tsx).
 * On unless the visitor turned it off; the choice is kept in this browser.
 * Browsers only allow sound after a click, so "on" means: it starts with the
 * visitor's first click or key press.
 */
const KEY = 'unlocked_music';
const listeners = new Set<() => void>();
let enabled: boolean | null = null;

function read(): boolean {
  if (enabled === null) {
    try {
      enabled = localStorage.getItem(KEY) !== 'off';
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function setMusicEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {}
  listeners.forEach((l) => l());
}

export function toggleMusic() {
  setMusicEnabled(!read());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Server render: off, so the button never flips after hydration in a way that matters. */
export function useMusicEnabled() {
  return useSyncExternalStore(subscribe, read, () => false);
}
