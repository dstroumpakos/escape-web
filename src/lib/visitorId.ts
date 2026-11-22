/**
 * A random, anonymous id for this browser, so the company stats count a
 * visitor once per room per day (convex/companyStats.ts). Not linked to the
 * player's account and never sent anywhere else.
 */
const KEY = 'unlocked_vid';
let memo: string | undefined;

function fresh(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

export function visitorId(): string {
  if (memo) return memo;
  let id = '';
  try { id = localStorage.getItem(KEY) || ''; } catch {}
  if (!/^[a-z0-9]{16,40}$/.test(id)) {
    id = fresh();
    try { localStorage.setItem(KEY, id); } catch {}
  }
  memo = id;
  return id;
}
