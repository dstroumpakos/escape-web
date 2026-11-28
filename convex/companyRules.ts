import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Version of the terms a company accepts in onboarding (the
 * company.onboarding.terms* texts in the website and the app). Change it
 * whenever those texts change, so companies.termsVersion shows who accepted what.
 */
export const COMPANY_TERMS_VERSION = "2026-11-28-free-listing";

/**
 * Only companies the UNLOCKED team approved are public: their rooms show up
 * on the site and can be booked. Until then a company can set up its rooms
 * in the portal, but nobody else sees them or can pay them. Declined or
 * pending companies stay hidden. (Companies from before onboarding existed
 * have no status and count as approved, as in merch.companyIsLive.)
 */
export function companyIsPublic(c: Doc<"companies"> | null | undefined): boolean {
  return !!c && (c.onboardingStatus === undefined || c.onboardingStatus === "approved");
}

/** Keeps only rooms whose company is public (rooms without a company stay). */
export async function filterPublicRooms<T extends { companyId?: Id<"companies"> }>(
  ctx: QueryCtx | MutationCtx,
  rooms: T[]
): Promise<T[]> {
  const ids = Array.from(new Set(rooms.map((r) => r.companyId).filter((x): x is Id<"companies"> => !!x)));
  const companies = await Promise.all(ids.map((id) => ctx.db.get(id)));
  const ok = new Set(ids.filter((_, i) => companyIsPublic(companies[i])).map((id) => id.toString()));
  return rooms.filter((r) => !r.companyId || ok.has(r.companyId.toString()));
}

/** Throws unless the room's company is public. Use before creating any booking. */
export async function assertRoomOpen(
  ctx: QueryCtx | MutationCtx,
  room: { companyId?: Id<"companies"> }
): Promise<void> {
  if (!room.companyId) return;
  const company = await ctx.db.get(room.companyId);
  if (!companyIsPublic(company)) throw new ConvexError("Room is not available");
}

// ─── Room data checks (createRoom / updateRoom) ───
// Prices, player counts and times are used to work out booking totals, so
// nonsense values (negative prices, 0 players, "99:99") must not get in.
// Only the fields that are sent are checked, so older rooms can still be saved.

function num(label: string, value: unknown, min: number, max: number, integer = false) {
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new ConvexError(`${label} must be ${integer ? "a whole number " : ""}between ${min} and ${max}`);
  }
}

function text(label: string, value: unknown, max: number) {
  if (typeof value === "string" && value.length > max) {
    throw new ConvexError(`${label} is too long (max ${max} characters)`);
  }
}

// "10:00", "9:30" (web) or "10:00 AM" (app).
const TIME_RE = /^([01]?[0-9]|2[0-3]):[0-5][0-9]( ?[AaPp][Mm])?$/;
const DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export function checkRoomInput(r: Record<string, any>): void {
  if (r.title !== undefined && !String(r.title).trim()) throw new ConvexError("Give the room a name");
  text("Room name", r.title, 120);
  text("Location", r.location, 200);
  text("Players", r.players, 40);
  text("Theme", r.theme, 60);
  text("Description", r.description, 5000);
  text("Story", r.story, 10000);
  text("Terms of use", r.termsOfUse, 10000);
  text("Image link", r.image, 1000);
  for (const tr of [r.storyTranslations, r.descriptionTranslations]) {
    if (tr) for (const v of Object.values(tr)) text("Translation", v, 10000);
  }
  if (r.images !== undefined) {
    if (r.images.length > 15) throw new ConvexError("Up to 15 photos per room");
    for (const u of r.images) text("Image link", u, 1000);
  }
  if (r.tags !== undefined) {
    if (r.tags.length > 20) throw new ConvexError("Up to 20 tags");
    for (const t of r.tags) text("Tag", t, 40);
  }
  num("Price", r.price, 0, 10000);
  num("Duration (minutes)", r.duration, 5, 600, true);
  num("Difficulty", r.difficulty, 0, 10);
  num("Max difficulty", r.maxDifficulty, 1, 10);
  num("Minimum players", r.playersMin, 1, 50, true);
  num("Maximum players", r.playersMax, 1, 100, true);
  if (r.playersMin !== undefined && r.playersMax !== undefined && r.playersMin > r.playersMax) {
    throw new ConvexError("Minimum players can't be more than maximum players");
  }
  const groupPrices = (list: any[] | undefined) => {
    if (!list) return;
    if (list.length > 100) throw new ConvexError("Too many group prices");
    for (const g of list) {
      num("Group size", g.players, 1, 100, true);
      num("Group price", g.price, 0, 100000);
    }
  };
  groupPrices(r.pricePerGroup);
  if (r.defaultTimeSlots !== undefined) {
    if (r.defaultTimeSlots.length > 48) throw new ConvexError("Up to 48 time slots a day");
    for (const s of r.defaultTimeSlots) {
      // An empty row is the web form's "add slot" placeholder; it's harmless.
      if (s.time !== "" && !TIME_RE.test(s.time)) {
        throw new ConvexError(`"${String(s.time).slice(0, 10)}" is not a valid time (HH:MM)`);
      }
      num("Slot price", s.price, 0, 10000);
    }
  }
  if (r.overflowSlot) {
    if (r.overflowSlot.time !== "" && !TIME_RE.test(r.overflowSlot.time)) {
      throw new ConvexError("The extra slot needs a valid time (HH:MM)");
    }
    num("Slot price", r.overflowSlot.price, 0, 10000);
    groupPrices(r.overflowSlot.pricePerGroup);
    for (const d of r.overflowSlot.days) num("Day", d, 0, 6, true);
  }
  if (r.operatingDays !== undefined) {
    if (r.operatingDays.length > 7) throw new ConvexError("Too many operating days");
    for (const d of r.operatingDays) num("Day", d, 0, 6, true);
  }
  num("Latitude", r.latitude, -90, 90);
  num("Longitude", r.longitude, -180, 180);
  if (r.releaseDate !== undefined && r.releaseDate !== "" && !DATE_RE.test(r.releaseDate)) {
    throw new ConvexError("Release date must be YYYY-MM-DD");
  }
}
