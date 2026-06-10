import { authRouter } from "./auth-router";
import { quoteRouter } from "./quote-router";
import { subscriptionRouter } from "./subscription-router";
import { analyticsRouter } from "./analytics-router";
import { referralRouter } from "./referral-router";
import { adminRouter } from "./admin-router";
import { emailRouter } from "./email-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  quote: quoteRouter,
  subscription: subscriptionRouter,
  analytics: analyticsRouter,
  referral: referralRouter,
  admin: adminRouter,
  email: emailRouter,
});

export type AppRouter = typeof appRouter;
