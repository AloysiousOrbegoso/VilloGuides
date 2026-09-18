/**
 * PIN-protected private blocks (architecture 12: "A PIN-protected private
 * block is planned for a later phase"). Mirrors the block shape in
 * frontend/src/lib/guideSchema.js closely enough to find and redact one,
 * without needing the full schema here (same approach as photoRefs.ts).
 */

type PrivateBlock = { type: "private"; id: string; heading?: string; body?: string; pin?: string };
type Block = Record<string, unknown>;
type Page = { blocks?: Block[] };
type Content = { pages?: Page[] } & Record<string, unknown>;

/**
 * The redaction boundary itself: called only from GET /api/guide, before
 * the response is built and therefore before it's cached, so a cached
 * response is never the unredacted one either. Strips `body` and `pin`
 * entirely rather than blanking them, so no trace of their length or shape
 * leaks to a guest who never entered the right PIN.
 */
export function redactPrivateBlocks<T extends Content>(content: T): T {
  if (!content?.pages) return content;
  return {
    ...content,
    pages: content.pages.map((p) => ({
      ...p,
      blocks: (p.blocks ?? []).map((b) =>
        b.type === "private" ? { type: "private", id: b.id, heading: b.heading, locked: true } : b,
      ),
    })),
  };
}

/** Used by POST /api/guide/unlock, against a guide's own published content only. */
export function findPrivateBlock(content: Content, blockId: string): PrivateBlock | null {
  for (const page of content.pages ?? []) {
    for (const block of page.blocks ?? []) {
      if (block.type === "private" && block.id === blockId) return block as PrivateBlock;
    }
  }
  return null;
}
