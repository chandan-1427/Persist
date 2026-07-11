import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { requireAuth } from "@/middleware/auth.js";
import { setTargetSchema } from "@/schemas/target.js";
import type { User } from "@/db/schema.js";
import { AppError } from "@/lib/errors.js";
import { rateLimit } from "@/middleware/rate-limit.js";

const LOCK_DURATION_MS = 24 * 60 * 60 * 1000;

export const targetRoutes = new Hono<{ Variables: { user: User } }>();

targetRoutes.use("*", rateLimit({ windowMs: 60_000, max: 20 }));
targetRoutes.use("*", requireAuth);

targetRoutes.post("/", async (c) => {
  const { days } = setTargetSchema.parse(await c.req.json());
  const user = c.get("user");

  if (user.targetAt) {
    throw new AppError("You already have an active target. Delete it before setting a new one.", 409);
  }

  const now = new Date();
  const targetAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await db.update(users).set({ targetAt, targetSetAt: now }).where(eq(users.id, user.id));

  return c.json({ targetAt });
});

targetRoutes.get("/", async (c) => {
  const user = c.get("user");
  return c.json({ 
    targetAt: user.targetAt,
    targetSetAt: user.targetSetAt,
  });
});

targetRoutes.delete("/", async (c) => {
  const user = c.get("user");

  if (!user.targetAt || !user.targetSetAt) {
    throw new AppError("No active target to delete.", 404);
  }

  const elapsed = Date.now() - user.targetSetAt.getTime();
  if (elapsed < LOCK_DURATION_MS) {
    const remainingMs = LOCK_DURATION_MS - elapsed;
    throw new AppError(
      `You can't delete your target yet. Try again in ${Math.ceil(remainingMs / (60 * 60 * 1000))} hour(s).`,
      403
    );
  }

  await db.update(users).set({ targetAt: null, targetSetAt: null }).where(eq(users.id, user.id));

  return c.body(null, 204);
});