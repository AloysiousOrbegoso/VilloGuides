import { useEffect, useState } from "react";
import { api, API_MODE } from "../../lib/api";
import { checkSubdomainFormat } from "../../lib/hostname";
import { themes } from "../../lib/guideThemes";
import { useData } from "../../lib/useData";
import { Button, IconButton } from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { Loading } from "../ui/Loading";
import { Panel } from "../ui/Table";
import { useToast } from "../ui/Toast";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { StudioBody } from "../sections/studio/StudioLayout";

export default function StudioSettings() {
  const settings = useData(() => api.getSettings(), []);
  const [form, setForm] = useState(null);
  const [reserve, setReserve] = useState("");
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  if (settings.loading || !form) {
    return (
      <>
        <HeaderBar title="Settings" />
        <Loading />
      </>
    );
  }

  async function save(patch) {
    const next = { ...form, ...patch };
    setForm(next);
    await api.updateSettings(patch);
    toast("Settings saved");
  }

  function addReserved() {
    const name = reserve.trim().toLowerCase();
    const fmt = checkSubdomainFormat(name);
    if (fmt && fmt !== "This name is reserved.") return setError(fmt);
    if (form.reserved.includes(name) || form.extra_reserved.includes(name)) return setError("Already reserved.");
    setError("");
    setReserve("");
    save({ extra_reserved: [...form.extra_reserved, name] });
  }

  return (
    <>
      <HeaderBar title="Settings" />
      <StudioBody narrow>
        <div className="flex flex-col gap-6">
          <Panel>
            <h2 className="text-md font-semibold mt-0 mb-5">Template defaults</h2>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Theme for new guides" htmlFor="st-theme">
                <Select id="st-theme" value={form.default_theme} onChange={(e) => save({ default_theme: e.target.value })}>
                  {themes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Intake links expire after" htmlFor="st-days">
                <Select id="st-days" value={form.intake_link_days} onChange={(e) => save({ intake_link_days: Number(e.target.value) })}>
                  {[7, 14, 30, 60, 90].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-md font-semibold mt-0 mb-1">Notifications</h2>
            <p className="text-muted mt-0 mb-5">New submissions and change requests are emailed here once an email provider is set up.</p>
            <div className="flex gap-2 max-w-lg">
              <Input
                value={form.notification_email}
                onChange={(e) => setForm({ ...form, notification_email: e.target.value })}
                placeholder="you@example.com"
                aria-label="Notification email"
              />
              <Button onClick={() => save({ notification_email: form.notification_email })}>Save</Button>
            </div>
          </Panel>

          <Panel>
            <h2 className="text-md font-semibold mt-0 mb-1">Reserved subdomains</h2>
            <p className="text-muted mt-0 mb-5">No client or guide can use these. The system list is fixed; add your own below.</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {form.reserved.map((r) => (
                <span key={r} className="text-sm px-2.5 py-0.5 rounded-full bg-field border border-line text-muted">
                  {r}
                </span>
              ))}
              {form.extra_reserved.map((r) => (
                <span key={r} className="text-sm pl-2.5 pr-1 py-0.5 rounded-full bg-navy-soft text-ink inline-flex items-center gap-1">
                  {r}
                  <IconButton
                    icon="x"
                    label={`Unreserve ${r}`}
                    size="sm"
                    variant="ghost"
                    className="!w-5 !h-5 !text-xs"
                    onClick={() => save({ extra_reserved: form.extra_reserved.filter((x) => x !== r) })}
                  />
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <Input value={reserve} onChange={(e) => setReserve(e.target.value)} placeholder="name" aria-label="Subdomain to reserve" />
              <Button onClick={addReserved} disabled={!reserve.trim()}>
                Reserve
              </Button>
            </div>
            {error && <p className="text-accent text-sm mt-2 mb-0">{error}</p>}
          </Panel>

          {API_MODE === "mock" && (
            <Panel>
              <h2 className="text-md font-semibold mt-0 mb-1">Mock data</h2>
              <p className="text-muted mt-0 mb-5">This build uses sample data saved in your browser. Resetting brings back the original sample clients and guides.</p>
              <Button
                variant="danger"
                icon="refresh"
                onClick={async () => {
                  await api.resetMockData();
                  window.location.reload();
                }}
              >
                Reset mock data
              </Button>
            </Panel>
          )}
        </div>
      </StudioBody>
    </>
  );
}
