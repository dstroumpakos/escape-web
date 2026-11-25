'use client';

import { useSyncExternalStore } from 'react';
import { sideOf } from '../../convex/roomCategories';

/**
 * The player's side of the site: "puzzle" (riddles and mystery, no fear) or
 * "horror" (the full dark experience). Picked on the home page; saved in this
 * browser and set as <html data-mode> before the first paint (MODE_SCRIPT), so
 * globals.css re-colours the whole site at once. No choice yet = everything.
 */
export type Mode = 'puzzle' | 'horror';

import { MODE_KEY as KEY } from './modeScript';
const EVENT = 'unlocked-mode';

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

/**
 * Rooms for the side: each room belongs to exactly one side, from its category
 * (convex/roomCategories.ts): puzzles and puzzles with an actor on the puzzle
 * side, horror on the horror side. No side picked = every room.
 */
export function forMode<T extends RoomKind>(rooms: T[], mode: Mode | null | undefined): T[] {
  return mode ? rooms.filter((r) => sideOf(r) === mode) : rooms;
}

type RoomKind = { category?: string | null; subthemes?: string[] | null; theme?: string | null; fearLevel?: string | null };
export { categoryOf, sideOf, subthemesOf, SUBTHEMES, CATEGORIES, type Category } from '../../convex/roomCategories';
