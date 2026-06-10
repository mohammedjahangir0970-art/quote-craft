import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, referrals } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

function generateReferralCode(): string {
  return "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const referralRouter = createRouter({
  getMyCode: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id));

    if (!user) return null;

    // Generate code if not exists
    if (!user.referralCode) {
      const code = generateReferralCode();
      await db
        .update(users)
        .set({ referralCode: code })
        .where(eq(users.id, ctx.user.id));
      return code;
    }

    return user.referralCode;
  }),

  getReferralUrl: publicQuery
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, input.code));

      if (!user) return null;
      return {
        referrerName: user.name,
        code: input.code,
      };
    }),

  trackReferral: publicQuery
    .input(
      z.object({
        code: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, input.code));

      if (!referrer) throw new Error("Invalid referral code");

      // Check if already referred
      const [existing] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, referrer.id),
            eq(referrals.referredEmail, input.email)
          )
        );

      if (existing) return { success: true, alreadyReferred: true };

      await db.insert(referrals).values({
        referrerId: referrer.id,
        referredEmail: input.email,
        status: "pending",
      });

      return { success: true, alreadyReferred: false };
    }),

  completeReferral: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        newUserId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [ref] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referredEmail, input.email))
        .orderBy(sql`${referrals.createdAt} DESC`)
        .limit(1);

      if (!ref) return { success: false };

      await db
        .update(referrals)
        .set({
          referredId: input.newUserId,
          status: "signed_up",
        })
        .where(eq(referrals.id, ref.id));

      // Update the new user's referredBy
      await db
        .update(users)
        .set({ referredBy: ref.referrerId })
        .where(eq(users.id, input.newUserId));

      return { success: true };
    }),

  getMyReferrals: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id))
      .orderBy(sql`${referrals.createdAt} DESC`);

    const counts = {
      total: myReferrals.length,
      signedUp: myReferrals.filter((r) => r.status === "signed_up" || r.status === "subscribed" || r.status === "rewarded").length,
      subscribed: myReferrals.filter((r) => r.status === "subscribed" || r.status === "rewarded").length,
      rewarded: myReferrals.filter((r) => r.status === "rewarded").length,
    };

    return { referrals: myReferrals, counts };
  }),

  rewardReferrer: authedQuery
    .input(z.object({ referrerId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(referrals)
        .set({ status: "rewarded", rewardApplied: true })
        .where(
          and(
            eq(referrals.referrerId, input.referrerId),
            eq(referrals.status, "subscribed")
          )
        );
      return { success: true };
    }),
});
