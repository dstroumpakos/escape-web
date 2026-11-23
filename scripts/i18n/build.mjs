// Merges translated chunks (scripts/i18n/out/<lang>/part-N.json) into
// src/locales/<lang>.json, which the site lazy-loads (src/lib/i18n.tsx).
// Usage: node scripts/i18n/build.mjs [lang ...]   (default: every folder in out/)
//
// Workflow for new or changed English texts:
//   1. node scripts/i18n/extract.mjs en scripts/i18n/en.json
//   2. translate the new keys into scripts/i18n/out/<lang>/
//   3. node scripts/i18n/validate.mjs <lang> && node scripts/i18n/build.mjs <lang>
// Keys missing from a locale fall back to English at runtime.
import fs from 'node:fs';

const langs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync('scripts/i18n/out').filter((d) => fs.statSync(`scripts/i18n/out/${d}`).isDirectory());

fs.mkdirSync('src/locales', { recursive: true });
const en = JSON.parse(fs.readFileSync('scripts/i18n/en.json', 'utf8'));

for (const lang of langs) {
  const dir = `scripts/i18n/out/${lang}`;
  const merged = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    Object.assign(merged, JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')));
  }
  // Keep only keys the site knows, and skip values identical to English (the fallback covers them).
  const out = {};
  for (const k of Object.keys(en)) if (typeof merged[k] === 'string' && merged[k] !== en[k]) out[k] = merged[k];
  fs.writeFileSync(`src/locales/${lang}.json`, JSON.stringify(out));
  const missing = Object.keys(en).filter((k) => !(k in merged)).length;
  console.log(`${lang}: ${Object.keys(out).length} keys written${missing ? `, ${missing} missing (English fallback)` : ''}`);
}
