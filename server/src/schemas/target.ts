import * as z from "zod";

export const setTargetSchema = z.object({
  days: z.number().int().positive().max(3650), // sanity cap, ~10 years
  reason: z.string().trim().min(1, "Please share your motivation").max(500),
});