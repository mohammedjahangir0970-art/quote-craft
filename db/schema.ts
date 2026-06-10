import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  decimal,
  json,
  boolean,
} from "drizzle-orm/mysql-core";

// ─── Users ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(), // OAuth users (Kimi)
  googleId: varchar("googleId", { length: 255 }).unique(), // Google OAuth users
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }), // For email/password users
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  trade: varchar("trade", { length: 100 }),
  companyName: varchar("companyName", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  authType: mysqlEnum("authType", ["oauth", "email", "google"]).default("email").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", [
    "free",
    "active",
    "cancelled",
    "past_due",
    "trialing",
  ]).default("free"),
  subscriptionTier: mysqlEnum("subscriptionTier", [
    "free",
    "starter",
    "pro",
    "business",
  ]).default("free"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  referralCode: varchar("referralCode", { length: 50 }),
  referredBy: bigint("referredBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Services (predefined trades/services) ───
export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;

// ─── Quotes ───
export const quotes = mysqlTable("quotes", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull(),
  quoteNumber: varchar("quoteNumber", { length: 50 }).notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  customerAddress: text("customerAddress"),
  trade: varchar("trade", { length: 100 }),
  serviceName: varchar("serviceName", { length: 255 }),
  jobDescription: text("jobDescription"),
  notes: text("notes"),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0"),
  includeTax: boolean("includeTax").default(false),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["draft", "sent", "approved", "declined", "expired"])
    .default("draft")
    .notNull(),
  sentAt: timestamp("sentAt"),
  approvedAt: timestamp("approvedAt"),
  declinedAt: timestamp("declinedAt"),
  viewedAt: timestamp("viewedAt"),
  viewCount: int("viewCount").default(0),
  sentVia: varchar("sentVia", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

// ─── Quote Line Items ───
export const quoteItems = mysqlTable("quoteItems", {
  id: serial("id").primaryKey(),
  quoteId: bigint("quoteId", { mode: "number", unsigned: true })
    .notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuoteItem = typeof quoteItems.$inferSelect;

// ─── Quote Analytics (views, accepts tracking) ───
export const quoteAnalytics = mysqlTable("quoteAnalytics", {
  id: serial("id").primaryKey(),
  quoteId: bigint("quoteId", { mode: "number", unsigned: true })
    .notNull(),
  eventType: mysqlEnum("eventType", ["viewed", "accepted", "declined", "downloaded", "reminder_sent"])
    .notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Referrals ───
export const referrals = mysqlTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: bigint("referrerId", { mode: "number", unsigned: true })
    .notNull(),
  referredId: bigint("referredId", { mode: "number", unsigned: true }),
  referredEmail: varchar("referredEmail", { length: 320 }),
  status: mysqlEnum("status", ["pending", "signed_up", "subscribed", "rewarded"])
    .default("pending")
    .notNull(),
  rewardApplied: boolean("rewardApplied").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ─── Abandoned Quotes (for recovery) ───
export const abandonedQuotes = mysqlTable("abandonedQuotes", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull(),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  trade: varchar("trade", { length: 100 }),
  jobDescription: text("jobDescription"),
  lineItemsSnapshot: json("lineItemsSnapshot"),
  notes: text("notes"),
  potentialTotal: decimal("potentialTotal", { precision: 12, scale: 2 }),
  recoveryEmailSent: boolean("recoveryEmailSent").default(false),
  recovered: boolean("recovered").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// ─── Visitor Tracking ───
export const visitors = mysqlTable("visitors", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  referrer: varchar("referrer", { length: 500 }),
  converted: boolean("converted").default(false),
  conversionType: varchar("conversionType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
