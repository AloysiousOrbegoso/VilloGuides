import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { copyText } from "../../lib/clipboard";
import { relativeDate, shortDate } from "../../lib/format";
import { intakeUrl } from "../../lib/hostname";
import { useData } from "../../lib/useData";
import { Button, IconButton } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field, Input, Segmented, Select } from "../ui/Field";
import { Loading, ErrorNote } from "../ui/Loading";
import { Menu } from "../ui/Menu";
import { IntakeStatus } from "../ui/Pill";
import { EmptyState, Table, Cell } from "../ui/Table";
import { useToast } from "../ui/Toast";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { StudioBody, useStudio } from "../sections/studio/StudioLayout";

export default function IntakeLinks() {
  const links = useData(() => api.listIntakeLinks(), []);
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const { refreshStats } = useStudio();

  async function copy(t) {
    await copyText(intakeUrl(t));
    toast("Link copied");
  }
  async function expire(t) {
    await api.expireIntakeLink(t);
    toast("Link expired");
    links.reload({ quiet: true });
  }
  async function renew(l) {
    const created = await api.createIntakeLink({ guideId: l.guide_id });
    await copyText(intakeUrl(created.token));
    toast("New link copied. The old one no longer works.");
    links.reload({ quiet: true });
  }

  return (
    <>
      <HeaderBar
        title="Intake links"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setOpen(true)}>
            New intake link
          </Button>
        }
      />
      <StudioBody>
        <p className="text-muted mt-0 mb-5 max-w-2xl">
          Each link opens a private form for one property. Owners need no account. Opening the same link again brings back their answers.
        </p>
        {links.loading ? (
          <Loading />
        ) : links.error ? (
          <ErrorNote error={links.error} onRetry={links.reload} />
        ) : (
          <Table
            rows={links.data}
            rowKey="token"
            empty={<EmptyState icon="link" title="No intake links yet">Create one to send a property owner the form.</EmptyState>}
            columns={[
              { key: "p", label: "Property", render: (l) => <Cell title={l.guide?.property_name} detail={l.guide?.client?.name} /> },
              { key: "s", label: "Status", width: 130, render: (l) => <IntakeStatus status={l.status} /> },
              { key: "c", label: "Created", width: 130, render: (l) => <span className="text-muted">{relativeDate(l.created_at)}</span> },
              {
                key: "e",
                label: "Expires",
                width: 140,
                render: (l) => <span className="text-muted">{l.status === "expired" ? "Expired" : shortDate(l.expires_at)}</span>,
              },
              {
                key: "a",
                label: "",
                width: 150,
                align: "right",
                render: (l) => (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" icon="copy" disabled={l.status === "expired"} onClick={() => copy(l.token)}>
                      Copy link
                    </Button>
                    <Menu
                      trigger={({ toggle }) => <IconButton icon="dots" label="More actions" size="sm" variant="ghost" onClick={toggle} />}
                      items={[
                        { label: "Open the form", icon: "external-link", onClick: () => window.open(intakeUrl(l.token), "_blank"), disabled: l.status === "expired" },
                        { label: "Replace with a new link", icon: "refresh", onClick: () => renew(l) },
                        "divider",
                        { label: "Expire this link", icon: "link-off", danger: true, onClick: () => expire(l.token), disabled: l.status === "expired" },
                      ]}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </StudioBody>
      <NewIntakeLinkDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          links.reload({ quiet: true });
          refreshStats();
        }}
      />
    </>
  );
}

/** Creates a link for an existing draft guide, or a new guide and its link in one step. */
export function NewIntakeLinkDialog({ open, onClose, onCreated, presetGuideId }) {
  const [mode, setMode] = useState("new");
  const [clients, setClients] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [guideId, setGuideId] = useState(presetGuideId || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setError("");
    setName("");
    setMode(presetGuideId ? "existing" : "new");
    setGuideId(presetGuideId || "");
    api.listClients().then((c) => {
      setClients(c);
      setClientId((id) => id || c[0]?.id || "");
    });
    api.listGuides().then((g) => setDrafts(g.filter((x) => x.status !== "suspended")));
  }, [open, presetGuideId]);

  async function create() {
    setBusy(true);
    setError("");
    try {
      const link = await api.createIntakeLink(mode === "existing" ? { guideId } : { clientId, propertyName: name });
      setCreated(link);
      onCreated?.(link);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const url = created ? intakeUrl(created.token) : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={created ? "Link ready to send" : "New intake link"}
      description={created ? `For ${created.guide?.property_name}. Send it by chat or email.` : "The owner fills in the form on their phone. No account needed."}
      footer={
        created ? (
          <>
            <Button onClick={onClose}>Done</Button>
            <Button
              variant="primary"
              icon="copy"
              onClick={async () => {
                await copyText(url);
                toast("Link copied");
              }}
            >
              Copy link
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={create} disabled={busy || (mode === "existing" ? !guideId : !clientId || !name.trim())}>
              Create link
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="bg-field border border-line rounded-lg px-3.5 py-3 text-base break-all select-all">{url}</div>
      ) : (
        <div className="flex flex-col gap-5">
          {!presetGuideId && (
            <Segmented
              label="Link for"
              value={mode}
              onChange={setMode}
              options={[
                { value: "new", label: "New property" },
                { value: "existing", label: "Existing guide" },
              ]}
            />
          )}
          {mode === "new" ? (
            <>
              <Field label="Client" htmlFor="nl-client">
                <Select id="nl-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Property name" htmlFor="nl-name">
                <Input id="nl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Casa Luna" />
              </Field>
            </>
          ) : (
            <Field label="Guide" htmlFor="nl-guide" hint="Updates reuse the owner's previous answers.">
              <Select id="nl-guide" value={guideId} onChange={(e) => setGuideId(e.target.value)}>
                <option value="">Choose a guide</option>
                {drafts.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.property_name}, {g.client?.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {error && <p className="text-accent text-sm m-0">{error}</p>}
        </div>
      )}
    </Dialog>
  );
}
