import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { getIntakeByToken, saveIntakeAnswers } from "../models/intakeLinks";
import { presignUpload, putUpload } from "../services/storage";

/**
 * forms.villoguides.com/api/intake/:token (architecture 9.3). Public, gated
 * only by the token itself, so no verifyAccess() here.
 * TODO (Phase 3): POST /submit, mapping answers to GuideContent and setting
 * the guide to in_review (architecture 10.1 step 4).
 */
export const intake = new Hono<{ Bindings: Bindings; Variables: Variables }>();

intake.get("/:token", async (c) => c.json(await getIntakeByToken(c.env.DB, c.req.param("token"))));
intake.put("/:token", async (c) => {
  const { answers } = await c.req.json<{ answers: unknown }>();
  return c.json(await saveIntakeAnswers(c.env.DB, c.req.param("token"), answers));
});

intake.post("/:token/uploads/presign", async (c) => {
  const { contentType, size } = await c.req.json<{ contentType: string; size: number }>();
  const { uploadUrl, key } = await presignUpload(c.env, { contentType, size, area: "intake" });
  return c.json({ uploadUrl, url: `/photos/${key.split("/").pop()}` });
});

intake.put("/uploads/put/:key{.+}", async (c) => {
  const contentType = c.req.header("Content-Type") || "application/octet-stream";
  await putUpload(c.env, c.req.param("key"), await c.req.arrayBuffer(), contentType);
  return c.json({ ok: true });
});
