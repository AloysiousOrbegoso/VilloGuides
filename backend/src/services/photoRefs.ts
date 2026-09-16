/**
 * Pulls every /photos/{filename} reference out of a guide's content, so
 * publish can promote each one from the private intake area to the
 * published area (architecture 10.2 step 5). Mirrors the block shapes in
 * frontend/src/lib/guideSchema.js closely enough to find every image, without
 * needing the full schema here.
 */

type Content = {
  property?: { coverImage?: string };
  host?: { photo?: string };
  pages?: { blocks?: { type: string; src?: string }[] }[];
};

const FILENAME = /\/photos\/([^/?#]+)$/;

function filenameOf(url: string | undefined): string | null {
  if (!url) return null;
  const m = FILENAME.exec(url);
  return m ? m[1] : null;
}

export function extractPhotoFilenames(content: Content): string[] {
  const names = new Set<string>();
  const cover = filenameOf(content.property?.coverImage);
  if (cover) names.add(cover);
  const hostPhoto = filenameOf(content.host?.photo);
  if (hostPhoto) names.add(hostPhoto);
  for (const page of content.pages ?? []) {
    for (const block of page.blocks ?? []) {
      if (block.type === "image") {
        const name = filenameOf(block.src);
        if (name) names.add(name);
      }
    }
  }
  return [...names];
}
