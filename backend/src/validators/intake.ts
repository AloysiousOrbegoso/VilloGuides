import { z } from "zod";

/**
 * Loose on purpose: intake answers are a large, evolving free-form object
 * (architecture 5.4), and the real shape lives in services/intakeAnswers.ts.
 * This only guards against obviously wrong payloads before they are stored.
 */
export const intakeAnswersSchema = z.object({
  property: z.object({ name: z.string() }).passthrough(),
  host: z.record(z.unknown()).optional(),
  consent: z.boolean().optional(),
}).passthrough();

export const reportGuideSchema = z.object({
  guide: z.string().trim().min(1, "Choose a guide."),
  reason: z.string().trim().min(1, "Choose a reason."),
  details: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});
