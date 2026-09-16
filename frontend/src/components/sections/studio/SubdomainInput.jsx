import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { ROOT_DOMAIN } from "../../../lib/hostname";
import { Icon } from "../../ui/icons";

/**
 * Subdomain field with a live check across clients, guides, retired slugs, and the
 * reserved list (architecture 4.1 to 4.3). Reports { value, ok } through onChange.
 */
export function SubdomainInput({ value, onChange, guideId, clientId, initial, id }) {
  const [status, setStatus] = useState({ state: "idle" });

  useEffect(() => {
    if (!value || value === initial) {
      setStatus({ state: value ? "same" : "idle" });
      return undefined;
    }
    setStatus({ state: "checking" });
    const t = setTimeout(async () => {
      const r = await api.checkSubdomain(value, { guideId, clientId });
      setStatus(r.available ? { state: "ok" } : { state: "taken", reason: r.reason });
    }, 350);
    return () => clearTimeout(t);
  }, [value, initial, guideId, clientId]);

  const ok = status.state === "ok";
  useEffect(() => {
    onChange?.({ value, ok });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok]);

  return (
    <div>
      <div className="flex items-stretch rounded-lg border border-line bg-field focus-within:border-navy focus-within:bg-card overflow-hidden">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange?.({ value: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""), ok: false })}
          className="flex-1 min-w-0 h-10 px-3 bg-transparent text-base text-ink focus:outline-none"
          spellCheck={false}
          autoCapitalize="off"
        />
        <span className="flex items-center px-3 text-muted border-l border-line-soft text-sm">.{ROOT_DOMAIN}</span>
      </div>
      <p className="mt-1.5 mb-0 text-sm min-h-5 flex items-center gap-1.5">
        {status.state === "checking" && <span className="text-muted">Checking</span>}
        {status.state === "ok" && (
          <span className="text-ok flex items-center gap-1.5">
            <Icon name="circle-check" /> Available
          </span>
        )}
        {status.state === "taken" && (
          <span className="text-accent flex items-center gap-1.5">
            <Icon name="alert-circle" /> {status.reason}
          </span>
        )}
      </p>
    </div>
  );
}
