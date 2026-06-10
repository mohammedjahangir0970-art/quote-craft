import * as cookie from "cookie";
import * as jose from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { env } from "./lib/env";
import { Session } from "@contracts/constants";

const JWT_ALG = "HS256";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signEmailToken(userId: number, email: string): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT({ userId, email, type: "email" })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

export async function verifyEmailToken(token: string): Promise<{ userId: number; email: string } | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    if (!payload.userId || !payload.email || payload.type !== "email") return null;
    return { userId: payload.userId as number, email: payload.email as string };
  } catch {
    return null;
  }
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

export async function authenticateEmailRequest(headers: Headers): Promise<typeof users.$inferSelect | undefined> {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.emailCookieName];
  if (!token) return undefined;

  const claim = await verifyEmailToken(token);
  if (!claim) return undefined;

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, claim.userId))
    .limit(1);

  return user || undefined;
}

export async function registerUser(email: string, password: string, name: string) {
  const db = getDb();

  // Check if email already exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(password);

  const [result] = await db.insert(users).values({
    email,
    passwordHash,
    name,
    authType: "email",
    role: "user",
  });

  const userId = Number(result.insertId);

  // Generate a referral code
  const referralCode = `QC${userId}${Date.now().toString(36).toUpperCase()}`;
  await db
    .update(users)
    .set({ referralCode })
    .where(eq(users.id, userId));

  const token = await signEmailToken(userId, email);

  return { token, user: { id: userId, email, name } };
}

export async function loginUser(email: string, password: string) {
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  // Update last sign in
  await db
    .update(users)
    .set({ lastSignInAt: new Date() })
    .where(eq(users.id, user.id));

  const token = await signEmailToken(user.id, email);

  return { token, user: { id: user.id, email: user.email, name: user.name } };
}
