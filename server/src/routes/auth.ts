import { Hono } from "hono";
import { eq, or } from "drizzle-orm";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { hashPassword, verifyPassword, DUMMY_PASSWORD_HASH } from "@/lib/password.js";
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
  invalidateSession,
  invalidateAllUserSessions,
} from "@/lib/session.js";
import { signupSchema, signinSchema } from "@/schemas/auth.js";
import { AppError } from "@/lib/errors.js";
import { rateLimit } from "@/middleware/rate-limit.js";
import { requireAuth } from "@/middleware/auth.js";
import type { AppVariables } from "@/types/hono.js";

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.post(
  "/signup",
  rateLimit({ windowMs: 60_000, max: 5 }),
  async (c) => {
    const body = signupSchema.parse(await c.req.json());
    const email = body.email.toLowerCase();
    const username = body.username.toLowerCase();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);

    if (existing.length > 0) {
      throw new AppError("An account with this email or username already exists", 409);
    }

    const passwordHash = await hashPassword(body.password);

    const [user] = await db
      .insert(users)
      .values({ username, email, passwordHash })
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
    const identifier = body.identifier.toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)))
      .limit(1);

    const validPassword = user
      ? await verifyPassword(user.passwordHash, body.password)
      : await verifyPassword(DUMMY_PASSWORD_HASH, body.password);

    if (!user || !validPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    const { token, expiresAt } = await createSession(user.id);
    setSessionCookie(c, token, expiresAt);

    return c.json({
      user: { id: user.id, username: user.username, email: user.email, targetAt: user.targetAt, createdAt: user.createdAt },
    });
  }
);

authRoutes.post("/signout", async (c) => {
  const token = getSessionToken(c);
  if (token) await invalidateSession(token);
  clearSessionCookie(c);
  return c.body(null, 204);
});

authRoutes.post("/signout-all", requireAuth, async (c) => {
  const user = c.get("user");
  await invalidateAllUserSessions(user.id);
  clearSessionCookie(c);
  return c.body(null, 204);
});

authRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});