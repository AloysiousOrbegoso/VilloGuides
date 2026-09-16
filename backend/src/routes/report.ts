import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { reportGuideSchema } from "../validators/intake";
import { createReport } from "../models/reports";
import { logActivity } from "../models/audit";
import { rateLimit, clientIp } from "../middleware/rateLimit";

/**
 * POST /api/report, from the brand page's report form (architecture 5.1)
 * and every guide footer. Deliberately tight rate limit (architecture 12):
 * legitimate use is rare from any one visitor.
 */
export const report = new Hono<{ Bindings: Bindings; Variables: Variables }>();

report.post(
  "/",
  rateLimit((env) => env.RL_REPORT, (c) => `report:${clientIp(c)}`),
  async (c) => {
    const body = reportGuideSchema.parse(await c.req.json());
    await createReport(c.env.DB, { guideSlug: body.guide, reason: body.reason, details: body.details, email: body.email });
    // Also in the activity log, so a report shows up alongside everything
    // else the studio owner already checks day to day.
    await logActivity(c.env.DB, { actor: "guest", action: "guide.reported", detail: { guide: body.guide, reason: body.reason } });
    return c.json({ ok: true });
  },
);
