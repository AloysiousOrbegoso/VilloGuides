import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { relativeDate } from "../../lib/format";
import { useData } from "../../lib/useData";
import { Button } from "../ui/Button";
import { Segmented } from "../ui/Field";
import { Loading, ErrorNote } from "../ui/Loading";
import { Pill, RequestStatus } from "../ui/Pill";
import { EmptyState, Panel } from "../ui/Table";
import { useToast } from "../ui/Toast";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { StudioBody, useStudio } from "../sections/studio/StudioLayout";

const TYPE_LABEL = { edit: "Change", removal: "Removal", new_property: "New property" };

/** Requests from client dashboards. Destructive actions arrive here as requests, never as direct actions. */
export default function ChangeRequests() {
  const reqs = useData(() => api.listChangeRequests(), []);
  const [filter, setFilter] = useState("open");
  const { refreshStats } = useStudio();
  const navigate = useNavigate();
  const toast = useToast();

  const rows = useMemo(() => (reqs.data || []).filter((r) => (filter === "open" ? r.status === "open" : r.status !== "open")), [reqs.data, filter]);

  async function resolve(r, status) {
    await api.updateChangeRequest(r.id, { status });
    toast(status === "done" ? "Marked as done" : "Request declined");
    reqs.reload({ quiet: true });
    refreshStats();
  }

  return (
    <>
      <HeaderBar title="Change requests" />
      <StudioBody narrow>
        <div className="mb-5">
          <Segmented
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "open", label: "Open" },
              { value: "closed", label: "Resolved" },
            ]}
          />
        </div>
        {reqs.loading ? (
          <Loading />
        ) : reqs.error ? (
          <ErrorNote error={reqs.error} onRetry={reqs.reload} />
        ) : rows.length === 0 ? (
          <Panel>
            <EmptyState icon="message-2" title={filter === "open" ? "No open requests" : "Nothing resolved yet"}>
              Requests sent from client dashboards appear here.
            </EmptyState>
          </Panel>
        ) : (
          <div className="bg-card border border-line rounded-xl">
            {rows.map((r) => (
              <article key={r.id} className="px-6 py-5 border-b border-line-soft last:border-b-0">
                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                  <span className="font-semibold">{r.guide?.property_name ?? "New property"}</span>
                  <span className="text-muted">{r.client?.name}</span>
                  <Pill tone={r.type === "removal" ? "warn" : "neutral"}>{TYPE_LABEL[r.type]}</Pill>
                  {r.status !== "open" && <RequestStatus status={r.status} />}
                  <span className="ml-auto text-sm text-muted">{relativeDate(r.created_at)}</span>
                </div>
                <p className="m-0 mb-1 whitespace-pre-wrap leading-relaxed">{r.body}</p>
                <p className="m-0 text-sm text-muted">From {r.requested_by}</p>
                {r.status === "open" && (
                  <div className="flex gap-2 mt-4">
                    {r.guide && (
                      <Button size="sm" icon="pencil" onClick={() => navigate(`/guides/${r.guide.id}`)}>
                        Open in editor
                      </Button>
                    )}
                    <Button size="sm" onClick={() => resolve(r, "done")}>
                      Mark as done
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resolve(r, "declined")}>
                      Decline
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </StudioBody>
    </>
  );
}
