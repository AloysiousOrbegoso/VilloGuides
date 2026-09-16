import { z } from "zod";

export const markPaidSchema = z.object({
  method: z.string().trim().min(1, "Choose how they paid."),
  amount: z.number().positive("Enter the amount received."),
  currency: z.string().trim().min(1),
  reference: z.string().trim().optional(),
  paidAt: z.string().optional(),
});
