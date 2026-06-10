import { relations } from "drizzle-orm";
import { users, quotes, quoteItems, quoteAnalytics, referrals } from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  quotes: many(quotes),
  referralsMade: many(referrals, { relationName: "referrer" }),
  referredByUser: one(users, {
    fields: [users.referredBy],
    references: [users.id],
    relationName: "referredByUser",
  }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  user: one(users, {
    fields: [quotes.userId],
    references: [users.id],
  }),
  items: many(quoteItems),
  analytics: many(quoteAnalytics),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}));

export const quoteAnalyticsRelations = relations(quoteAnalytics, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteAnalytics.quoteId],
    references: [quotes.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
}));
