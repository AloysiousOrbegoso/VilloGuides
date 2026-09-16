import type { Bindings } from "../types";

/**
 * Photo storage on R2 (architecture 6.2, 12). Photos arrive already resized to
 * 1600px WebP under 1 MB by the browser (architecture 5.4), so the Worker's
 * job is placement and the type/size allowlist, not compression.
 *
 * "Presigned" here is a short-lived, single-purpose Worker route rather than
 * an S3-style signed URL: R2's binding API (used for everything else in this
 * file) does not itself generate client-uploadable URLs, and standing up
 * R2's separate S3-compatible API just for that would mean managing a second
 * set of credentials for one endpoint. A capability-style route with a random,
 * unguessable key gets the same result, a direct browser upload that never
 * passes through JSON, without that extra credential surface.
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 1024 * 1024;

function extFor(contentType: string) {
  const sub = contentType.split("/")[1] ?? "webp";
  return sub === "jpeg" ? "jpg" : sub;
}

export async function presignUpload(
  _env: Bindings,
  input: { contentType: string; size: number; area: "guides" | "intake" },
) {
  if (!ALLOWED_TYPES.includes(input.contentType)) throw new Error("Use a JPG, PNG, or WebP photo.");
  if (input.size > MAX_BYTES) throw new Error("This photo is over 1 MB. It should already be compressed before upload.");
  const key = `${input.area}/${crypto.randomUUID()}.${extFor(input.contentType)}`;
  const uploadUrl = input.area === "intake" ? `/api/intake/uploads/put/${key}` : `/api/studio/uploads/put/${key}`;
  return { uploadUrl, key };
}

export async function putUpload(env: Bindings, key: string, body: ArrayBuffer, contentType: string) {
  if (!ALLOWED_TYPES.includes(contentType)) throw new Error("Use a JPG, PNG, or WebP photo.");
  if (body.byteLength > MAX_BYTES) throw new Error("This photo is over 1 MB.");
  await env.PHOTOS.put(key, body, { httpMetadata: { contentType } });
}

/** Publish step 5 (architecture 10.2): move referenced photos from the private intake area to the published area. */
export async function moveToPublished(env: Bindings, key: string) {
  if (!key.startsWith("intake/")) return key;
  const obj = await env.PHOTOS.get(key);
  if (!obj) return key;
  const newKey = key.replace(/^intake\//, "guides/");
  await env.PHOTOS.put(newKey, obj.body, { httpMetadata: obj.httpMetadata });
  await env.PHOTOS.delete(key);
  return newKey;
}

export async function getPhoto(env: Bindings, key: string) {
  return env.PHOTOS.get(key);
}
