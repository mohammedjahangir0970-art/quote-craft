import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-05-27.dahlia",
});

// Price IDs from environment or fallback to test mode patterns
function getPriceId(tier: string, billing: string): string {
  const key = `${tier}_${billing}`.toUpperCase();
  return process.env[`STRIPE_PRICE_${key}`] || "";
}

export const subscriptionRouter = createRouter({
  // Get user's subscription status
  getStatus: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id));

    if (!user) return { tier: "free", status: "free" };

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
    };
  }),

  // Create a Stripe Checkout session for subscription
  createCheckoutSession: authedQuery
    .input(
      z.object({
        tier: z.enum(["starter", "pro", "business"]),
        billing: z.enum(["monthly", "yearly"]),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (!user) throw new Error("User not found");

      const priceId = getPriceId(input.tier, input.billing);
      if (!priceId) {
        throw new Error("Stripe is not fully configured. Please contact support.");
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.name || undefined,
          metadata: { userId: String(user.id) },
        });
        customerId = customer.id;
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, user.id));
      }

      // Build line items with the correct price
      const lineItems = [{ price: priceId, quantity: 1 }];

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: lineItems,
        mode: "subscription",
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: { userId: String(user.id), tier: input.tier },
        subscription_data: {
          metadata: { userId: String(user.id), tier: input.tier },
        },
        // Enable Apple Pay and other wallet methods
        payment_method_types: ["card"],
      });

      return { url: session.url };
    }),

  // Create a billing portal session
  createPortalSession: authedQuery
    .input(z.object({ returnUrl: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (!user?.stripeCustomerId)
        throw new Error("No Stripe customer found");

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: input.returnUrl,
      });

      return { url: session.url };
    }),

  // Public endpoint to get Stripe publishable key (for frontend)
  getStripeKey: publicQuery.query(() => {
    return {
      publishableKey: process.env.VITE_STRIPE_PUBLIC_KEY || "",
    };
  }),

  // Webhook handler - called by Stripe
  webhook: publicQuery
    .input(
      z.object({
        signature: z.string(),
        payload: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          input.payload,
          input.signature,
          secret
        );
      } catch {
        throw new Error("Invalid webhook signature");
      }

      const db = getDb();

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const tier = session.metadata?.tier;

          if (userId && tier) {
            await db
              .update(users)
              .set({
                subscriptionStatus: "active",
                subscriptionTier: tier as "starter" | "pro" | "business",
                stripeSubscriptionId: session.subscription as string,
              })
              .where(eq(users.id, Number(userId)));
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as unknown as Record<string, unknown>;
          const subscriptionId = invoice.subscription as string | undefined;
          if (subscriptionId && typeof subscriptionId === "string") {
            await db
              .update(users)
              .set({ subscriptionStatus: "past_due" })
              .where(eq(users.stripeSubscriptionId, subscriptionId));
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await db
            .update(users)
            .set({
              subscriptionStatus: "cancelled",
              subscriptionTier: "free",
              stripeSubscriptionId: null,
            })
            .where(eq(users.stripeSubscriptionId, subscription.id));
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const status = subscription.status;
          const tier = subscription.metadata?.tier;

          let subStatus: string = "active";
          if (status === "canceled" || status === "unpaid")
            subStatus = "cancelled";
          else if (status === "past_due") subStatus = "past_due";
          else if (status === "trialing") subStatus = "trialing";

          await db
            .update(users)
            .set({
              subscriptionStatus: subStatus as "active" | "cancelled" | "past_due" | "trialing",
              ...(tier ? { subscriptionTier: tier as "starter" | "pro" | "business" } : {}),
            })
            .where(eq(users.stripeSubscriptionId, subscription.id));
          break;
        }
      }

      return { received: true };
    }),
});
