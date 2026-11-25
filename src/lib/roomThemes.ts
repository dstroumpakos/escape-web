import {
  Skull,
  HeartPulse,
  Search,
  Fingerprint,
  Puzzle,
  Compass,
  Landmark,
  Cpu,
  Microscope,
  Ghost,
  Swords,
  Sparkles,
  Laugh,
  Zap,
  Baby,
  Brain,
  Biohazard,
  Droplets,
  type LucideIcon,
} from 'lucide-react';

/**
 * The one list of room categories. Companies pick from it when they create a
 * room, players filter by it on Discover and the home page links to it.
 * `value` is what gets stored in rooms.theme, so never rename an existing one.
 */
export interface RoomTheme {
  value: string;
  key: string; // i18n key
  icon: LucideIcon;
  tint: string; // home-page tile glow
  home?: boolean; // shown as a tile in the home "Choose your theme" grid
  hero?: boolean; // shown as a chip under the hero
}

export const ROOM_THEMES: RoomTheme[] = [
  { value: 'Horror', key: 'theme.horror', icon: Skull, tint: 'rgba(200,16,27,0.55)', home: true, hero: true },
  { value: 'Thriller', key: 'theme.thriller', icon: HeartPulse, tint: 'rgba(170,30,60,0.5)', home: true },
  { value: 'Mystery', key: 'theme.mystery', icon: Search, tint: 'rgba(110,40,140,0.5)', home: true, hero: true },
  { value: 'Detective', key: 'theme.detective', icon: Fingerprint, tint: 'rgba(40,70,160,0.5)', home: true, hero: true },
  { value: 'Puzzle', key: 'theme.puzzle', icon: Puzzle, tint: 'rgba(30,140,110,0.5)', home: true, hero: true },
  { value: 'Adventure', key: 'theme.adventure', icon: Compass, tint: 'rgba(180,90,20,0.5)', home: true, hero: true },
  { value: 'Historical', key: 'theme.history', icon: Landmark, tint: 'rgba(150,110,30,0.5)', home: true, hero: true },
  { value: 'Sci-Fi', key: 'theme.scifi', icon: Cpu, tint: 'rgba(20,130,140,0.5)', home: true, hero: true },
  { value: 'Science', key: 'theme.science', icon: Microscope, tint: 'rgba(40,130,60,0.5)', home: true },
  { value: 'Paranormal', key: 'theme.paranormal', icon: Ghost, tint: 'rgba(70,60,160,0.5)', home: true, hero: true },
  { value: 'Medieval', key: 'theme.medieval', icon: Swords, tint: 'rgba(160,60,20,0.5)', home: true, hero: true },
  { value: 'Fantasy', key: 'theme.fantasy', icon: Sparkles, tint: 'rgba(130,60,170,0.5)', home: true },
  { value: 'Comedy', key: 'theme.comedy', icon: Laugh, tint: 'rgba(190,150,20,0.5)' },
  // Subcategories added with room categories (convex/roomCategories.ts)
  { value: 'Action', key: 'theme.action', icon: Zap, tint: 'rgba(200,110,20,0.5)' },
  { value: 'Kids', key: 'theme.kids', icon: Baby, tint: 'rgba(60,150,200,0.5)' },
  { value: 'Psychological', key: 'theme.psychological', icon: Brain, tint: 'rgba(120,40,90,0.5)' },
  { value: 'Zombie', key: 'theme.zombie', icon: Biohazard, tint: 'rgba(80,120,30,0.5)' },
  { value: 'Splatter', key: 'theme.splatter', icon: Droplets, tint: 'rgba(180,10,20,0.6)' },
];

export const ROOM_THEME_VALUES = ROOM_THEMES.map((th) => th.value);

/** Translated label for a stored theme value; unknown values pass through. */
export function themeLabel(t: (key: string) => string, value: string): string {
  const theme = ROOM_THEMES.find((th) => th.value === value);
  return theme ? t(theme.key) : value;
}
