'use client';

import { useTranslation, Language } from '@/lib/i18n';

const flags: Record<Language, { emoji: string; label: string }> = {
  en: { emoji: '🇬🇧', label: 'English' },
  el: { emoji: '🇬🇷', label: 'Ελληνικά' },
};

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

  const next: Language = language === 'en' ? 'el' : 'en';

  return (
    <button
      onClick={() => setLanguage(next)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-surface/50 hover:bg-brand-surface border border-brand-border/30 transition-all text-sm"
      aria-label={`Switch to ${flags[next].label}`}
      title={`Switch to ${flags[next].label}`}
    >
      <span className="text-lg leading-none">{flags[language].emoji}</span>
      <span className="hidden sm:inline text-brand-text-secondary text-xs font-medium">
        {language.toUpperCase()}
      </span>
    </button>
  );
}
