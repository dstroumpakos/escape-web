/**
 * Feature switches.
 *
 * BOOKING_ENABLED: UNLOCKED's own booking for players (book page, checkout,
 * last-minute offers, tickets). Off by default: rooms are adverts and "Book
 * now" sends players to the escape room's own site (convex/externalLinks.ts).
 * The booking code stays; set NEXT_PUBLIC_BOOKING_ENABLED=1 to bring it back.
 * The company widget and the company portal keep working either way.
 */
export const BOOKING_ENABLED = process.env.NEXT_PUBLIC_BOOKING_ENABLED === '1';

/**
 * FOLLOW_ENABLED: following players, worded as "following their trail"
 * (button, trackers / on the trail counts, the "Trails" feed and "trails to
 * follow"; convex/social.ts). On; NEXT_PUBLIC_FOLLOW_ENABLED=0 hides it.
 */
export const FOLLOW_ENABLED = process.env.NEXT_PUBLIC_FOLLOW_ENABLED !== '0';

/**
 * PASSPORT_ENABLED: the passport and QR stamps (player passport, rooms played,
 * the stamp scan page, the tower game; the company's QR stamps and rooms
 * played approvals). Hidden for now; the code stays.
 * NEXT_PUBLIC_PASSPORT_ENABLED=1 brings it back.
 */
export const PASSPORT_ENABLED = process.env.NEXT_PUBLIC_PASSPORT_ENABLED === '1';
