'use client';

import { useSyncExternalStore } from 'react';
import { HORROR_THEME_VALUES } from './roomThemes';

/**
 * The player's side of the site: "puzzle" (riddles and mystery, no fear) or
 * "horror" (the full dark experience). Picked on the home page; saved in this
 * browser and set as <html data-mode> before the first paint (MODE_SCRIPT), so
 * globals.css re-colours the whole site at once. No choice yet = everything.
 */
export type Mode = 'puzzle' | 'horror';

import { MODE_KEY as KEY } from './modeScript';
const EVENT = 'unlocked-mode';

/** Room themes a puzzle player never sees. */
export const HORROR_THEMES = new Set(HORROR_THEME_VALUES);

function read(): Mode | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'puzzle' || v === 'horror' ? v : null;
  } catch {
    return null;
  }
}

export function setMode(mode: Mode | null) {
  try {
    if (mode) localStorage.setItem(KEY, mode);
    else localStorage.removeItem(KEY);
  } catch {
    /* private window: the choice lasts for this page only */
  }
  if (mode) document.documentElement.setAttribute('data-mode', mode);
  else document.documentElement.removeAttribute('data-mode');
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/** The current mode; undefined on the server and during hydration. */
export function useMode(): Mode | null | undefined {
  return useSyncExternalStore<Mode | null | undefined>(subscribe, read, () => undefined);
}

/** How scary a room is: "none" puzzle side only, "some" both sides, "high" horror side only. */
export type Fear = 'none' | 'some' | 'high';
export const FEAR_LEVELS: Fear[] = ['none', 'some', 'high'];

/** The company's own choice (rooms.fearLevel), or a guess from the theme for rooms that have none yet. */
export function fearOf(room: { theme?: string; fearLevel?: string }): Fear {
  const f = room.fearLevel;
  if (f === 'none' || f === 'some' || f === 'high') return f;
  return HORROR_THEMES.has(room.theme ?? '') ? 'high' : 'none';
}

/** Hides the scary rooms from a puzzle player ("a little fear" stays, marked). */
export function forMode<T extends { theme?: string; fearLevel?: string }>(rooms: T[], mode: Mode | null | undefined): T[] {
  return mode === 'puzzle' ? rooms.filter((r) => fearOf(r) !== 'high') : rooms;
}
