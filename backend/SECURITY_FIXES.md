# Security hardening pass

Three concrete gaps found auditing against architecture section 12, all
fixed and tested here, not just written and assumed correct. The fourth
item from that audit, the PIN-protected door-code block, is separate
feature work and isn't part of this pass.

## 1. CORS was wide open

`backend/src/middleware/cors.ts` used to reflect back whatever `Origin`
header a request sent, combined with `credentials: true`. That combination
means any website on the internet could make an authenticated request to
this API using a visitor's existing session cookie. Now checks the origin
against an actual allowlist: `villoguides.com`, any of its subdomains, and
localhost for local development.

Tested with 12 cases covering both legitimate origins and the specific
attacks a naive check gets wrong, run as a plain Node script mirroring the
real regex logic (`isAllowedOrigin`): a subdomain-lookalike attack
(`villoguides.com.evil.com`), a trailing-dot bypass attempt
(`villoguides.com.`), and plain `http://` on the production domain (which
must be `https://` to be allowed). All 12 passed.

## 2. Links weren't checked at the point they're rendered

`validateGuide` already blocks *saving* a link block or a place whose URL
isn't `http`/`https` (architecture 12). That's a soft guard: it only
protects a guest if every single write path always runs that validation,
which is not something to rely on as the only defense. `LinkBlock.jsx` and
`PlacesScreen.jsx` were rendering `href={href}` directly from stored
content with no check at all at render time, meaning any future bug, code
path, or direct API write that skipped validation would render straight
into a guest's browser as a real, clickable link.

Added `isSafeExternalUrl()` in `frontend/src/lib/links.js`, and both
components now refuse to render a link at all (not even a broken one) if
it fails that check.

`ContactBlock.jsx`'s `contactHref()` and `MapLinkBlock.jsx`'s
`mapsSearchUrl()` were checked too and did not need this: both only ever
build a fixed URL prefix (`tel:`, `mailto:`, `https://m.me/`, or Google's
own Maps URL) with user input going into a properly encoded parameter,
never into the scheme itself, so there was nothing for user content to
hijack there.

Tested with 13 cases against the actual function, not a paraphrase of it:
`javascript:alert(1)`, mixed-case and tab-obfuscated variants of the same
(a known trick against naive string-prefix checks; this passed because it
uses the browser's own `URL` parser rather than a string check), a `data:`
URI, `vbscript:`, plus `ftp://`, empty string, `null`, `undefined`, and
plain non-URL text. All 13 passed on the second attempt: the first version
had a real bug (see below) that these same tests caught before it shipped.

**The bug this testing caught:** the first version of `isSafeExternalUrl`
passed a base URL to `new URL()` for convenience, and that let an empty
string or plain garbage text silently resolve as a valid *relative*
reference against that base, coming back `true` when it should have been
`false`. Not an exploitable hole in those specific cases, but a real
correctness bug: an empty or nonsense link would have rendered as a live,
working-looking link to nowhere meaningful. Fixed by requiring the stored
value to already be a fully qualified absolute URL, with no base to
resolve against.

## 3. No robots.txt or sitemap.xml

Architecture 12 says "the sitemap lists only the root brand page," which
assumes one exists. Added both under `frontend/public/`: `sitemap.xml`
lists only `https://villoguides.com/`, and `robots.txt` points at it.
Every guide already sends `X-Robots-Tag: noindex` (architecture 5.5)
independent of this, and neither file references a guide, a client
dashboard, the studio, or the intake form; none of those belong in a
public sitemap.

## Files changed

**Backend:**
- `src/middleware/cors.ts`

**Frontend:**
- `src/lib/links.js` (new `isSafeExternalUrl` export)
- `src/components/sections/guide-blocks/LinkBlock.jsx`
- `src/components/shell/PlacesScreen.jsx`
- `public/robots.txt` (new)
- `public/sitemap.xml` (new)

## Still open from the original audit

The PIN-protected private block for door codes (architecture 12: "A
PIN-protected private block is planned for a later phase") is real feature
work, not a hardening fix like the three above, since it means a new kind
of content-access mechanism rather than a check on existing content. Worth
its own pass whenever you're ready for it.
