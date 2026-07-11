import type { User, sessions } from "@/db/schema.js";

export type AppVariables = {
  user: User;
  session: typeof sessions.$inferSelect;
};