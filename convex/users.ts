import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
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

    // Send welcome email
    await ctx.scheduler.runAfter(0, internal.email.sendPlayerWelcome, {
      playerName: trimmedName,
      playerEmail: args.email.toLowerCase(),
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

    // Send welcome email (only if real email)
    const userEmail = args.email || "";
    if (userEmail && !userEmail.includes("@private.relay")) {
      await ctx.scheduler.runAfter(0, internal.email.sendPlayerWelcome, {
        playerName: args.fullName || "Escape Fan",
        playerEmail: userEmail,
      });
    }

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

// ─── Update language preference ───
export const updateLanguage = mutation({
  args: {
    userId: v.id("users"),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, { language: args.language });
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

    // Fetch all users and only completed bookings (use status index)
    const [allUsers, completedBookings] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("bookings").withIndex("by_status", (q) => q.eq("status", "completed")).collect(),
    ]);

    // Compute dynamic stats per user using a Map for O(1) lookups
    const userBookingsMap = new Map<string, typeof completedBookings>();
    for (const b of completedBookings) {
      if (!b.userId) continue;
      const uid = b.userId as string;
      if (!userBookingsMap.has(uid)) userBookingsMap.set(uid, []);
      userBookingsMap.get(uid)!.push(b);
    }

    const userStats = allUsers.map((user) => {
      const userBookings = userBookingsMap.get(user._id as string) ?? [];
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

    // Batch-fetch badges for all top users in parallel
    const badgeCounts = await Promise.all(
      topUsers.map(async (user) => {
        const badges = await ctx.db
          .query("badges")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        return badges.length;
      })
    );

    // Batch-resolve avatars for users with storageIds
    const avatarUrls = await Promise.all(
      topUsers.map(async (user) => {
        if (user.avatarStorageId) {
          return await ctx.storage.getUrl(user.avatarStorageId);
        }
        return null;
      })
    );

    const players = topUsers.map((user, i) => {
      const avatar = avatarUrls[i] || user.avatar;
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
        badges: badgeCounts[i],
        isPremium: user.isPremium ?? false,
      };
    });

    // Aggregate stats across ALL users (dynamic)
    const totalEscapes = userStats.reduce((sum, u) => sum + u.escaped, 0);
    const totalPlayed = userStats.reduce((sum, u) => sum + u.played, 0);
    const successRate = totalPlayed > 0 ? Math.round((totalEscapes / totalPlayed) * 100) : 0;

    // Total badges — count from the already-loaded badge queries for top users
    // For accuracy we still need the full count, but we can use a single query
    const allBadgesCount = (await ctx.db.query("badges").collect()).length;

    // ── Per-room escape stats (computed from bookings) ──
    const allRooms = await ctx.db.query("rooms").collect();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Use ALL bookings (not just completed) for room stats — load non-cancelled
    const allBookings = await ctx.db.query("bookings").collect();

    const roomStats: Record<string, { completed: number; total: number }> = {};
    for (const booking of allBookings) {
      if (booking.status === "cancelled") continue;
      const rid = booking.roomId as string;
      if (!roomStats[rid]) roomStats[rid] = { completed: 0, total: 0 };
      if (booking.date <= today) {
        roomStats[rid].total += 1;
        if (booking.status === "completed") {
          roomStats[rid].completed += 1;
        }
      }
    }

    const topRooms = allRooms
      .filter((r) => r.isActive !== false)
      .map((r) => {
        const stats = roomStats[r._id as string] ?? { completed: 0, total: 0 };
        const escapeRate = stats.total > 0
          ? Math.round((stats.completed / stats.total) * 100)
          : 0;
        return {
          id: r._id,
          title: r.title,
          location: r.location,
          rating: r.rating,
          reviews: r.reviews,
          theme: r.theme,
          escapeRate,
          gamesPlayed: stats.completed,
          companyId: r.companyId,
        };
      })
      .filter((r) => r.rating > 0 || r.gamesPlayed > 0)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 10);

    // Batch-enrich top rooms with company name
    const roomCompanyIds = Array.from(new Set(topRooms.map((r) => r.companyId).filter(Boolean)));
    const roomCompanies = await Promise.all(roomCompanyIds.map((id) => ctx.db.get(id!)));
    const roomCompanyMap = new Map(
      roomCompanyIds.map((id, i) => [id!.toString(), roomCompanies[i]])
    );

    const topRoomsEnriched = topRooms.map((r) => {
      const company = r.companyId ? roomCompanyMap.get(r.companyId.toString()) : null;
      return { ...r, companyName: company?.name ?? "" };
    });

    return {
      players,
      topRooms: topRoomsEnriched,
      stats: {
        totalEscapes,
        totalPlayed,
        successRate,
        totalBadges: allBadgesCount,
      },
    };
  },
});
