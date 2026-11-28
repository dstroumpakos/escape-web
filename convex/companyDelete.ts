import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireAdminSession } from "./adminSession";

/**
 * Admin: delete any company (signed-up or admin-made) and everything tied to
 * it: rooms and their slots, bookings, posts, followers, photos, stats, jobs,
 * sessions and stored files. Meant for test and junk accounts.
 *
 * The admin mutation logs the company out and hides it at once; the rows are
 * then removed in small batches (cascade) so a big company never hits the
 * per-mutation limits. The company row itself goes last.
 *
 * Not touched (no index to find them, and they belong to the player): passport
 * stamps. Code that reads them already copes with a missing room.
 */

const BATCH = 250;

/** Field names that hold stored files (any depth). */
const FILE_KEY = /storageId$/i;
const FILE_LISTS = new Set(["photoIds", "photoStorageIds"]);

async function deleteFiles(ctx: MutationCtx, value: unknown, key = ""): Promise<void> {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const x of value) {
      if (FILE_LISTS.has(key) && typeof x === "string") await ctx.storage.delete(x as Id<"_storage">).catch(() => {});
      else await deleteFiles(ctx, x, key);
    }
    return;
  }
  if (typeof value === "object") {
    for (const [k, x] of Object.entries(value as Record<string, unknown>)) {
      if (FILE_KEY.test(k) && typeof x === "string") await ctx.storage.delete(x as Id<"_storage">).catch(() => {});
      else if (typeof x === "object") await deleteFiles(ctx, x, k);
    }
  }
}

type Budget = { left: number };

/** Delete one row, its files, and the rows that only make sense with it. */
async function remove(ctx: MutationCtx, table: string, doc: any, b: Budget): Promise<void> {
  if (table === "bookings") {
    for (const t of [
      "bookingPerformance",
      "roomReports",
      "playerReports",
      "gameSessions",
      "bookingPhotos",
      "reviews",
      "merchOrders",
      "bookingInvites",
    ] as const) {
      const rows = await (ctx.db.query(t) as any).withIndex("by_booking", (q: any) => q.eq("bookingId", doc._id)).collect();
      for (const r of rows) await remove(ctx, t, r, b);
    }
  }
  if (table === "gameSessions") {
    const rows = await ctx.db.query("gameParticipants").withIndex("by_game", (q) => q.eq("gameId", doc._id)).collect();
    for (const r of rows) await remove(ctx, "gameParticipants", r, b);
  }
  if (table === "posts") {
    for (const t of ["postLikes", "postComments"] as const) {
      const rows = await (ctx.db.query(t) as any).withIndex("by_post", (q: any) => q.eq("postId", doc._id)).collect();
      for (const r of rows) await remove(ctx, t, r, b);
    }
  }
  // A child may already be gone (reached from two parents)
  if (!(await ctx.db.get(doc._id))) return;
  await deleteFiles(ctx, doc);
  await ctx.db.delete(doc._id);
  b.left--;
}

/** Delete up to the budget from one indexed query. True when nothing is left. */
async function drain(ctx: MutationCtx, table: string, index: string, field: string, id: string, b: Budget) {
  while (b.left > 0) {
    const rows = await (ctx.db.query(table as any) as any)
      .withIndex(index, (q: any) => q.eq(field, id))
      .take(Math.min(50, b.left));
    if (rows.length === 0) return true;
    for (const r of rows) await remove(ctx, table, r, b);
  }
  return false;
}

// [table, index, field] for rows keyed by the company
const BY_COMPANY: [string, string, string][] = [
  ["companySessions", "by_company", "companyId"],
  ["pushTokens", "by_company", "companyId"],
  ["companyPaymentCredentials", "by_company", "companyId"],
  ["bookings", "by_company", "companyId"],
  ["posts", "by_author_company", "authorCompanyId"],
  ["companyFollows", "by_company", "companyId"],
  ["stampSessions", "by_company", "companyId"],
  ["playLogs", "by_company_status", "companyId"],
  ["instagramPosts", "by_company", "companyId"],
  ["bookClicks", "by_company_date", "companyId"],
  ["roomViews", "by_company_date", "companyId"],
  ["jobPosts", "by_company", "companyId"],
  ["slotOffers", "by_company_date", "companyId"],
  ["playerReports", "by_company", "companyId"],
  ["companyPhotoPresets", "by_company", "companyId"],
  ["bookingPhotos", "by_company", "companyId"],
  ["standalonePhotos", "by_company", "companyId"],
  ["companyPromoPhotos", "by_company", "companyId"],
  ["photoEmails", "by_company", "companyId"],
  ["roomPhotoPresets", "by_company", "companyId"],
  ["platformFeeInvoices", "by_company_month", "companyId"],
  ["gameSessions", "by_company", "companyId"],
  ["merchProducts", "by_company", "companyId"],
  ["merchOrders", "by_company", "companyId"],
];

// Rows keyed by one of its rooms
const BY_ROOM: [string, string][] = [
  ["timeSlots", "by_room_date"],
  ["bookings", "by_room"],
  ["posts", "by_room"],
  ["stampSessions", "by_room_created"],
  ["playLogs", "by_room"],
  ["bookClicks", "by_room_date"],
  ["visitorMarks", "by_mark"],
  ["roomViews", "by_room_date"],
  ["slotOffers", "by_room_date"],
  ["slotAlerts", "by_slot"],
  ["guestSlotAlerts", "by_slot"],
  ["reviews", "by_room"],
  ["standalonePhotos", "by_room"],
  ["roomPhotoPresets", "by_room"],
  ["gameSessions", "by_room"],
];

export const cascade = internalMutation({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }): Promise<void> => {
    const b: Budget = { left: BATCH };
    const again = async (): Promise<void> => {
      await ctx.scheduler.runAfter(0, internal.companyDelete.cascade, { companyId });
    };

    for (const [table, index, field] of BY_COMPANY) {
      if (!(await drain(ctx, table, index, field, companyId, b))) return again();
    }

    // Rooms one by one: their rows, then the room
    for (;;) {
      const room = await ctx.db.query("rooms").withIndex("by_company", (q) => q.eq("companyId", companyId)).first();
      if (!room) break;
      for (const [table, index] of BY_ROOM) {
        if (!(await drain(ctx, table, index, "roomId", room._id, b))) return again();
      }
      if (b.left <= 0) return again();
      await remove(ctx, "rooms", room, b);
    }

    const company = await ctx.db.get(companyId);
    if (company) {
      await deleteFiles(ctx, company);
      await ctx.db.delete(companyId);
    }
  },
});

/** What a delete would remove, for the confirm dialog (counts capped at 1000). */
export const adminDeletePreview = query({
  args: { sessionToken: v.string(), companyId: v.id("companies") },
  handler: async (ctx, { sessionToken, companyId }) => {
    await requireAdminSession(ctx, sessionToken);
    const company = await ctx.db.get(companyId);
    if (!company) return null;
    const count = async (table: string, index: string, field: string) =>
      (await (ctx.db.query(table as any) as any).withIndex(index, (q: any) => q.eq(field, companyId)).take(1001)).length;
    return {
      name: company.name,
      rooms: await count("rooms", "by_company", "companyId"),
      bookings: await count("bookings", "by_company", "companyId"),
      followers: await count("companyFollows", "by_company", "companyId"),
      posts: await count("posts", "by_author_company", "authorCompanyId"),
      invoices: await count("platformFeeInvoices", "by_company_month", "companyId"),
    };
  },
});

/** Admin: delete a company. The typed name must match, as a guard against a wrong click. */
export const adminDelete = mutation({
  args: { sessionToken: v.string(), companyId: v.id("companies"), confirmName: v.string() },
  handler: async (ctx, { sessionToken, companyId, confirmName }) => {
    await requireAdminSession(ctx, sessionToken);
    const company = await ctx.db.get(companyId);
    if (!company) throw new ConvexError("Company not found");
    if (confirmName.trim() !== (company.name ?? "").trim()) throw new ConvexError("The name does not match");
    // Log it out and hide it right away; the cascade removes the rest
    const sessions = await ctx.db.query("companySessions").withIndex("by_company", (q) => q.eq("companyId", companyId)).collect();
    for (const s of sessions) await ctx.db.delete(s._id);
    await ctx.db.patch(companyId, { onboardingStatus: "declined" });
    const rooms = await ctx.db.query("rooms").withIndex("by_company", (q) => q.eq("companyId", companyId)).collect();
    for (const r of rooms) if (r.isActive !== false) await ctx.db.patch(r._id, { isActive: false });
    await ctx.scheduler.runAfter(0, internal.companyDelete.cascade, { companyId });
  },
});
