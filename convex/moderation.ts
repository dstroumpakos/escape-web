import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireAdminSession } from "./adminSession";
import { avatarUrl } from "./avatars";
import { ConvexError, v } from "convex/values";
import { checkLengths } from "./validation";
import { requireUser, optionalUser, legacyUserIdV } from "./userSession";

/* ════════════════════════════════════════════════════════════
   Content Moderation — Reports, Blocks, and Filtering
   ════════════════════════════════════════════════════════════ */

// ─── Profanity / content filter word list ───
// This is a basic list; extend as needed. Checks are case-insensitive.
const BLOCKED_WORDS = [
  // slurs and hate speech (abbreviated for brevity — extend in production)
  "nigger", "nigga", "faggot", "retard", "kike", "chink", "spic",
  "tranny", "wetback", "coon",
  // explicit sexual
  "fuck", "shit", "cunt", "dick", "pussy", "cock", "asshole",
  "bitch", "whore", "slut", "bastard",
];

const BLOCKED_PATTERN = new RegExp(
  BLOCKED_WORDS.map(w => `\\b${w}\\b`).join("|"),
  "i"
);

/**
 * Checks text for objectionable content. Returns the first matched word or null.
 */
export function filterContent(text: string): string | null {
  const match = text.match(BLOCKED_PATTERN);
  return match ? match[0] : null;
}

/*
 * Reports (App Store guideline 1.2): players report a post, a comment or a
 * player (from the profile or a chat). Every report emails the admin
 * (ADMIN_NOTIFY_EMAIL) and waits in the admin page (Reports → Content), where
 * the admin dismisses it, removes the content, or suspends the author.
 */

const reasonV = v.union(
  v.literal("spam"),
  v.literal("harassment"),
  v.literal("hate_speech"),
  v.literal("inappropriate"),
  v.literal("other")
);

type ReportKind = "post" | "comment" | "user";

async function notifyAdmin(
  ctx: MutationCtx,
  kind: ReportKind,
  reporter: Doc<"users">,
  reason: string,
  details: string | undefined,
  target: { name: string; text?: string }
) {
  await ctx.scheduler.runAfter(0, internal.email.sendContentReport, {
    kind,
    reason,
    details: details?.slice(0, 1000),
    reporterName: reporter.name,
    targetName: target.name,
    text: target.text?.slice(0, 500),
  });
}

/* ── Report a Post ── */
export const reportPost = mutation({
  args: {
    postId: v.id("posts"),
    sessionToken: v.optional(v.string()), reporterId: legacyUserIdV,
    reason: reasonV,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkLengths([["Details", args.details, 1000]]);
    const reporter = await requireUser(ctx, args.sessionToken, args.reporterId);
    // Prevent duplicate reports from same user on same post
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_reporter_post", q =>
        q.eq("reporterId", reporter._id).eq("postId", args.postId)
      )
      .first();
    if (existing) throw new Error("You have already reported this post.");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("This post was already removed.");

    const id = await ctx.db.insert("reports", {
      postId: args.postId,
      reporterId: reporter._id,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });
    const author = post.authorUserId ? await ctx.db.get(post.authorUserId) : null;
    await notifyAdmin(ctx, "post", reporter, args.reason, args.details, { name: author?.name ?? "a company", text: post.text });
    return id;
  },
});

/* ── Report a Comment ── */
export const reportComment = mutation({
  args: {
    commentId: v.id("postComments"),
    sessionToken: v.string(),
    reason: reasonV,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkLengths([["Details", args.details, 1000]]);
    const reporter = await requireUser(ctx, args.sessionToken);
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_reporter_comment", q =>
        q.eq("reporterId", reporter._id).eq("commentId", args.commentId)
      )
      .first();
    if (existing) throw new Error("You have already reported this comment.");
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("This comment was already removed.");

    const id = await ctx.db.insert("reports", {
      commentId: args.commentId,
      reporterId: reporter._id,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });
    const author = await ctx.db.get(comment.userId);
    await notifyAdmin(ctx, "comment", reporter, args.reason, args.details, { name: author?.name ?? "a player", text: comment.text });
    return id;
  },
});

/* ── Report a Player (profile or chat) ── */
export const reportUser = mutation({
  args: {
    sessionToken: v.string(),
    reportedUserId: v.id("users"),
    context: v.union(v.literal("profile"), v.literal("chat")),
    reason: reasonV,
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkLengths([["Details", args.details, 1000]]);
    const reporter = await requireUser(ctx, args.sessionToken);
    if (reporter._id === args.reportedUserId) throw new Error("You can't report yourself.");
    const target = await ctx.db.get(args.reportedUserId);
    if (!target) throw new Error("This player no longer exists.");
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_reporter_user", q =>
        q.eq("reporterId", reporter._id).eq("reportedUserId", args.reportedUserId)
      )
      .filter(q => q.eq(q.field("status"), "pending"))
      .first();
    if (existing) throw new Error("You have already reported this player.");

    const id = await ctx.db.insert("reports", {
      reportedUserId: args.reportedUserId,
      context: args.context,
      reporterId: reporter._id,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });
    await notifyAdmin(ctx, "user", reporter, args.reason, args.details, { name: target.name });
    return id;
  },
});

/* ── Block a User ── */
export const blockUser = mutation({
  args: {
    sessionToken: v.optional(v.string()), blockerId: legacyUserIdV,
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const blocker = await requireUser(ctx, args.sessionToken, args.blockerId);
    if (blocker._id === args.blockedUserId) {
      throw new Error("Cannot block yourself.");
    }

    const existing = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker_blocked", q =>
        q.eq("blockerId", blocker._id).eq("blockedUserId", args.blockedUserId)
      )
      .first();
    if (existing) return existing._id; // already blocked

    return await ctx.db.insert("blockedUsers", {
      blockerId: blocker._id,
      blockedUserId: args.blockedUserId,
      createdAt: Date.now(),
    });
  },
});

/* ── Unblock a User ── */
export const unblockUser = mutation({
  args: {
    sessionToken: v.string(),
    blockedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const blocker = await requireUser(ctx, args.sessionToken);
    const entry = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker_blocked", q =>
        q.eq("blockerId", blocker._id).eq("blockedUserId", args.blockedUserId)
      )
      .first();
    if (entry) await ctx.db.delete(entry._id);
  },
});

/* ── Get Blocked User IDs (for feed filtering) ── */
export const getBlockedUserIds = query({
  args: { sessionToken: v.optional(v.string()), userId: legacyUserIdV },
  handler: async (ctx, args) => {
    const user = await optionalUser(ctx, args.sessionToken, args.userId);
    if (!user) return [];
    const blocks = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", q => q.eq("blockerId", user._id))
      .collect();
    return blocks.map(b => b.blockedUserId);
  },
});

/* ── The players I blocked, with names (Settings → Blocked players) ── */
export const listBlocked = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await optionalUser(ctx, args.sessionToken);
    if (!user) return [];
    const blocks = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", q => q.eq("blockerId", user._id))
      .collect();
    const rows = await Promise.all(
      blocks.map(async (b) => {
        const u = await ctx.db.get(b.blockedUserId);
        return u ? { userId: u._id, name: u.name, avatarUrl: await avatarUrl(ctx, u), blockedAt: b.createdAt } : null;
      })
    );
    return rows.filter((r): r is NonNullable<typeof r> => !!r).sort((a, b) => b.blockedAt - a.blockedAt);
  },
});

/* ════════ Admin ════════ */

async function deletePostAndAll(ctx: MutationCtx, postId: Id<"posts">) {
  const post = await ctx.db.get(postId);
  if (!post) return;
  const comments = await ctx.db
    .query("postComments")
    .withIndex("by_post", q => q.eq("postId", postId))
    .collect();
  for (const c of comments) await ctx.db.delete(c._id);
  const likes = await ctx.db
    .query("postLikes")
    .withIndex("by_post", q => q.eq("postId", postId))
    .collect();
  for (const l of likes) await ctx.db.delete(l._id);
  for (const m of post.media) if (m.storageId) await ctx.storage.delete(m.storageId).catch(() => {});
  await ctx.db.delete(postId);
}

/** Who wrote the reported thing (a player), if anyone. */
async function authorOf(ctx: QueryCtx, r: Doc<"reports">): Promise<Id<"users"> | null> {
  if (r.reportedUserId) return r.reportedUserId;
  if (r.postId) return (await ctx.db.get(r.postId))?.authorUserId ?? null;
  if (r.commentId) return (await ctx.db.get(r.commentId))?.userId ?? null;
  return null;
}

/** Closes every pending report about the same post, comment or player. */
async function closeSiblings(ctx: MutationCtx, r: Doc<"reports">, status: "dismissed" | "removed") {
  const now = Date.now();
  const pending = await ctx.db.query("reports").withIndex("by_status", q => q.eq("status", "pending")).collect();
  for (const o of pending) {
    const same =
      o._id === r._id ||
      (r.postId && o.postId === r.postId) ||
      (r.commentId && o.commentId === r.commentId) ||
      (r.reportedUserId && o.reportedUserId === r.reportedUserId);
    if (same) await ctx.db.patch(o._id, { status, resolvedAt: now });
  }
  if (r.status === "pending") return;
  // Re-deciding an old report just updates it.
  await ctx.db.patch(r._id, { status, resolvedAt: now });
}

async function suspend(ctx: MutationCtx, userId: Id<"users">) {
  await ctx.db.patch(userId, { suspendedAt: Date.now() });
  const sessions = await ctx.db.query("userSessions").withIndex("by_user", q => q.eq("userId", userId)).collect();
  for (const s of sessions) await ctx.db.delete(s._id);
}

/** Admin page: the content reports, newest first (pending, or the decided ones). */
export const adminContentReports = query({
  args: { sessionToken: v.string(), done: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken);
    const rows = args.done
      ? [
          ...(await ctx.db.query("reports").withIndex("by_status", q => q.eq("status", "removed")).order("desc").take(100)),
          ...(await ctx.db.query("reports").withIndex("by_status", q => q.eq("status", "dismissed")).order("desc").take(100)),
        ]
      : await ctx.db.query("reports").withIndex("by_status", q => q.eq("status", "pending")).order("desc").take(200);
    rows.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      rows.map(async (r) => {
        const reporter = await ctx.db.get(r.reporterId);
        const kind: ReportKind = r.postId ? "post" : r.commentId ? "comment" : "user";
        let text: string | null = null;
        let imageUrl: string | null = null;
        let removed = false;
        let companyAuthor: string | null = null;
        if (r.postId) {
          const post = await ctx.db.get(r.postId);
          if (!post) removed = true;
          else {
            text = post.text;
            imageUrl = post.media.find(m => m.type === "image")?.url ?? null;
            if (post.authorCompanyId) companyAuthor = (await ctx.db.get(post.authorCompanyId))?.name ?? "company";
          }
        } else if (r.commentId) {
          const c = await ctx.db.get(r.commentId);
          if (!c) removed = true;
          else text = c.text;
        }
        const authorId = await authorOf(ctx, r);
        const author = authorId ? await ctx.db.get(authorId) : null;
        const reportsAboutAuthor = authorId
          ? (await ctx.db.query("reports").withIndex("by_reported_user", q => q.eq("reportedUserId", authorId)).collect()).length
          : 0;
        return {
          _id: r._id,
          kind,
          context: r.context ?? null,
          reason: r.reason,
          details: r.details ?? "",
          status: r.status,
          createdAt: r.createdAt,
          resolvedAt: r.resolvedAt ?? null,
          text,
          imageUrl,
          removed,
          reporter: reporter ? { name: reporter.name, email: reporter.email } : null,
          author: author
            ? { userId: author._id, name: author.name, email: author.email, suspended: !!author.suspendedAt, reportsAboutAuthor }
            : companyAuthor
              ? { userId: null, name: companyAuthor, email: "", suspended: false, reportsAboutAuthor: 0 }
              : null,
        };
      })
    );
  },
});

/**
 * Admin decision on a content report:
 * dismiss = nothing wrong; remove = delete the post / comment;
 * suspend = remove it (if any) and suspend the author (signed out, can't sign in).
 */
export const adminResolveContentReport = mutation({
  args: {
    sessionToken: v.string(),
    reportId: v.id("reports"),
    action: v.union(v.literal("dismiss"), v.literal("remove"), v.literal("suspend")),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken);
    const r = await ctx.db.get(args.reportId);
    if (!r) throw new ConvexError("Report not found.");
    if (args.action === "dismiss") {
      await closeSiblings(ctx, r, "dismissed");
      return null;
    }
    const authorId = await authorOf(ctx, r);
    if (args.action === "suspend" && !authorId) throw new ConvexError("This was posted by a company, not a player.");
    if (args.action === "remove" && !r.postId && !r.commentId) {
      throw new ConvexError("A player report has no content to remove: dismiss it or suspend the player.");
    }
    if (r.postId) await deletePostAndAll(ctx, r.postId);
    if (r.commentId) {
      const c = await ctx.db.get(r.commentId);
      if (c) await ctx.db.delete(c._id);
    }
    if (args.action === "suspend" && authorId) await suspend(ctx, authorId);
    await closeSiblings(ctx, r, "removed");
    return null;
  },
});

/** Admin: suspend a player or lift the suspension. */
export const adminSetSuspended = mutation({
  args: { sessionToken: v.string(), userId: v.id("users"), suspended: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken);
    if (args.suspended) await suspend(ctx, args.userId);
    else await ctx.db.patch(args.userId, { suspendedAt: undefined });
    return null;
  },
});

/* ── Get Pending Reports (internal, for the CLI) ── */
export const getPendingReports = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_status", q => q.eq("status", "pending"))
      .order("desc")
      .take(100);
  },
});

/* ── Resolve a Report (internal, for the CLI) ── */
export const resolveReport = internalMutation({
  args: {
    reportId: v.id("reports"),
    resolution: v.union(v.literal("dismissed"), v.literal("removed")),
  },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report) return;
    if (args.resolution === "removed") {
      if (report.postId) await deletePostAndAll(ctx, report.postId);
      if (report.commentId) {
        const c = await ctx.db.get(report.commentId);
        if (c) await ctx.db.delete(c._id);
      }
    }
    await closeSiblings(ctx, report, args.resolution);
  },
});
