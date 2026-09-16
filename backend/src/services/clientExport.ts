import { zipSync } from "fflate";
import type { Bindings } from "../types";
import { many, one } from "../db";
import { extractPhotoFilenames } from "./photoRefs";

/**
 * Admin-only export (architecture 9.2, "GET /export: ZIP of all guide
 * content and photos"). One folder per property, named by its subdomain
 * since that is the one identifier both the client and a guest would
 * recognize; each folder holds the published content as readable JSON plus
 * every photo it references, read straight from R2's published area.
 */
export async function buildClientExport(env: Bindings, clientId: string): Promise<Uint8Array> {
  const db = env.DB;
  const guides = await many<{ id: string; slug: string | null; published_version: number | null }>(
    db,
    `SELECT id, slug, published_version FROM guides WHERE client_id = ? AND status = 'published' AND published_version IS NOT NULL`,
    clientId,
  );

  const files: Record<string, Uint8Array> = {};
  const encoder = new TextEncoder();

  for (const g of guides) {
    if (!g.slug || !g.published_version) continue;
    const version = await one<{ content: string }>(
      db,
      `SELECT content FROM guide_versions WHERE guide_id = ? AND version = ?`,
      g.id, g.published_version,
    );
    if (!version) continue;

    const content = JSON.parse(version.content);
    files[`${g.slug}/content.json`] = encoder.encode(JSON.stringify(content, null, 2));

    for (const filename of extractPhotoFilenames(content)) {
      const obj = await env.PHOTOS.get(`guides/${filename}`);
      if (!obj) continue; // a reference with nothing behind it; skip rather than fail the whole export
      files[`${g.slug}/photos/${filename}`] = new Uint8Array(await obj.arrayBuffer());
    }
  }

  return zipSync(files, { level: 6 });
}
