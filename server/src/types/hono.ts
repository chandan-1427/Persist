// server/src/types/hono.ts
import type { User } from "../db/schema.js";
import type { sessions } from "../db/schema.js";

export type AppVariables = {
  user: User;
  session: typeof sessions.$inferSelect;
};