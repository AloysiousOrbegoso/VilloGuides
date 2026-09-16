import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import { dateTime } from "../../lib/format";
import { useData } from "../../lib/useData";
import { SearchInput } from "../ui/Field";
import { Loading, ErrorNote } from "../ui/Loading";
import { EmptyState, Table } from "../ui/Table";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { StudioBody } from "../sections/studio/StudioLayout";

const LABELS = {
  "guide.created": "Created a draft",
  "guide.published": "Published",
  "guide.unpublished": "Took offline",
  "guide.suspended": "Suspended",
  "guide.renamed": "Renamed the subdomain",
  "guide.restored": "Restored an older version",
  "guide.reported": "Reported a guide",
  "payment.recorded": "Recorded a payment",
  "payment.removed": "Removed a payment",
  "intake_link.created": "Created an intake link",
  "intake_link.expired": "Expired an intake link",
  "intake.submitted": "Submitted the intake form",
  "client.created": "Created a client",
  "client.updated": "Updated a client",
  "client_user.added": "Added a staff email",
  "client_user.removed": "Removed a staff email",
  "change_request.created": "Sent a change request",
  "change_request.done": "Resolved a change request",
  "change_request.declined": "Declined a change request",
  "settings.updated": "Changed settings",
};

function describe(a) {
  const base = LABELS[a.action] ?? a.action;
  if (a.action === "guide.published" && a.detail?.version) return `${base}, version ${a.detail.version}`;
  if (a.action === "guide.renamed") return `${base} from ${a.detail.from} to ${a.detail.to}`;
  if (a.action === "intake.submitted" && a.detail?.update) return "Submitted updated answers";
  return base;
}

const actorLabel = (a) => (a.actor === "studio" ? "You" : a.actor === "owner" ? "Property owner" : a.actor === "guest" ? "A guest" : a.actor);

export default function Activity() {
  const log = useData(() => api.listActivity(), []);
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const all = log.data || [];
    if (!t) return all;
    return all.filter((a) => [describe(a), a.guide_name, a.client_name, actorLabel(a)].some((v) => (v || "").toLowerCase().includes(t)));
  }, [log.data, q]);

  return (
    <>
      <HeaderBar title="Activity" />
      <StudioBody>
        <SearchInput value={q} onChange={setQ} placeholder="Search activity" className="max-w-md mb-5" />
        {log.loading ? (
          <Loading />
        ) : log.error ? (
          <ErrorNote error={log.error} onRetry={log.reload} />
        ) : (
          <Table
            rows={rows}
            empty={<EmptyState icon="history" title="No activity" />}
            columns={[
              { key: "w", label: "When", width: 210, render: (a) => <span className="text-muted">{dateTime(a.created_at)}</span> },
              { key: "who", label: "Who", width: 240, render: (a) => <span className="truncate">{actorLabel(a)}</span> },
              { key: "what", label: "What", render: (a) => describe(a) },
              { key: "g", label: "Guide", width: 200, render: (a) => <span className="text-muted">{a.guide_name || ""}</span> },
              { key: "c", label: "Client", width: 180, render: (a) => <span className="text-muted">{a.client_name || ""}</span> },
            ]}
          />
        )}
      </StudioBody>
    </>
  );
}
