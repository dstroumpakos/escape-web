'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { LANGUAGES } from '@/lib/languages';

const langs = LANGUAGES.map((l) => ({ code: l.code, emoji: l.flag, label: l.label }));

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = langs.find((l) => l.code === language) || langs[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-surface/50 hover:bg-brand-surface border border-brand-border/30 transition-all text-sm"
        aria-label="Change language"
      >
        <span className="text-lg leading-none">{current.emoji}</span>
        <span className="hidden sm:inline text-brand-text-secondary text-xs font-medium">
          {current.code.toUpperCase()}
        </span>
      </button>

      {open && (
        <div className="absolute end-0 mt-1 w-44 max-h-[70vh] overflow-y-auto rounded-lg bg-brand-card border border-brand-border shadow-xl shadow-black/30 z-50">
          {langs.map((l) => (
            <button
              key={l.code}
              lang={l.code}
              onClick={() => { setLanguage(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-brand-surface/60 transition-colors ${
                l.code === language ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-text-secondary'
              }`}
            >
              <span className="text-lg leading-none">{l.emoji}</span>
              <span className="font-medium">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
