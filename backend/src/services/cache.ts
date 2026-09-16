import type { Bindings } from "../types";

/**
 * Edge caching for the public guide endpoint (architecture 7.3): "Public
 * guide data (GET /api/guide) is cached at the edge for 60 seconds and
 * purged on publish." Workers' Cache API keys by the full request URL
 * including hostname, so the cache entry for one guide never collides with
 * another's, and a synthetic Request built from the guide's own subdomain
 * is enough to address the right entry without needing the real inbound
 * Request object on hand at publish time.
 */

const CACHE_TTL_SECONDS = 60;

function guideCacheKey(rootDomain: string, slug: string) {
  return new Request(`https://${slug}.${rootDomain}/api/guide`);
}

export function guideCacheHeaders() {
  return { "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}` };
}

/** Called right after a publish or restore, so guests see the update within about a minute at most, per architecture 7.3. */
export async function purgeGuideCache(env: Bindings, slug: string) {
  await caches.default.delete(guideCacheKey(env.ROOT_DOMAIN, slug));
}
