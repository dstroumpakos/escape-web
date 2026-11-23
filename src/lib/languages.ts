/**
 * Every language the website speaks.
 * en / el / nl are bundled (see i18n.tsx); the rest are generated JSON
 * dictionaries in src/locales/<code>.json, loaded on demand.
 * Keep LANGUAGE_CODES in sync with convex/languages.ts.
 */

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷', locale: 'el-GR' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱', locale: 'nl-NL' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
  { code: 'es', label: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', locale: 'it-IT' },
  { code: 'pt', label: 'Português', flag: '🇵🇹', locale: 'pt-PT' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', locale: 'pl-PL' },
  { code: 'ro', label: 'Română', flag: '🇷🇴', locale: 'ro-RO' },
  { code: 'bg', label: 'Български', flag: '🇧🇬', locale: 'bg-BG' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', locale: 'tr-TR' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', locale: 'ru-RU' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', locale: 'uk-UA' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', locale: 'ar', rtl: true },
  { code: 'zh', label: '中文', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', locale: 'ko-KR' },
] as const satisfies readonly { code: string; label: string; flag: string; locale: string; rtl?: boolean }[];

export type Language = (typeof LANGUAGES)[number]['code'];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as Language[];

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGE_CODES as string[]).includes(value);
}

/** BCP 47 locale for Intl / toLocaleString (e.g. 'de' → 'de-DE'). */
export function localeFor(lang: string): string {
  return LANGUAGES.find((l) => l.code === lang)?.locale ?? 'en-GB';
}

export function isRtl(lang: string): boolean {
  return LANGUAGES.some((l) => l.code === lang && 'rtl' in l && l.rtl);
}

/** First supported language from the browser's preference list, or null. */
export function detectBrowserLanguage(prefs: readonly string[] | undefined): Language | null {
  for (const pref of prefs ?? []) {
    const base = pref.toLowerCase().split('-')[0];
    if (isLanguage(base)) return base;
  }
  return null;
}
