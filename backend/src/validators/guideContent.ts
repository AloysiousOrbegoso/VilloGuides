/**
 * Server-side validation before publish (architecture 8.2, 10.2). The frontend
 * runs the same checks in src/lib/guideSchema.js so the studio never lets you
 * try to publish something invalid, but the Worker repeats them here because
 * the frontend's checks are a convenience, not a security boundary: nothing
 * stops a request from reaching this endpoint directly.
 */

export const LIMITS = { pages: 20, places: 30, images: 25, bytes: 100 * 1024 };

const isHttp = (url: string) => /^https?:\/\//i.test(url);
const filled = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

type Block = Record<string, any>;
type Page = { title: string; blocks: Block[] };
type GuideContent = {
  property: { name?: string; coverImage?: string };
  host: { photo?: string };
  pages: Page[];
  places: { name?: string; mapsUrl?: string }[];
};

function countImages(content: GuideContent) {
  let n = content.property?.coverImage ? 1 : 0;
  if (content.host?.photo) n += 1;
  for (const p of content.pages ?? []) n += (p.blocks ?? []).filter((b) => b.type === "image" && b.src).length;
  return n;
}

export function validateGuide(content: GuideContent) {
  const errors: string[] = [];
  const c: GuideContent = { property: content.property ?? {}, host: content.host ?? {}, pages: content.pages ?? [], places: content.places ?? [] };

  if (!filled(c.property.name)) errors.push("Add the property name.");
  if ((c.pages ?? []).length > LIMITS.pages) errors.push(`Use at most ${LIMITS.pages} pages.`);
  if ((c.places ?? []).length > LIMITS.places) errors.push(`Use at most ${LIMITS.places} places.`);
  if (countImages(c) > LIMITS.images) errors.push(`Use at most ${LIMITS.images} images.`);

  const size = new TextEncoder().encode(JSON.stringify(c)).length;
  if (size > LIMITS.bytes) errors.push("The guide is over 100 KB of text. Shorten some sections.");

  for (const p of c.pages ?? []) {
    for (const b of p.blocks ?? []) {
      if (b.type === "link" && filled(b.href) && !isHttp(b.href)) errors.push(`${p.title}: links must start with http or https.`);
      if (b.type === "video" && filled(b.videoId) && !/^[\w-]{5,20}$/.test(b.videoId)) errors.push(`${p.title}: the video ID looks wrong.`);
    }
  }
  for (const pl of c.places ?? []) {
    if (filled(pl.mapsUrl) && !isHttp(pl.mapsUrl!)) errors.push(`${pl.name || "A place"}: the map link must start with http or https.`);
  }

  return { ok: errors.length === 0, errors, bytes: size };
}
