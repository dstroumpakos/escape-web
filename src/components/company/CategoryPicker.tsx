'use client';

import { Check, KeyRound, Skull, VenetianMask } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { themeLabel } from '@/lib/roomThemes';
import { CATEGORIES, SUBTHEMES, MAX_SUBTHEMES, sideOfCategory, cleanSubthemes, type Category } from '../../../convex/roomCategories';

const LOOK: Record<Category, { Icon: React.ElementType; on: string }> = {
  puzzle: { Icon: KeyRound, on: 'border-sky-400/70 bg-sky-500/10 text-sky-200' },
  puzzle_actor: { Icon: VenetianMask, on: 'border-amber-400/70 bg-amber-500/10 text-amber-200' },
  horror: { Icon: Skull, on: 'border-red-500/70 bg-red-500/10 text-red-200' },
};

/**
 * What kind of room it is (convex/roomCategories.ts): puzzles, puzzles with an
 * actor or horror, which decides the side of the site it shows on, then as
 * many of that side's subcategories as fit.
 */
export function CategoryPicker({
  category,
  subthemes,
  onChange,
}: {
  category: Category;
  subthemes: string[];
  onChange: (category: Category, subthemes: string[]) => void;
}) {
  const { t } = useTranslation();
  const options = SUBTHEMES[sideOfCategory(category)];
  const toggle = (s: string) =>
    onChange(category, subthemes.includes(s) ? subthemes.filter((x) => x !== s) : [...subthemes, s].slice(0, MAX_SUBTHEMES));

  return (
    <div className="col-span-full space-y-4">
      <fieldset>
        <legend className="block text-sm font-medium text-brand-text-secondary mb-2">{t('cat.label')}</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {CATEGORIES.map((c) => {
            const { Icon, on } = LOOK[c];
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                // Subcategories the other side also has are kept
                onClick={() => onChange(c, cleanSubthemes(c, subthemes))}
                className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                  active ? on : 'border-white/10 bg-brand-bg text-brand-text-secondary hover:border-white/25'
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <Icon className="w-4 h-4" /> {t(`cat.${c}`)}
                </span>
                <span className="mt-1 block text-xs opacity-80">{t(`cat.${c}_hint`)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-medium text-brand-text-secondary mb-2">{t('cat.subs_label')}</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((s) => {
            const on = subthemes.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  on ? 'border-brand-red bg-brand-red/20 text-brand-bone' : 'border-white/10 bg-brand-bg text-brand-text-secondary hover:border-white/25'
                }`}
              >
                {on && <Check className="w-3.5 h-3.5" />} {themeLabel(t, s)}
              </button>
            );
          })}
        </div>
        {subthemes.length === 0 && <p className="mt-2 text-xs text-amber-300/90">{t('cat.subs_required')}</p>}
      </fieldset>
    </div>
  );
}
