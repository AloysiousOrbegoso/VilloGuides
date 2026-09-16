import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { plural } from "../../lib/format";
import { dashboardUrl, displayHost, suggestSubdomain } from "../../lib/hostname";
import { useData } from "../../lib/useData";
import { Button, IconButton } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, Input, Segmented, Select } from "../ui/Field";
import { Loading, ErrorNote } from "../ui/Loading";
import { Avatar } from "../ui/Pill";
import { EmptyState, Table, Cell } from "../ui/Table";
import { useToast } from "../ui/Toast";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { StudioBody } from "../sections/studio/StudioLayout";
import { SubdomainInput } from "../sections/studio/SubdomainInput";

export default function Clients() {
  const clients = useData(() => api.listClients(), []);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const selected = (clients.data || []).find((c) => c.id === openId);

  return (
    <>
      <HeaderBar
        title="Clients"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            New client
          </Button>
        }
      />
      <StudioBody>
        {clients.loading ? (
          <Loading />
        ) : clients.error ? (
          <ErrorNote error={clients.error} onRetry={clients.reload} />
        ) : (
          <Table
            rows={clients.data}
            onRowClick={(c) => setOpenId(c.id)}
            empty={<EmptyState icon="building" title="No clients yet" />}
            columns={[
              {
                key: "n",
                label: "Client",
                render: (c) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} tone={c.type === "company" ? "accent" : "neutral"} />
                    <Cell title={c.name} detail={c.type === "company" ? "Company" : "Individual owner"} />
                  </div>
                ),
              },
              { key: "s", label: "Dashboard address", width: 260, render: (c) => <span className="text-muted">{displayHost(c.subdomain)}</span> },
              { key: "g", label: "Guides", width: 150, render: (c) => <span className="text-muted">{c.guides} total, {c.paid_guides} paid</span> },
              {
                key: "d",
                label: "Dashboard",
                width: 150,
                render: (c) => <span className={c.eligible ? "" : "text-muted"}>{c.eligible ? "Available" : "Links only"}</span>,
              },
              { key: "u", label: "Staff", width: 100, render: (c) => <span className="text-muted">{plural(c.users.length, "person", "people")}</span> },
            ]}
          />
        )}
      </StudioBody>
      <ClientDrawer client={selected} onClose={() => setOpenId(null)} onChanged={() => clients.reload({ quiet: true })} />
      <NewClientDialog open={creating} onClose={() => setCreating(false)} onCreated={() => clients.reload({ quiet: true })} />
    </>
  );
}

function NewClientDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("company");
  const [sub, setSub] = useState({ value: "", ok: false });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setName("");
      setSub({ value: "", ok: false });
      setTouched(false);
      setError("");
    }
  }, [open]);

  async function create() {
    try {
      await api.createClient({ name, type, subdomain: sub.value });
      toast("Client created");
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New client"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!name.trim() || !sub.ok}>
            Create client
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Segmented
          label="Client type"
          value={type}
          onChange={setType}
          options={[
            { value: "company", label: "Company" },
            { value: "individual", label: "Individual owner" },
          ]}
        />
        <Field label="Name" htmlFor="nc-name">
          <Input
            id="nc-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!touched) setSub({ value: suggestSubdomain(e.target.value), ok: false });
            }}
          />
        </Field>
        <Field label="Dashboard address" htmlFor="nc-sub" hint="Shares one pool with guide addresses, so no property can take it later.">
          <SubdomainInput
            id="nc-sub"
            value={sub.value}
            onChange={(s) => {
              setTouched(true);
              setSub(s);
            }}
          />
        </Field>
        {error && <p className="text-accent text-sm m-0">{error}</p>}
      </div>
    </Dialog>
  );
}

function ClientDrawer({ client, onClose, onChanged }) {
  const [form, setForm] = useState(null);
  const [sub, setSub] = useState({ value: "", ok: false });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (client) {
      setForm({ name: client.name, type: client.type, access_aud: client.access_aud || "" });
      setSub({ value: client.subdomain, ok: false });
      setError("");
      setEmail("");
    }
  }, [client]);

  if (!client || !form) return null;

  const subChanged = sub.value !== client.subdomain;
  const dirty = form.name !== client.name || form.type !== client.type || form.access_aud !== (client.access_aud || "") || subChanged;

  async function save() {
    setError("");
    try {
      await api.updateClient(client.id, { ...form, subdomain: sub.value });
      toast("Client saved");
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  }

  async function addUser() {
    setError("");
    try {
      await api.addClientUser(client.id, { email, role });
      setEmail("");
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <Dialog
      open
      side="right"
      width={520}
      onClose={onClose}
      title={client.name}
      description={client.eligible ? "Dashboard available" : "Links and QR codes only. The dashboard unlocks at two paid guides or with the add-on."}
      footer={
        <>
          <Button variant="ghost" icon="notebook" onClick={() => navigate(`/guides?client=${client.id}`)} className="mr-auto">
            View guides
          </Button>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={save} disabled={!dirty || (subChanged && !sub.ok)}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Name" htmlFor="cd-name">
          <Input id="cd-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Type">
          <Segmented
            label="Client type"
            value={form.type}
            onChange={(type) => setForm({ ...form, type })}
            options={[
              { value: "company", label: "Company" },
              { value: "individual", label: "Individual owner" },
            ]}
          />
        </Field>
        <Field label="Dashboard address" htmlFor="cd-sub">
          <SubdomainInput id="cd-sub" value={sub.value} initial={client.subdomain} clientId={client.id} onChange={setSub} />
        </Field>
        <Field
          label="Cloudflare Access audience (AUD)"
          htmlFor="cd-aud"
          hint="Create this client's Access application in the Cloudflare dashboard, then paste its AUD tag here."
        >
          <Input id="cd-aud" value={form.access_aud} onChange={(e) => setForm({ ...form, access_aud: e.target.value })} placeholder="Not set" />
        </Field>
        {client.eligible && (
          <a href={dashboardUrl(client.subdomain)} target="_blank" rel="noreferrer" className="text-link font-semibold text-sm">
            Open this client's dashboard
          </a>
        )}

        <div className="border-t border-line-soft pt-5">
          <h3 className="text-base font-semibold mt-0 mb-1">Staff who can sign in</h3>
          <p className="text-sm text-muted mt-0 mb-4">Admins can request removals and export. Support can view, share, and request changes.</p>
          <ul className="list-none m-0 p-0 mb-4">
            {client.users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5 border-b border-line-soft last:border-b-0">
                <span className="flex-1 min-w-0 truncate">{u.email}</span>
                <Select
                  value={u.role}
                  className="w-32"
                  aria-label={`Role for ${u.email}`}
                  onChange={async (e) => {
                    await api.updateClientUser(u.id, { role: e.target.value });
                    onChanged();
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="support">Support</option>
                </Select>
                <IconButton
                  icon="x"
                  label={`Remove ${u.email}`}
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await api.removeClientUser(u.id);
                    onChanged();
                  }}
                />
              </li>
            ))}
            {client.users.length === 0 && <li className="text-muted text-sm py-2">No staff yet.</li>}
          </ul>
          <div className="flex gap-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" aria-label="Staff email" />
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-32 shrink-0" aria-label="Role">
              <option value="admin">Admin</option>
              <option value="support">Support</option>
            </Select>
            <Button onClick={addUser} disabled={!email.trim()}>
              Add
            </Button>
          </div>
          <p className="text-xs text-muted mt-3 mb-0">Every email here counts toward the 50-user Cloudflare Access limit.</p>
        </div>
        {error && <p className="text-accent text-sm m-0">{error}</p>}
      </div>
    </Dialog>
  );
}
