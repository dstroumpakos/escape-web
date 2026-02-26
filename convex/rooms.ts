import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper: enrich a room with company partner info
async function enrichRoom(ctx: any, room: any) {
  let isEarlyAccessPartner = false;
  let companyName = "";
  if (room.companyId) {
    const company = await ctx.db.get(room.companyId);
    if (company) {
      isEarlyAccessPartner = !!company.subscriptionEnabled;
      companyName = company.name;
    }
  }
  return { ...room, isEarlyAccessPartner, companyName };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db.query("rooms").collect();
    return await Promise.all(rooms.map((r) => enrichRoom(ctx, r)));
  },
});

export const getById = query({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.id);
    if (!room) return null;
    return await enrichRoom(ctx, room);
  },
});

export const featured = query({
  args: {},
  handler: async (ctx) => {
    // Get explicitly featured rooms
    const featured = await ctx.db
      .query("rooms")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();

    // Also include EA partner rooms (Featured Spotlight benefit)
    const featuredIds = new Set(featured.map((r) => r._id.toString()));
    const allRooms = await ctx.db.query("rooms").collect();
    for (const room of allRooms) {
      if (featuredIds.has(room._id.toString())) continue;
      if (room.companyId && room.isActive !== false) {
        const company = await ctx.db.get(room.companyId);
        if (company?.subscriptionEnabled) {
          featured.push(room);
          featuredIds.add(room._id.toString());
        }
      }
    }

    return await Promise.all(featured.map((r) => enrichRoom(ctx, r)));
  },
});

export const trending = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_trending", (q) => q.eq("isTrending", true))
      .collect();
    return await Promise.all(rooms.map((r) => enrichRoom(ctx, r)));
  },
});

export const byTheme = query({
  args: { theme: v.string() },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_theme", (q) => q.eq("theme", args.theme))
      .collect();
    return await Promise.all(rooms.map((r) => enrichRoom(ctx, r)));
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("rooms").collect();
    const q = args.query.toLowerCase();
    const filtered = all.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.theme.toLowerCase().includes(q)
    );
    return await Promise.all(filtered.map((r) => enrichRoom(ctx, r)));
  },
});
