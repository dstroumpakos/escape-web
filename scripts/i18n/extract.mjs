// Dumps one language of the site's TS dictionaries to JSON: the core object in
// src/lib/i18n.tsx plus every `xxxTranslations` file it imports (i18nCompany, i18nShop, ...).
// Usage: node scripts/i18n/extract.mjs <lang> <out.json>
import { transformSync } from 'esbuild';
import fs from 'node:fs';

const [lang, out] = process.argv.slice(2);
const load = (code) => {
  const js = transformSync(code, { loader: 'ts', format: 'cjs' }).code;
  const m = { exports: {} };
  new Function('module', 'exports', js)(m, m.exports);
  return m.exports;
};

const core = fs.readFileSync('src/lib/i18n.tsx', 'utf8');
const start = core.indexOf('const translations');
const end = core.indexOf('\n};', start) + 3;
const result = { ...load(core.slice(start, end).replace(/^const translations[^=]*=/, 'module.exports ='))[lang] };

// import { chatTranslations } from './i18nChat';  →  merge chatTranslations[lang]
for (const [, name, file] of core.matchAll(/import\s*\{\s*(\w+Translations)\s*\}\s*from\s*'\.\/(\w+)'/g)) {
  Object.assign(result, load(fs.readFileSync(`src/lib/${file}.ts`, 'utf8'))[name]?.[lang] ?? {});
}

fs.writeFileSync(out, JSON.stringify(result, null, 1));
console.log(lang, Object.keys(result).length, 'keys,', JSON.stringify(result).length, 'chars');
