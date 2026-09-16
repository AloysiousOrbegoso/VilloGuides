import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { relativeDate } from "../../lib/format";
import { displayHost } from "../../lib/hostname";
import { useData } from "../../lib/useData";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, Input, SearchInput, Select } from "../ui/Field";
import { Loading, ErrorNote } from "../ui/Loading";
import { GuideStatus } from "../ui/Pill";
import { EmptyState, Table, Cell } from "../ui/Table";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { StudioBody } from "../sections/studio/StudioLayout";

const STATUSES = [
  ["", "All statuses"],
  ["draft", "Draft"],
  ["in_review", "In review"],
  ["published", "Published"],
  ["unpublished", "Unpublished"],
  ["suspended", "Suspended"],
];

export default function AllGuides() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const clientId = params.get("client") || "";
  const [q, setQ] = useState("");
  const guides = useData(() => api.listGuides({ status, clientId }), [status, clientId]);
  const clients = useData(() => api.listClients(), []);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || !guides.data) return guides.data || [];
    return guides.data.filter((g) => [g.property_name, g.city, g.owner_name, g.slug, g.client?.name].some((v) => (v || "").toLowerCase().includes(t)));
  }, [guides.data, q]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <HeaderBar
        title="All guides"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            New guide
          </Button>
        }
      />
      <StudioBody>
        <div className="flex flex-wrap gap-3 mb-5">
          <SearchInput value={q} onChange={setQ} placeholder="Search by property, owner, city, or subdomain" className="flex-1 min-w-64 max-w-md" />
          <Select value={status} onChange={(e) => setFilter("status", e.target.value)} className="w-44" aria-label="Status">
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select value={clientId} onChange={(e) => setFilter("client", e.target.value)} className="w-52" aria-label="Client">
            <option value="">All clients</option>
            {(clients.data || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        {guides.loading ? (
          <Loading />
        ) : guides.error ? (
          <ErrorNote error={guides.error} onRetry={guides.reload} />
        ) : (
          <Table
            rows={rows}
            onRowClick={(g) => navigate(`/guides/${g.id}`)}
            empty={<EmptyState icon="notebook" title="No guides match">Try another search or filter.</EmptyState>}
            columns={[
              { key: "p", label: "Property", render: (g) => <Cell title={g.property_name} detail={[g.city, g.owner_name].filter(Boolean).join(", ")} /> },
              { key: "c", label: "Client", width: 180, render: (g) => <span className="text-muted">{g.client?.name}</span> },
              { key: "s", label: "Status", width: 130, render: (g) => <GuideStatus status={g.status} /> },
              { key: "d", label: "Subdomain", width: 250, render: (g) => <span className="text-muted">{g.slug ? displayHost(g.slug) : "Not set"}</span> },
              { key: "pd", label: "Payment", width: 100, render: (g) => <span className="text-muted">{g.paid ? "Paid" : "Not paid"}</span> },
              { key: "u", label: "Updated", width: 120, render: (g) => <span className="text-muted">{relativeDate(g.updated_at)}</span> },
            ]}
          />
        )}
      </StudioBody>
      <NewGuideDialog open={creating} onClose={() => setCreating(false)} clients={clients.data || []} />
    </>
  );
}

function NewGuideDialog({ open, onClose, clients }) {
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setName("");
      setCity("");
      setError("");
      setClientId((id) => id || clients[0]?.id || "");
    }
  }, [open, clients]);

  async function create() {
    setBusy(true);
    setError("");
    try {
      const g = await api.createGuide({ clientId, propertyName: name, city });
      navigate(`/guides/${g.id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New guide"
      description="Starts an empty draft. To have the owner fill it in, create an intake link instead."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={busy || !clientId || !name.trim()}>
            Create draft
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Client" htmlFor="ng-client">
          <Select id="ng-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Property name" htmlFor="ng-name">
          <Input id="ng-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="City" htmlFor="ng-city">
          <Input id="ng-city" value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        {error && <p className="text-accent text-sm m-0">{error}</p>}
      </div>
    </Dialog>
  );
}
