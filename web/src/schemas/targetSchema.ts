import { z } from 'zod'

export const targetSchema = z.object({
  days: z
    .number({ error: 'Days is required' })
    .int('Must be a whole number')
    .positive('Must be at least 1 day')
    .max(3650, 'Must be under 10 years'),
  reason: z
    .string()
    .trim()
    .min(1, 'Please share your motivation')
    .max(500, 'Keep it under 500 characters'),
})

export type TargetFormData = z.infer<typeof targetSchema>