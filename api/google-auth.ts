import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { env } from "./lib/env";
import * as jose from "jose";
import { Session } from "@contracts/constants";

const JWT_ALG = "HS256";

// Google OAuth configuration
export function getGoogleOAuthUrl(state: string): string {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || "";
  const redirectUri = `${env.kimiAuthUrl ? env.kimiAuthUrl.replace(/\/api.*/, "") : process.env.VITE_APP_URL || "http://localhost:3000"}/api/oauth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = `${env.kimiAuthUrl ? env.kimiAuthUrl.replace(/\/api.*/, "") : process.env.VITE_APP_URL || "http://localhost:3000"}/api/oauth/google/callback`;

  // Exchange code for tokens
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenResp.ok) {
    const text = await tokenResp.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }

  const tokenData = await tokenResp.json() as { id_token?: string; access_token?: string };

  // Get user info from ID token
  const idToken = tokenData.id_token;
  if (!idToken) throw new Error("No ID token in Google response");

  // Decode ID token without verification (Google signed it)
  const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString());

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture,
  };
}

export async function findOrCreateGoogleUser(googleUser: {
  id: string;
  email: string;
  name: string;
  picture?: string;
}) {
  const db = getDb();

  // Check if user exists by googleId
  const [existingByGoogle] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleUser.id))
    .limit(1);

  if (existingByGoogle) {
    await db
      .update(users)
      .set({ lastSignInAt: new Date(), name: googleUser.name })
      .where(eq(users.id, existingByGoogle.id));
    return existingByGoogle;
  }

  // Check if user exists by email (link accounts)
  const [existingByEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, googleUser.email))
    .limit(1);

  if (existingByEmail) {
    // Link Google to existing account
    await db
      .update(users)
      .set({
        googleId: googleUser.id,
        avatar: googleUser.picture || existingByEmail.avatar,
        lastSignInAt: new Date(),
      })
      .where(eq(users.id, existingByEmail.id));
    return { ...existingByEmail, googleId: googleUser.id };
  }

  // Create new user
  const [result] = await db.insert(users).values({
    googleId: googleUser.id,
    email: googleUser.email,
    name: googleUser.name,
    avatar: googleUser.picture,
    authType: "google",
    role: "user",
  });

  const userId = Number(result.insertId);

  // Generate referral code
  const referralCode = `QC${userId}${Date.now().toString(36).toUpperCase()}`;
  await db
    .update(users)
    .set({ referralCode })
    .where(eq(users.id, userId));

  const [newUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return newUser;
}

export async function signGoogleSessionToken(userId: number, googleId: string): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT({ userId, googleId, type: "google" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifyGoogleSessionToken(token: string): Promise<{ userId: number } | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    if (!payload.userId || payload.type !== "google") return null;
    return { userId: payload.userId as number };
  } catch {
    return null;
  }
}
