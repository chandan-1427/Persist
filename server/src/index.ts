import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sql } from 'drizzle-orm'

import { db } from '@/db/index.js'

import type { AppVariables } from '@/types/hono.js'

import { requestLogger } from "@/middleware/logger.js";
import { errorHandler } from "@/middleware/error-handler.js";
import { authRoutes } from "@/routes/auth.js";
import { targetRoutes } from "./routes/target.js";

const requiredEnv = ["DATABASE_URL", "CLIENT", "PORT", "NODE_ENV"] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const app = new Hono<{ Variables: AppVariables }>();

app.use(
  '/api/*',
  cors({
    origin: process.env.CLIENT,
    credentials: true
  })
)

app.use("*", requestLogger);
app.onError(errorHandler);

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is obviously connected' })
})

app.get('/api/db/health', async (c) => {
  const result = await db.execute(sql`select 1 as ok`)
  return c.json({ status: 'ok', db: result[0] ?? null })
})

app.route("/api/auth", authRoutes);
app.route("/api/target", targetRoutes);

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT)
}, (info) => {
  console.log(`Server is running on port:${info.port}`)
})