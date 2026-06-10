# QuoteCraft - Full-Stack Application

## What Was Built

A complete production-ready full-stack quoting application for tradespeople with:

### Backend (tRPC + Drizzle ORM + Hono + MySQL)
- **Real authentication** - OAuth 2.0 via Kimi (persistent sessions, no more logout on refresh)
- **Database** - 7 tables: users, quotes, quoteItems, quoteAnalytics, referrals, abandonedQuotes, visitors
- **tRPC routers** - auth, quote (CRUD), subscription (Stripe), analytics, referral, admin, email
- **User-scoped data** - Every user only sees THEIR own quotes. No ghost data.

### Frontend (React 19 + TypeScript + Vite + Tailwind + shadcn/ui)
- **HomePage** - Landing page with visitor tracking
- **Dashboard** - Real user quotes with stats, empty state for new users
- **QuoteBuilder** - Create/edit quotes with line items, AI generation, preview mode
- **Pricing** - 4 tiers (Free/Starter/Pro/Business) with Stripe checkout
- **Account** - Profile, subscription management, Stripe customer portal
- **About** - Company info, values, timeline, team
- **Admin** - Full admin dashboard with users, quotes, visitors, conversions, email list

### Stripe Integration
- Checkout sessions for paid plans (Starter/Pro/Business)
- Customer portal for subscription management
- Webhook handlers for subscription status changes
- Environment variable for publishable key (already configured with your live key)

### Email Notifications
- Automatic signup notifications sent to:
  - Primary: quotecraft@quote-craft.uk
  - Fallback: mohammedjahangir0970@gmail.com
- Abandoned quote recovery emails

### Innovative Features
- **Visitor tracking** - Track page views, referrers, conversions
- **Referral system** - Unique referral codes, tracking, rewards
- **Quote analytics** - View counts, acceptance rates, revenue tracking
- **Admin dashboard** - Full visibility into users, quotes, signups

---

## Environment Variables (in .env)

| Variable | Value | Status |
|----------|-------|--------|
| VITE_STRIPE_PUBLISHABLE_KEY | pk_live_51PalfjLuKff10XY... | Configured (your live key) |
| STRIPE_SECRET_KEY | sk_live_YOUR_SECRET_KEY_HERE | **NEEDS YOUR SECRET KEY** |
| STRIPE_WEBHOOK_SECRET | whsec_YOUR_WEBHOOK_SECRET | **NEEDS WEBHOOK SECRET** |
| SMTP_HOST | (empty) | Optional - will use console fallback |
| SMTP_USER | (empty) | Optional |
| SMTP_PASS | (empty) | Optional |

---

## CRITICAL: Steps Before Deployment

### 1. Add Your Stripe Secret Key
The publishable key is already set (your live key). You MUST add your secret key:
```
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET_KEY
```

### 2. Set Up Stripe Webhook (for subscription status updates)
In your Stripe Dashboard:
- Go to Developers > Webhooks
- Add endpoint: `https://quote-craft.uk/api/trpc/subscription.webhook`
- Select events: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
- Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Set Up Stripe Price IDs
In your Stripe Dashboard, create products for each plan and add the price IDs as environment variables:
```
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_YEARLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxx
```

### 4. Configure Email (Optional)
For production email delivery, set SMTP credentials:
```
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```
Without SMTP, signup notifications will log to console (visible in server logs).

---

## Deployment to Cloudflare

### Option A: Cloudflare Pages (Frontend) + Separate Worker (Backend)
The backend requires Node.js (Hono server). For Cloudflare:

1. **Build**: `npm run build` (already done, output in `dist/`)
2. **Frontend**: Deploy `dist/public/` to Cloudflare Pages
3. **Backend**: Deploy `dist/boot.js` to a Cloudflare Worker (may need adapter)
4. **Database**: Use Cloudflare D1 (SQLite) instead of MySQL, or keep the MySQL connection

### Option B: Traditional VPS/Server
1. Build: `npm run build`
2. Start: `npm start`
3. Runs on port 3000

---

## What Was Fixed From Original App

| Original Bug | Fix Applied |
|-------------|-------------|
| Ghost data on signup (8 hardcoded fake quotes) | Removed ALL mock data. New users see clean empty state with onboarding CTA |
| No auth persistence (logout on refresh) | Real OAuth 2.0 with session cookies |
| Quotes not actually saved | Full CRUD via tRPC + MySQL database |
| Signup grants "Pro" for free | All new signups get "free" tier. Only paid Stripe subscriptions upgrade |
| No data isolation | Every database query is scoped to the authenticated user's ID |
| Missing "Declined" tab on dashboard | Added Declined tab + Expired status |
| Duplicate/unused Home.tsx | Removed |
| No Stripe integration | Full checkout + webhooks + customer portal |
| No email notifications | Automatic signup emails to your inbox |
| No backend at all | Full tRPC + Drizzle ORM + MySQL backend |

---

## API Endpoints (tRPC)

| Router | Procedures |
|--------|-----------|
| `auth` | me, logout |
| `quote` | list, getById, create, update, delete, stats, duplicate |
| `subscription` | getStatus, createCheckoutSession, createPortalSession, webhook |
| `analytics` | trackQuoteView, getQuoteAnalytics, getDashboardStats, trackVisitor, trackConversion |
| `referral` | getMyCode, getReferralUrl, trackReferral, completeReferral, getMyReferrals |
| `admin` | getStats, getUsers, getRecentQuotes, getVisitors, getConversions, getSignups, updateUserRole |
| `email` | notifySignup, sendRecoveryEmail |

---

Built: 2026-06-10
Stack: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + tRPC + Drizzle ORM + Hono + MySQL + Stripe
