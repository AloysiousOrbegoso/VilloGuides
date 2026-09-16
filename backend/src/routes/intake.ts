import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import { getIntakeByToken, saveIntakeAnswers, submitIntake } from "../models/intakeLinks";
import { intakeAnswersSchema } from "../validators/intake";
import type { IntakeAnswers } from "../services/intakeAnswers";
import { presignUpload, putUpload } from "../services/storage";
import { rateLimit, clientIp } from "../middleware/rateLimit";
import { sendNotification } from "../services/email";

/**
 * forms.villoguides.com/api/intake/:token (architecture 9.3). Public, gated
 * only by the token itself, so no verifyAccess() here.
 */
export const intake = new Hono<{ Bindings: Bindings; Variables: Variables }>();

intake.get("/:token", async (c) => c.json(await getIntakeByToken(c.env, c.req.param("token"))));

intake.put(
  "/:token",
  rateLimit((env) => env.RL_STANDARD, (c) => `intake-save:${clientIp(c)}`),
  async (c) => {
    const { answers } = await c.req.json<{ answers: unknown }>();
    return c.json(await saveIntakeAnswers(c.env, c.req.param("token")!, answers));
  },
);

intake.post("/:token/submit", async (c) => {
  const { answers } = await c.req.json<{ answers: unknown }>();
  const parsed = intakeAnswersSchema.parse(answers);
  const result = await submitIntake(c.env, c.req.param("token")!, parsed as unknown as IntakeAnswers);
  c.executionCtx.waitUntil(
    sendNotification(
      c.env,
      `New submission: ${result.propertyName}`,
      `${result.clientName} submitted intake answers for ${result.propertyName}. Review it in the studio's review queue.`,
    ),
  );
  return c.json(result);
});

intake.post(
  "/:token/uploads/presign",
  rateLimit((env) => env.RL_STANDARD, (c) => `intake-upload:${clientIp(c)}`),
  async (c) => {
    const { contentType, size } = await c.req.json<{ contentType: string; size: number }>();
    const { uploadUrl, key } = await presignUpload(c.env, { contentType, size, area: "intake" });
    // Same /photos/{filename} path the studio's uploads use (see the shared
    // route in index.ts, which checks guides/ then intake/). Using one path
    // for both means a photo's URL in GuideContent never has to change when
    // promotePhoto moves the underlying object at publish time.
    return c.json({ uploadUrl, url: `/photos/${key.split("/").pop()}` });
  },
);

intake.put("/uploads/put/:key{.+}", async (c) => {
  const contentType = c.req.header("Content-Type") || "application/octet-stream";
  await putUpload(c.env, c.req.param("key"), await c.req.arrayBuffer(), contentType);
  return c.json({ ok: true });
});
