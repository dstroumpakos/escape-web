import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { hashPassword, verifyPassword } from "./passwordUtils";
import { validateEmail, validatePassword, requireNonEmpty } from "./validation";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!user) return null;

    // Resolve avatar from storage each time (signed URLs expire)
    let avatar = user.avatar;
    if (user.avatarStorageId) {
      const freshUrl = await ctx.storage.getUrl(user.avatarStorageId);
      if (freshUrl) avatar = freshUrl;
    }

    const badges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Compute real stats from bookings
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const played = allBookings.filter((b) => b.status === "completed").length;
    const uniqueRooms = new Set(
      allBookings.filter((b) => b.status === "completed").map((b) => b.roomId)
    ).size;

    const rank = getPlayerRank(played);

    const { password: _pw, ...safeUser } = user;
    return {
      ...safeUser,
      avatar,
      badges,
      played,
      escaped: uniqueRooms,
      awards: badges.filter((b) => b.earned).length,
      title: rank,
    };
  },
});

// ── Rank thresholds based on completed rooms ──
function getPlayerRank(completed: number): string {
  if (completed >= 100) return "rank_legend";
  if (completed >= 50) return "rank_master";
  if (completed >= 25) return "rank_expert";
  if (completed >= 10) return "rank_veteran";
  if (completed >= 5) return "rank_adventurer";
  if (completed >= 1) return "rank_explorer";
  return "rank_rookie";
}

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Resolve avatar from storage each time (signed URLs expire)
    let avatar = user.avatar;
    if (user.avatarStorageId) {
      const freshUrl = await ctx.storage.getUrl(user.avatarStorageId);
      if (freshUrl) avatar = freshUrl;
    }

    const badges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Compute real stats from bookings
    const allBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const played = allBookings.filter(
      (b) => b.status === "completed"
    ).length;
    const upcoming = allBookings.filter(
      (b) => b.status === "upcoming"
    ).length;
    // Count unique rooms completed
    const uniqueRooms = new Set(
      allBookings.filter((b) => b.status === "completed").map((b) => b.roomId)
    ).size;

    const rank = getPlayerRank(played);

    const { password: _pw, ...safeUser } = user;
    return {
      ...safeUser,
      avatar,
      badges,
      played,
      escaped: uniqueRooms,
      awards: badges.filter((b) => b.earned).length,
      title: rank,
      upcoming,
    };
  },
});

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    const trimmedName = args.name.trim();
    if (!trimmedName) throw new ConvexError("NAME_REQUIRED");
    if (!validateEmail(args.email)) throw new ConvexError("INVALID_EMAIL");
    const pwError = validatePassword(args.password);
    if (pwError) {
      if (pwError.includes("8 characters")) throw new ConvexError("PASSWORD_LENGTH");
      if (pwError.includes("uppercase")) throw new ConvexError("PASSWORD_UPPERCASE");
      if (pwError.includes("number")) throw new ConvexError("PASSWORD_NUMBER");
      throw new ConvexError("PASSWORD_INVALID");
    }

    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
    if (existing) {
      throw new ConvexError("EMAIL_EXISTS");
    }

    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const memberSince = `Member since ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const hashedPw = await hashPassword(args.password);

    const userId = await ctx.db.insert("users", {
      name: trimmedName,
      email: args.email.toLowerCase(),
      password: hashedPw,
      avatar: "",
      title: "Escape Rookie",
      memberSince,
      played: 0,
      escaped: 0,
      awards: 0,
      wishlist: [],
    });

    return userId;
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    if (!user) {
      throw new ConvexError("INVALID_CREDENTIALS");
    }

    if (!user.password) {
      throw new ConvexError("INVALID_CREDENTIALS");
    }

    const valid = await verifyPassword(args.password, user.password);
    if (!valid) {
      throw new ConvexError("INVALID_CREDENTIALS");
    }

    // Upgrade legacy plaintext passwords to hashed on successful login
    if (!user.password.includes(":")) {
      const hashed = await hashPassword(args.password);
      await ctx.db.patch(user._id, { password: hashed });
    }

    return user._id;
  },
});

export const loginWithApple = mutation({
  args: {
    appleId: v.string(),
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists with this Apple ID
    const existingByApple = await ctx.db
      .query("users")
      .withIndex("by_apple_id", (q) => q.eq("appleId", args.appleId))
      .first();
    if (existingByApple) {
      return existingByApple._id;
    }

    // Check if user exists with same email
    if (args.email) {
      const existingByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .unique();
      if (existingByEmail) {
        // Link Apple ID to existing account
        await ctx.db.patch(existingByEmail._id, { appleId: args.appleId });
        return existingByEmail._id;
      }
    }

    // Create new user
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const memberSince = `Member since ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const userId = await ctx.db.insert("users", {
      name: args.fullName || "Escape Fan",
      email: args.email || `apple_${args.appleId.slice(0, 8)}@private.relay`,
      appleId: args.appleId,
      avatar: "",
      title: "Escape Rookie",
      memberSince,
      played: 0,
      escaped: 0,
      awards: 0,
      wishlist: [],
    });

    return userId;
  },
});

export const toggleWishlist = mutation({
  args: { userId: v.id("users"), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const wishlist = user.wishlist.includes(args.roomId)
      ? user.wishlist.filter((id) => id !== args.roomId)
      : [...user.wishlist, args.roomId];

    await ctx.db.patch(args.userId, { wishlist });
    return wishlist;
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: Record<string, any> = {};
    if (args.name !== undefined) updates.name = args.name;

    // Store the storageId persistently — URL is resolved at query time
    if (args.avatarStorageId) {
      updates.avatarStorageId = args.avatarStorageId;
      // Also set avatar to empty so the storageId path is used
      updates.avatar = "";
    } else if (args.avatar !== undefined) {
      updates.avatar = args.avatar;
      // Clear storageId when avatar is explicitly set/cleared
      updates.avatarStorageId = undefined;
    }

    await ctx.db.patch(args.userId, updates);
    return args.userId;
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const updateStats = mutation({
  args: {
    userId: v.id("users"),
    played: v.number(),
    escaped: v.number(),
    awards: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, ...stats } = args;
    await ctx.db.patch(userId, stats);
  },
});

export const setAdmin = mutation({
  args: {
    userId: v.id("users"),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, { isAdmin: args.isAdmin });
    return args.userId;
  },
});

export const updateLocation = mutation({
  args: {
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      latitude: args.latitude,
      longitude: args.longitude,
      city: args.city,
    });
    return args.userId;
  },
});

// ── Leaderboard ──

export const leaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const max = args.limit ?? 20;

    // Fetch all users and all bookings
    const allUsers = await ctx.db.query("users").collect();
    const allBookings = await ctx.db.query("bookings").collect();

    // Compute dynamic stats per user
    const userStats = allUsers.map((user) => {
      const userBookings = allBookings.filter(
        (b) => b.userId === user._id && b.status === "completed"
      );
      const played = userBookings.length;
      const escaped = new Set(userBookings.map((b) => b.roomId)).size;
      return { ...user, played, escaped };
    });

    // Sort by escaped count descending, then by played ascending (fewer games = better rate)
    const sorted = userStats
      .filter((u) => u.played > 0)
      .sort((a, b) => {
        if (b.escaped !== a.escaped) return b.escaped - a.escaped;
        return a.played - b.played;
      });

    const topUsers = sorted.slice(0, max);

    // Fetch badges for each top user
    const players = await Promise.all(
      topUsers.map(async (user, i) => {
        const badges = await ctx.db
          .query("badges")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        // Resolve avatar
        let avatar = user.avatar;
        if (user.avatarStorageId) {
          const freshUrl = await ctx.storage.getUrl(user.avatarStorageId);
          if (freshUrl) avatar = freshUrl;
        }

        const rate = user.played > 0 ? Math.round((user.escaped / user.played) * 100) : 0;
        const initials = user.name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return {
          rank: i + 1,
          id: user._id,
          name: user.name,
          avatar,
          initials,
          played: user.played,
          escaped: user.escaped,
          rate,
          badges: badges.length,
          isPremium: user.isPremium ?? false,
        };
      })
    );

    // Aggregate stats across ALL users (dynamic)
    const totalEscapes = userStats.reduce((sum, u) => sum + u.escaped, 0);
    const totalPlayed = userStats.reduce((sum, u) => sum + u.played, 0);
    const successRate = totalPlayed > 0 ? Math.round((totalEscapes / totalPlayed) * 100) : 0;

    // Total badges
    const allBadges = await ctx.db.query("badges").collect();
    const totalBadges = allBadges.length;

    return {
      players,
      stats: {
        totalEscapes,
        totalPlayed,
        successRate,
        totalBadges,
      },
    };
  },
});
