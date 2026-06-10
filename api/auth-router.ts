import { z } from "zod";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { registerUser, loginUser, signEmailToken } from "./email-auth";
import {
  getGoogleOAuthUrl,
  exchangeGoogleCode,
  findOrCreateGoogleUser,
  signGoogleSessionToken,
} from "./google-auth";

export const authRouter = createRouter({
  // Get current user (works for both OAuth and email auth)
  me: authedQuery.query((opts) => opts.ctx.user),

  // Logout - clear all auth cookies
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    const cookies: string[] = [];

    // Clear Kimi OAuth cookie
    cookies.push(
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      })
    );

    // Clear email auth cookie
    cookies.push(
      cookie.serialize(Session.emailCookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      })
    );

    for (const c of cookies) {
      ctx.resHeaders.append("set-cookie", c);
    }

    return { success: true };
  }),

  // Email/Password Registration
  register: publicQuery
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ input }) => {
      const { token, user } = await registerUser(input.email, input.password, input.name);
      return { token, user };
    }),

  // Email/Password Login
  login: publicQuery
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      const { token, user } = await loginUser(input.email, input.password);
      return { token, user };
    }),

  // Get Google OAuth URL
  getGoogleUrl: publicQuery
    .input(z.object({ redirectUri: z.string().optional() }).optional())
    .query(({ input }) => {
      const state = btoa(input?.redirectUri || "/dashboard");
      const url = getGoogleOAuthUrl(state);
      return { url };
    }),
});
