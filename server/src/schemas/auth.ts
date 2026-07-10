import * as z from "zod";

export const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const signinSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});