import { useState } from "react";
import { api } from "../../../lib/api";

const CACHE_PREFIX = "vg-unlocked-";

function readCached(id) {
  try {
    return sessionStorage.getItem(CACHE_PREFIX + id);
  } catch {
    return null;
  }
}

function writeCached(id, body) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + id, body);
  } catch {
    // Private browsing or a full quota. Unlocking still works this visit,
    // it just will not be remembered on the next one.
  }
}

/**
 * Branches on whether `body` is present in the data it receives, not on any
 * explicit "is this a guest" flag. The studio and dashboard always pass the
 * real draft or published content straight through, which already has
 * `body`; the real public GET /api/guide response never does (see
 * redactPrivateBlocks on the backend), so the PIN prompt only ever appears
 * where it actually needs to.
 */
export function PrivateBlock({ id, heading, body }) {
  const [revealed, setRevealed] = useState(() => (body === undefined ? readCached(id) : null));
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const content = body !== undefined ? body : revealed;

  if (content != null) {
    return (
      <div className="block block-private">
        {heading && <h3 className="block-heading">{heading}</h3>}
        {content.split(/\n{2,}/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }

  async function unlock(e) {
    e.preventDefault();
    if (!pin || checking) return;
    setError("");
    setChecking(true);
    try {
      const result = await api.unlockPrivateBlock(id, pin);
      writeCached(id, result.body);
      setRevealed(result.body);
    } catch {
      setError("That PIN is not correct. Check it and try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="block block-private">
      {heading && <h3 className="block-heading">{heading}</h3>}
      <form className="block-private__form" onSubmit={unlock}>
        <div className="block-private__row">
          <i className="ti ti-lock block-private__lock" aria-hidden="true" />
          <input
            className="block-private__pin"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            aria-label="PIN"
          />
          <button type="submit" className="btn btn--primary" disabled={!pin || checking}>
            {checking ? "Checking" : "Unlock"}
          </button>
        </div>
        {error && (
          <p className="block-private__error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
