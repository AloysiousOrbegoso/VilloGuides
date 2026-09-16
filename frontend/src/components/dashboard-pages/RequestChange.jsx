import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { relativeDate } from "../../lib/format";
import { useData } from "../../lib/useData";
import { Button } from "../ui/Button";
import { Field, Select, Textarea } from "../ui/Field";
import { Loading } from "../ui/Loading";
import { Pill, RequestStatus } from "../ui/Pill";
import { EmptyState, Panel } from "../ui/Table";
import { useToast } from "../ui/Toast";
import { DashboardBody } from "../sections/dashboard/DashboardParts";
import ComingSoon from "../pages/ComingSoon";

const TITLES = {
  change: ["Request a change", "Tell us what to update and we will edit the guide for you."],
  removal: ["Request removal", "We will take the guide offline. The link stops working for guests."],
  "new-property": ["Add a property", ""],
};

/** Clients ask; the studio owner acts. Nothing here edits a guide directly. */
export default function RequestChange({ me }) {
  const { type = "change", guideId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const guides = useData(() => api.listDashboardGuides(me.client.subdomain), []);
  const [target, setTarget] = useState(guideId || "");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setTarget(guideId || ""), [guideId]);

  // v1 has no online checkout, so adding a property shows the coming soon page.
  if (type === "new-property") return <ComingSoon variant="payment" />;

  const [title, blurb] = TITLES[type] ?? TITLES.change;
  const adminOnly = type === "removal";

  if (adminOnly && me.user.role !== "admin") {
    return (
      <DashboardBody narrow>
        <Panel>
          <EmptyState icon="lock" title="Admins only">Ask an admin on your team to send this request.</EmptyState>
        </Panel>
      </DashboardBody>
    );
  }

  async function send() {
    setBusy(true);
    setError("");
    try {
      await api.createChangeRequest(
        me.client.subdomain,
        { guideId: target || null, type: type === "removal" ? "removal" : "edit", body },
        me.user.email,
        me.user.role,
      );
      toast("Request sent");
      navigate("/requests");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardBody narrow>
      <h1 className="text-2xl font-semibold m-0 mb-1">{title}</h1>
      <p className="text-muted mt-0 mb-6">{blurb}</p>
      <Panel className="flex flex-col gap-5">
        <Field label="Property" htmlFor="rq-guide">
          <Select id="rq-guide" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Choose a guide</option>
            {(guides.data || []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.property_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="What should change?" hint="The more specific, the faster we can do it." htmlFor="rq-body">
          <Textarea
            id="rq-body"
            minRows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === "removal" ? "Why this guide should come down" : "The Wi-Fi password changed to..."}
          />
        </Field>
        {error && <p className="text-accent text-sm m-0">{error}</p>}
        <div className="flex gap-2">
          <Button variant="primary" onClick={send} disabled={busy || !body.trim() || !target}>
            Send request
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </Panel>
    </DashboardBody>
  );
}

/** List of requests this client has sent. */
export function RequestList({ me }) {
  const reqs = useData(() => api.listDashboardRequests(me.client.subdomain), [me.client.subdomain]);
  const navigate = useNavigate();
  const mine = reqs.data || [];

  return (
    <DashboardBody narrow>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold m-0">Requests</h1>
          <p className="text-muted mt-1 mb-0">Changes your team has asked for.</p>
        </div>
        <Button icon="plus" onClick={() => navigate("/requests/change")}>
          New request
        </Button>
      </div>
      {reqs.loading ? (
        <Loading />
      ) : mine.length === 0 ? (
        <Panel>
          <EmptyState icon="message-2" title="No requests yet">Open a guide and use "Request a change" to ask for an edit.</EmptyState>
        </Panel>
      ) : (
        <div className="bg-card border border-line rounded-xl">
          {mine.map((r) => (
            <article key={r.id} className="px-6 py-5 border-b border-line-soft last:border-b-0">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="font-semibold">{r.guide?.property_name ?? "New property"}</span>
                {r.type === "removal" && <Pill tone="warn">Removal</Pill>}
                <RequestStatus status={r.status} />
                <span className="ml-auto text-sm text-muted">{relativeDate(r.created_at)}</span>
              </div>
              <p className="m-0 whitespace-pre-wrap leading-relaxed">{r.body}</p>
              <p className="m-0 mt-1 text-sm text-muted">Sent by {r.requested_by}</p>
            </article>
          ))}
        </div>
      )}
    </DashboardBody>
  );
}
