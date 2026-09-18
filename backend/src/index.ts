import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { ApiError } from "./db";
import { corsMiddleware } from "./middleware/cors";
import { verifyAccess } from "./middleware/verifyAccess";
import { requireStudioOwner } from "./middleware/requireStudioOwner";
import { resolveClient } from "./middleware/resolveClient";
import { withGuideCsp } from "./middleware/csp";
import { studio } from "./routes/studio";
import { dashboard } from "./routes/dashboard";
import { intake } from "./routes/intake";
import { guide } from "./routes/guide";
import { report } from "./routes/report";
import { webhooks } from "./routes/webhooks";
import { getPhoto } from "./services/storage";
import { resolveHostname } from "./services/subdomains";
import { scheduled } from "./cron";

/**
 * Hostname router (architecture section 7.1). One Worker serves the API and
 * the built React app as static assets, and decides what to render from the
 * hostname, because Cloudflare Pages custom domains do not support wildcard
 * hostnames (architecture 6.3).
 *
 *   studio.{root}        -> /api/studio/*, requires Access + STUDIO_OWNER_EMAIL
 *   {client}.{root}      -> /api/dashboard/*, requires Access + client staff
 *   forms.{root}         -> /api/intake/*, public with a token
 *   {property}.{root}    -> /api/guide, /photos/*, public
 *   everything else      -> the built React app (index.html), which reads
 *                           the hostname itself client-side (src/lib/hostname.js)
 *
 * In development, path routing stands in for subdomains (architecture 14.1);
 * X-Villo-Dev-Host carries the intended hostname since every request actually
 * arrives at localhost. That header is only honoured when DEV_IDENTITY is set.
 */
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", corsMiddleware);

app.onError((err, c) => {
  if (err instanceof ApiError) return c.json({ error: err.message }, err.status as 400);
  // Zod errors and anything unexpected. Never leak internals to the client.
  console.error(err);
  const message = (err as { issues?: { message: string }[] }).issues?.[0]?.message;
  return c.json({ error: message ?? "Something went wrong. Try again." }, 400);
});

app.route("/api/report", report);
app.route("/", guide); // exposes GET /api/guide directly, scoped by hostname inside the handler

/**
 * Called by Xendit's and PayPal's own servers, never by a browser, so this
 * sits outside every Access-gated group. Each handler verifies the request
 * actually came from that gateway before doing anything (architecture
 * "Later": online payments).
 */
app.route("/api/webhooks", webhooks);

app.use("/api/studio/*", verifyAccess(), requireStudioOwner());
app.route("/api/studio", studio);

app.use("/api/dashboard/*", verifyAccess(), resolveClient());
app.route("/api/dashboard", dashboard);

app.route("/api/intake", intake);

/**
 * Photo serving. Checks the published area first, then the private intake
 * area, so a draft's photos preview correctly in the studio (review queue,
 * editor, live preview) and in the intake form's own preview sheet before
 * anything is published, without a second authenticated route to keep in
 * sync. This is a deliberate choice, not an oversight: filenames are
 * unguessable random UUIDs, the same trust model the intake token itself
 * already relies on (architecture 4, "Private token link, no account"), so
 * there is nothing a second auth layer would meaningfully add here. Once
 * published, promotePhoto (called from publishGuide) moves the object from
 * intake/ to guides/, so long-term the intake/ prefix only ever holds
 * photos for guides still awaiting review.
 */
app.get("/photos/:key", async (c) => {
  const key = c.req.param("key");
  const obj = (await getPhoto(c.env, `guides/${key}`)) ?? (await getPhoto(c.env, `intake/${key}`));
  if (!obj) return c.notFound();
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

app.get("/api/host", async (c) => {
  const hostname = c.req.header("X-Villo-Dev-Host") || new URL(c.req.url).hostname;
  return c.json(await resolveHostname(c.env.DB, hostname));
});

/**
 * Anything not matched above falls through to the built frontend
 * (architecture 7.1). A guide (or the reserved demo subdomain) gets the
 * strict CSP from architecture 12; every other area (brand, studio,
 * dashboards, forms) is left alone, matching the architecture's own
 * wording of "CSP on guide pages" rather than guessing at a broader policy.
 */
app.get("*", async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  const hostname = c.req.header("X-Villo-Dev-Host") || new URL(c.req.url).hostname;
  if (hostname.split(".")[0] === "demo") return withGuideCsp(res);
  const resolved = await resolveHostname(c.env.DB, hostname);
  return resolved.kind === "guide" ? withGuideCsp(res) : res;
});

export default { fetch: app.fetch, scheduled };
