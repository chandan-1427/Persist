import type { Context, Next } from "hono";
import { getSessionToken, validateSessionToken } from "../lib/session.js";

export async function requireAuth(c: Context, next: Next) {
  const token = getSessionToken(c);
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  const { session, user } = await validateSessionToken(token);
  if (!session || !user) return c.json({ error: "Unauthorized" }, 401);

  c.set("user", user);
  c.set("session", session);
  await next();
}