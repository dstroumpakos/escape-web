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
