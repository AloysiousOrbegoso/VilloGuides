import type { Context, Next } from "hono";
import type { Bindings, Variables } from "../types";

/**
 * Rate limits for intake autosave, uploads, subdomain checks, and reports
 * (architecture 12). Two budgets: RL_STANDARD for frequent-but-legitimate
 * traffic from one visitor (autosave while typing, a photo upload, a studio
 * owner checking subdomain names), RL_REPORT deliberately tight since one
 * visitor reporting the same guide five times in a minute is already
 * unusual. Many distinct keys can share one binding, each tracked
 * separately, so a burst against one action never spends another action's
 * budget for the same visitor.
 *
 * Fails open: if the limiter itself errors, the request is allowed through
 * rather than blocked, since an outage in rate limiting should never take
 * down the actual feature it's protecting.
 */
export function rateLimit(
  pick: (env: Bindings) => RateLimit,
  keyFn: (c: Context<{ Bindings: Bindings; Variables: Variables }>) => string,
) {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    try {
      const { success } = await pick(c.env).limit({ key: keyFn(c) });
      if (!success) return c.json({ error: "Too many requests. Please slow down and try again shortly." }, 429);
    } catch {
      // Fail open; see the note above.
    }
    return next();
  };
}

export const clientIp = (c: Context) => c.req.header("CF-Connecting-IP") ?? "unknown";
