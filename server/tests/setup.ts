import "dotenv/config";
import { beforeAll, afterEach } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "../src/db/index.js";

beforeAll(async () => {
  // Assumes migrations already applied to the test DB via `pnpm db:migrate`
  // pointed at DATABASE_URL from .env.test (see package.json script below)
});

afterEach(async () => {
  await db.execute(sql`TRUNCATE TABLE sessions, users RESTART IDENTITY CASCADE`);
});