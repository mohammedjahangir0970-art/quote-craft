import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { authenticateEmailRequest, verifyEmailToken, verifyGoogleSessionToken } from "./email-auth";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try Kimi OAuth first (from cookie)
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
    if (ctx.user) return ctx;
  } catch {
    // Kimi auth failed
  }

  // Try email auth from cookie
  try {
    ctx.user = await authenticateEmailRequest(opts.req.headers);
    if (ctx.user) return ctx;
  } catch {
    // Email cookie auth failed
  }

  // Try auth token from header (set by tRPC provider from localStorage)
  try {
    const token = opts.req.headers.get("x-qc-auth-token");
    if (token) {
      // Try email token first
      const emailClaim = await verifyEmailToken(token);
      if (emailClaim) {
        const db = getDb();
        const [user] = await db.select().from(users).where(eq(users.id, emailClaim.userId)).limit(1);
        if (user) {
          ctx.user = user;
          return ctx;
        }
      }

      // Try Google token
      const googleClaim = await verifyGoogleSessionToken(token);
      if (googleClaim) {
        const db = getDb();
        const [user] = await db.select().from(users).where(eq(users.id, googleClaim.userId)).limit(1);
        if (user) {
          ctx.user = user;
          return ctx;
        }
      }
    }
  } catch {
    // Header auth failed
  }

  return ctx;
}
