import { useEffect, useRef, useState } from "react";
async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Fallback for older in-app browsers where the async clipboard API is blocked.
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
export function WifiBlock({ network, password, note }) {
  const [copied, setCopied] = useState(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy(field) {
    const ok = await copyText(field === "network" ? network : password);
    setFailed(!ok);
    setCopied(ok ? field : null);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 2200);
  }
  return (
    <div className="block block-wifi">
      <div className="wifi-row">
        <div>
          <p className="wifi-row__label">Network</p>
          <p className="wifi-row__value">{network}</p>
        </div>
        <button type="button" className="btn btn--quiet" onClick={() => copy("network")}>
          <i className={`ti ti-${copied === "network" ? "check" : "copy"}`} aria-hidden="true" />
          {copied === "network" ? "Copied" : "Copy name"}
        </button>
      </div>
      <div className="wifi-row wifi-row--password">
        <div>
          <p className="wifi-row__label">Password</p>
          <p className="wifi-row__value wifi-row__value--password">{password}</p>
        </div>
      </div>
      <button type="button" className="btn btn--primary btn--block" onClick={() => copy("password")}>
        <i className={`ti ti-${copied === "password" ? "check" : "copy"}`} aria-hidden="true" />
        {copied === "password" ? "Password copied" : "Copy password"}
      </button>
      <p className="visually-hidden" aria-live="polite">
        {copied === "password" ? "Password copied" : copied === "network" ? "Network name copied" : ""}
      </p>
      {failed && (
        <p className="wifi-error">
          Copying isn't allowed in this browser. Press and hold the password to select it.
        </p>
      )}
      {note && <p className="block-wifi__note">{note}</p>}
    </div>
  );
}
