import { useState } from "react";
import { api, API_MODE } from "../../lib/api";
import { downloadBlob } from "../../lib/clipboard";
import { Button } from "../ui/Button";
import { Icon } from "../ui/icons";
import { Panel } from "../ui/Table";
import { DashboardBody } from "../sections/dashboard/DashboardParts";

/** Admin only: everything this client's guides contain, to keep or move elsewhere. */
export default function Export({ me }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const data = await api.exportClient(me.client.subdomain);
      const blob = data instanceof Blob ? data : new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${me.client.subdomain}-guides.${data instanceof Blob ? "zip" : "json"}`);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardBody narrow>
      <h1 className="text-2xl font-semibold m-0 mb-1">Export</h1>
      <p className="text-muted mt-0 mb-6">Download the content of every published guide for {me.client.name}.</p>
      <Panel>
        <ul className="list-none m-0 p-0 mb-6">
          {[
            ["file-text", "All text from every section"],
            ["photo", "Every photo at full size"],
            ["map-pin", "Places and map links"],
          ].map(([icon, label]) => (
            <li key={label} className="flex items-center gap-3 py-2">
              <Icon name={icon} className="text-lg text-muted" />
              {label}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <Button variant="primary" icon="download" onClick={run} disabled={busy}>
            {busy ? "Preparing" : "Download export"}
          </Button>
          {done && <span className="text-sm text-ok">Downloaded</span>}
        </div>
        {error && <p className="text-accent text-sm mt-3 mb-0">{error}</p>}
        {API_MODE === "mock" && <p className="text-xs text-muted mt-4 mb-0">This sample build exports a JSON file. The live version sends a ZIP with the photos.</p>}
      </Panel>
    </DashboardBody>
  );
}
