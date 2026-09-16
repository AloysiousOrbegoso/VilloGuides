/**
 * Content Security Policy for guide pages only (architecture 12): "scripts
 * from own origin only, frames only YouTube and Vimeo, images from own
 * origin." Style and font sources are left open for Google Fonts (EB
 * Garamond, Open Sans) and inline styles, which the architecture's CSP line
 * doesn't restrict and the guide renderer genuinely needs: theme tokens are
 * injected as an inline <style> block, and several components set inline
 * style attributes directly.
 *
 * CSP only has any effect on the HTML document a browser navigates to, not
 * on JSON API responses, so this is applied in exactly one place: the
 * catch-all static asset route in index.ts, and only when the hostname
 * resolves to an actual guide (or the reserved demo subdomain).
 */
const GUIDE_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "img-src 'self' data:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

export function withGuideCsp(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set("Content-Security-Policy", GUIDE_CSP);
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
