import { localeFor } from '@/lib/languages';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** users.memberSince is stored as "Member since Nov 2026"; show the month in the UI language. */
export const since = (s: string, lang: string) => {
  const text = s.replace('Member since', '').trim();
  const m = /^([A-Z][a-z]{2}) (\d{4})$/.exec(text);
  const month = m ? MONTHS.indexOf(m[1]) : -1;
  if (month < 0) return text;
  return new Date(Number(m![2]), month, 1).toLocaleDateString(localeFor(lang), { month: 'short', year: 'numeric' });
};
