import { useState } from "react";
import { blockHasCode, validateGuide } from "../../lib/guideSchema";
import { money, shortDate, dateTime } from "../../lib/format";
import { displayHost } from "../../lib/hostname";
import { api } from "../../lib/api";
import { useData } from "../../lib/useData";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/icons";
import { Loading } from "../ui/Loading";
import { Pill } from "../ui/Pill";
import { PaymentDialog } from "../sections/studio/PaymentDialog";

/*
  Publish checklist (architecture 10.1, steps 6 and 7). Publishing needs valid content,
  a subdomain, and a recorded payment. Door codes warn but never block.
*/

export function publishReadiness(guide, draft) {
  const v = validateGuide(draft);
  const codes = draft.pages.reduce((n, p) => n + p.blocks.filter(blockHasCode).length, 0);
  return { validation: v, codes, ready: v.ok && !!guide.slug && guide.paid === 1 };
}

function Check({ ok, warn, title, detail, action }) {
  return (
    <li className="flex items-center gap-3 py-3 border-b border-line-soft last:border-b-0">
      <Icon
        name={ok ? "circle-check" : warn ? "alert-circle" : "circle-dashed"}
        className={`text-lg ${ok ? "text-ok" : warn ? "text-warn-ink" : "text-accent"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13.5px]">{title}</div>
        {detail && <div className="text-sm text-muted truncate">{detail}</div>}
      </div>
      {action}
    </li>
  );
}

export function PublishPanel({ guide, draft, onGuideChange, onGoTo }) {
  const [paying, setPaying] = useState(false);
  const { validation, codes } = publishReadiness(guide, draft);

  return (
    <section className="mb-7" aria-label="Before publishing">
      <h2 className="text-xs font-normal text-muted mt-0 mb-2.5">Before publishing</h2>
      <ul className="list-none m-0 p-0">
        <Check
          ok={validation.ok}
          title={validation.ok ? "Content is valid" : "Content needs attention"}
          detail={validation.ok ? `${validation.shown} of ${validation.total} pages shown to guests` : validation.errors[0]}
        />
        <Check
          ok={!!guide.slug}
          title={guide.slug ? "Subdomain set" : "No subdomain yet"}
          detail={guide.slug ? displayHost(guide.slug) : "Guests need an address to open"}
          action={
            !guide.slug && (
              <Button size="sm" onClick={() => onGoTo({ kind: "subdomain" })}>
                Choose
              </Button>
            )
          }
        />
        <Check
          ok={guide.paid === 1}
          title={guide.paid ? "Paid" : "Payment not recorded"}
          detail={
            guide.paid
              ? [money(guide.payment_amount, guide.payment_currency), guide.payment_method, guide.payment_reference].filter(Boolean).join(", ")
              : "$15 one-time guide fee"
          }
          action={
            !guide.paid && (
              <Button size="sm" onClick={() => setPaying(true)}>
                Mark as paid
              </Button>
            )
          }
        />
        {codes > 0 && <Check warn title={codes === 1 ? "1 possible door code" : `${codes} possible door codes`} detail="Anyone with the link can read them" />}
      </ul>
      <PaymentDialog open={paying} guide={guide} onClose={() => setPaying(false)} onSaved={onGuideChange} />
    </section>
  );
}

/** Published versions with restore (architecture 10.1, step 8). */
export function VersionsDialog({ open, onClose, guide, onRestored }) {
  const versions = useData(() => (open ? api.listVersions(guide.id) : Promise.resolve([])), [open, guide.id]);
  const [busy, setBusy] = useState(null);

  async function restore(v) {
    setBusy(v);
    try {
      await api.restoreVersion(guide.id, v);
      onRestored(v);
      onClose();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} side="right" width={440} title="Versions" description="Every publish is kept. Restoring republishes it as a new version.">
      {versions.loading ? (
        <Loading />
      ) : versions.data.length === 0 ? (
        <p className="text-muted">Nothing published yet.</p>
      ) : (
        <ul className="list-none m-0 p-0">
          {versions.data.map((v) => (
            <li key={v.version} className="flex items-center gap-3 py-3.5 border-b border-line-soft last:border-b-0">
              <div className="flex-1">
                <div className="font-semibold flex items-center gap-2">
                  Version {v.version}
                  {v.version === guide.published_version && <Pill tone="navy">Live</Pill>}
                </div>
                <div className="text-sm text-muted" title={dateTime(v.created_at)}>
                  {shortDate(v.created_at)}, {v.pages} pages
                </div>
              </div>
              {v.version !== guide.published_version && (
                <Button size="sm" onClick={() => restore(v.version)} disabled={busy != null}>
                  Restore
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
