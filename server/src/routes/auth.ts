import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword, DUMMY_PASSWORD_HASH } from "../lib/password.js";
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
  invalidateSession,
} from "../lib/session.js";
import { signupSchema, signinSchema } from "../schemas/auth.js";
import { AppError } from "../lib/errors.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const authRoutes = new Hono();

authRoutes.post(
  "/signup",
  rateLimit({ windowMs: 60_000, max: 5 }),
  async (c) => {
    const body = signupSchema.parse(await c.req.json());
    const email = body.email.toLowerCase();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, body.username)))
      .limit(1);

    if (existing.length > 0) {
      // Deliberately vague — don't confirm which field collided (avoids account enumeration)
      throw new AppError("An account with this email or username already exists", 409);
    }

    const passwordHash = await hashPassword(body.password);

    const [user] = await db
      .insert(users)
      .values({ username: body.username, email, passwordHash })
      .returning({ id: users.id, username: users.username, email: users.email, createdAt: users.createdAt });

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(c, token, expiresAt);

    return c.json({ user }, 201);
  }
);

authRoutes.post(
  "/signin",
  rateLimit({ windowMs: 60_000, max: 10 }),
  async (c) => {
    const body = signinSchema.parse(await c.req.json());
    const email = body.email.toLowerCase();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Always run a verify, even for a nonexistent user, against a precomputed dummy hash.
    // Without this, response time differs based on whether the email exists, which leaks
    // valid emails to an attacker via timing.
    const validPassword = user
      ? await verifyPassword(user.passwordHash, body.password)
      : await verifyPassword(DUMMY_PASSWORD_HASH, body.password);

    if (!user || !validPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(c, token, expiresAt);

    return c.json({
      user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    });
  }
);

authRoutes.post("/signout", async (c) => {
  const token = getSessionToken(c);
  if (token) await invalidateSession(token);
  clearSessionCookie(c);
  return c.body(null, 204);
});