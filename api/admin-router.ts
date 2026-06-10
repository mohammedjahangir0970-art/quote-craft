import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, quotes, visitors, referrals } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const adminRouter = createRouter({
  getStats: adminQuery.query(async () => {
    const db = getDb();

    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const [quoteCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotes);
    const [visitorCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(visitors);
    const [referralCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals);

    const [subCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.subscriptionStatus} IN ('active', 'trialing')`);

    // Revenue from approved quotes
    const [revenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${quotes.total}), 0)` })
      .from(quotes)
      .where(eq(quotes.status, "approved"));

    return {
      totalUsers: userCount?.count || 0,
      totalQuotes: quoteCount?.count || 0,
      totalVisitors: visitorCount?.count || 0,
      totalReferrals: referralCount?.count || 0,
      activeSubscribers: subCount?.count || 0,
      totalQuoteRevenue: revenue?.total || 0,
    };
  }),

  getUsers: adminQuery.query(async () => {
    const db = getDb();
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return allUsers;
  }),

  getRecentQuotes: adminQuery.query(async () => {
    const db = getDb();
    const recent = await db
      .select()
      .from(quotes)
      .orderBy(desc(quotes.createdAt))
      .limit(50);
    return recent;
  }),

  getVisitors: adminQuery.query(async () => {
    const db = getDb();
    const recent = await db
      .select()
      .from(visitors)
      .orderBy(desc(visitors.createdAt))
      .limit(100);
    return recent;
  }),

  getConversions: adminQuery.query(async () => {
    const db = getDb();
    const converted = await db
      .select()
      .from(visitors)
      .where(eq(visitors.converted, true))
      .orderBy(desc(visitors.createdAt))
      .limit(50);
    return converted;
  }),

  getSignups: adminQuery.query(async () => {
    const db = getDb();
    const recentSignups = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(50);
    return recentSignups;
  }),

  updateUserRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),
});
