import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { reportGuideSchema } from "../validators/intake";
import { logActivity } from "../models/audit";

/** POST /api/report, from the brand page's report form (architecture 5.1) and every guide footer. */
export const report = new Hono<{ Bindings: Bindings; Variables: Variables }>();

report.post("/", async (c) => {
  const body = reportGuideSchema.parse(await c.req.json());
  // TODO (Phase 5): a dedicated reports table and rate limiting. Logged to
  // audit_log for now so nothing is lost before that table exists.
  await logActivity(c.env.DB, { actor: "guest", action: "guide.reported", detail: body });
  return c.json({ ok: true });
});
