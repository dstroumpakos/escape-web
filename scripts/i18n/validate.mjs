// Checks translated chunks against the English source.
// Usage: node scripts/i18n/validate.mjs <lang>   (reads scripts/i18n/out/<lang>/part-N.json)
import fs from 'node:fs';
const lang = process.argv[2];
const ph = (s) => (s.match(/\{\{\s*\w+\s*\}\}|\{\w+\}/g) || []).map((x) => x.replace(/\s/g, '')).sort().join(',');
let problems = 0, total = 0;
for (const f of fs.readdirSync('scripts/i18n/src').sort()) {
  const src = JSON.parse(fs.readFileSync(`scripts/i18n/src/${f}`, 'utf8'));
  const p = `scripts/i18n/out/${lang}/${f}`;
  if (!fs.existsSync(p)) { console.log(`MISSING FILE ${p}`); problems++; continue; }
  let out;
  try { out = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { console.log(`BAD JSON ${p}: ${e.message}`); problems++; continue; }
  for (const k of Object.keys(src)) {
    total++;
    if (typeof out[k] !== 'string') { console.log(`${f} missing key: ${k}`); problems++; continue; }
    if (src[k].trim() && !out[k].trim()) { console.log(`${f} empty: ${k}`); problems++; }
    if (ph(src[k]) !== ph(out[k])) { console.log(`${f} placeholder mismatch: ${k} | en=${ph(src[k])} ${lang}=${ph(out[k])}`); problems++; }
  }
  for (const k of Object.keys(out)) if (!(k in src)) { console.log(`${f} extra key: ${k}`); problems++; }
}
console.log(`${lang}: ${total} keys checked, ${problems} problems`);
process.exit(problems ? 1 : 0);
