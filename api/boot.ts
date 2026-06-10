import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { getSessionCookieOptions } from "./lib/cookies";
import { Session } from "@contracts/constants";
import { setCookie } from "hono/cookie";
import {
  exchangeGoogleCode,
  findOrCreateGoogleUser,
  signGoogleSessionToken,
} from "./google-auth";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Kimi OAuth callback (original)
app.get(Paths.oauthCallback, createOAuthCallbackHandler());

// Google OAuth callback
app.get("/api/oauth/google/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) {
    return c.redirect("/login?error=google_denied", 302);
  }

  if (!code || !state) {
    return c.redirect("/login?error=missing_code", 302);
  }

  try {
    const redirectPath = atob(state);
    const googleUser = await exchangeGoogleCode(code);
    const user = await findOrCreateGoogleUser(googleUser);

    const token = await signGoogleSessionToken(user.id, googleUser.id);

    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
    setCookie(c, Session.emailCookieName, token, {
      ...cookieOpts,
      maxAge: Session.maxAgeMs / 1000,
    });

    return c.redirect(redirectPath, 302);
  } catch (err) {
    console.error("[Google OAuth] Callback failed:", err);
    return c.redirect("/login?error=google_failed", 302);
  }
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
