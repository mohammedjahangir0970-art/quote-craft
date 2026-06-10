import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { quotes, quoteAnalytics, visitors } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const analyticsRouter = createRouter({
  // Track a quote view (public - no auth required)
  trackQuoteView: publicQuery
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(quoteAnalytics).values({
        quoteId: input.quoteId,
        eventType: "viewed",
        ipAddress: null,
        userAgent: ctx.req.headers.get("user-agent"),
      });
      await db
        .update(quotes)
        .set({
          viewCount: sql`${quotes.viewCount} + 1`,
          viewedAt: new Date(),
        })
        .where(eq(quotes.id, input.quoteId));
      return { success: true };
    }),

  // Get quote analytics for current user
  getQuoteAnalytics: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, ctx.user.id));

    const quoteIds = userQuotes.map((q) => q.id);
    if (quoteIds.length === 0) {
      return { quotes: [], summary: { totalViews: 0, avgViews: 0, topQuote: null } };
    }

    // Get analytics for all user quotes
    const analytics = await db
      .select()
      .from(quoteAnalytics)
      .where(sql`${quoteAnalytics.quoteId} IN (${quoteIds.join(",")})`)
      .orderBy(desc(quoteAnalytics.createdAt));

    // Calculate summary
    const totalViews = analytics.filter((a) => a.eventType === "viewed").length;
    const avgViews = Math.round(totalViews / quoteIds.length);

    // Find top quote by views
    const viewCounts: Record<number, number> = {};
    for (const a of analytics) {
      if (a.eventType === "viewed") {
        viewCounts[a.quoteId] = (viewCounts[a.quoteId] || 0) + 1;
      }
    }
    let topQuoteId = 0;
    let topViews = 0;
    for (const [qid, views] of Object.entries(viewCounts)) {
      if (views > topViews) {
        topViews = views;
        topQuoteId = Number(qid);
      }
    }
    const topQuote = userQuotes.find((q) => q.id === topQuoteId) || null;

    return {
      quotes: userQuotes.map((q) => ({
        ...q,
        views: viewCounts[q.id] || 0,
      })),
      summary: {
        totalViews,
        avgViews,
        topQuote: topQuote
          ? { id: topQuote.id, quoteNumber: topQuote.quoteNumber, customerName: topQuote.customerName, views: topViews }
          : null,
      },
    };
  }),

  // Get dashboard stats
  getDashboardStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const userQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, ctx.user.id));

    const recentQuotes = userQuotes.filter(
      (q) => q.createdAt && q.createdAt >= thirtyDaysAgo
    );

    const totalRevenue = userQuotes
      .filter((q) => q.status === "approved")
      .reduce((sum, q) => sum + Number(q.total), 0);

    const monthlyRevenue = recentQuotes
      .filter((q) => q.status === "approved")
      .reduce((sum, q) => sum + Number(q.total), 0);

    const quoteIds = userQuotes.map((q) => q.id);
    let totalViews = 0;
    if (quoteIds.length > 0) {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(quoteAnalytics)
        .where(
          and(
            sql`${quoteAnalytics.quoteId} IN (${quoteIds.join(",")})`,
            eq(quoteAnalytics.eventType, "viewed")
          )
        );
      totalViews = result?.count || 0;
    }

    // Get acceptance rate
    const sentOrDecided = userQuotes.filter(
      (q) => q.status === "sent" || q.status === "approved" || q.status === "declined"
    ).length;
    const accepted = userQuotes.filter((q) => q.status === "approved").length;
    const acceptanceRate = sentOrDecided > 0 ? Math.round((accepted / sentOrDecided) * 100) : 0;

    return {
      totalQuotes: userQuotes.length,
      monthlyQuotes: recentQuotes.length,
      totalRevenue,
      monthlyRevenue,
      totalViews,
      acceptanceRate,
      byStatus: {
        draft: userQuotes.filter((q) => q.status === "draft").length,
        sent: userQuotes.filter((q) => q.status === "sent").length,
        approved: userQuotes.filter((q) => q.status === "approved").length,
        declined: userQuotes.filter((q) => q.status === "declined").length,
      },
    };
  }),

  // Track visitor (public)
  trackVisitor: publicQuery
    .input(
      z.object({
        page: z.string(),
        referrer: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(visitors).values({
        page: input.page,
        ipAddress: null,
        userAgent: ctx.req.headers.get("user-agent"),
        referrer: input.referrer || null,
      });
      return { success: true };
    }),

  // Track conversion (public)
  trackConversion: publicQuery
    .input(
      z.object({
        type: z.enum(["signup", "subscription"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      // Update recent visitor records to mark as converted
      await db
        .update(visitors)
        .set({ converted: true, conversionType: input.type })
        .where(eq(visitors.converted, false))
        .orderBy(desc(visitors.createdAt))
        .limit(1);
      return { success: true };
    }),
});
