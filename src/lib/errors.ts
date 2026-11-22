/**
 * Turn Convex / network errors into something a company owner can read.
 * Convex wraps thrown errors as
 *   "[CONVEX M(companies:loginCompany)] [Request ID: …] Server Error Uncaught Error: Incorrect password at handler …"
 * and in production hides the message entirely ("… Server Error").
 */
export function cleanError(err: unknown): string {
  // ConvexError keeps its message in production (plain Error does not)
  const data = (err as any)?.data;
  if (typeof data === 'string' && data.trim()) return data.trim();
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : (err as any)?.message || '';
  const uncaught = raw.match(/Uncaught (?:Error|ConvexError):\s*([\s\S]*?)(?:\s+at\s+\S+\s*\(|\n\s+at |$)/);
  let msg = (uncaught ? uncaught[1] : raw).trim();
  msg = msg
    .replace(/^\[CONVEX [^\]]*\]\s*/, '')
    .replace(/^\[Request ID: [^\]]*\]\s*/, '')
    .replace(/^Server Error\s*/, '')
    .trim();
  return msg;
}

/** Known server messages → translation keys. */
const KNOWN: Record<string, string> = {
  'No business account found with this email': 'cx.err.no_account',
  'Incorrect password': 'cx.err.wrong_password',
  'Incorrect email or password': 'cx.err.login_failed',
  TOO_MANY_ATTEMPTS: 'cx.err.too_many_attempts',
  'Email already registered': 'cx.err.email_taken',
  'Invalid email format': 'cx.err.invalid_email',
  'This time slot is already booked': 'cx.err.slot_taken',
  'This time slot is already booked or blocked': 'cx.err.slot_taken',
  'The new time slot is already booked': 'cx.err.slot_taken',
  'Password must be at least 8 characters': 'cx.pw.too_short',
  'Password must contain at least one uppercase letter': 'cx.pw.need_upper',
  'Password must contain at least one number': 'cx.pw.need_number',
  'Invalid discount code':'company.onboarding.discount_invalid_code',
  'This code is no longer active': 'cx.err.code_inactive',
  'This code has expired': 'cx.err.code_expired',
  'This code has been fully redeemed': 'cx.err.code_used_up',
  // Reports (convex/reports.ts)
  'This booking has already been reported': 'reports.err.already_reported',
  'Reports can only be sent within 24 hours after the game': 'reports.err.company_window',
  'You can report a player once the game has started': 'reports.err.not_started',
  'You have already reported this game': 'reports.err.room_already',
  'Reports can be sent up to 30 days after the game': 'reports.err.room_window',
  'Please describe what happened': 'reports.err.describe',
  'Photos must be images up to 10 MB': 'reports.err.photo',
  'Up to 5 photos': 'reports.err.photo_count',
};

export function friendlyError(
  err: unknown,
  t: (key: string, params?: Record<string, string>) => string,
  fallbackKey = 'cx.err.generic'
): string {
  const msg = cleanError(err);
  if (KNOWN[msg]) return t(KNOWN[msg]);
  if (/^Room limit reached/i.test(msg)) return t('cx.err.room_limit');
  // QR limits per room (convex/passport.ts)
  const soon = /^A QR for this room was made (\d+) minutes ago\. You can make the next one in (\d+) minutes\./.exec(msg);
  if (soon) return t('st.qr_too_soon', { ago: soon[1], mins: soon[2] });
  const day = /^This room already had (\d+) QRs/.exec(msg);
  if (day) return t('st.qr_day_limit', { n: day[1] });
  if (
    !msg ||
    /Server Error|Called by client|Request ID|ArgumentValidationError|Validator|Failed to fetch|NetworkError|network/i.test(msg)
  ) {
    return t(fallbackKey);
  }
  return msg;
}
