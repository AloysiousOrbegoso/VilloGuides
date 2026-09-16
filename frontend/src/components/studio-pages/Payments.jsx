import { useMemo, useState } from "react";
import { api } from "../../lib/api";
import { money, shortDate, plural } from "../../lib/format";
import { useData } from "../../lib/useData";
import { Button, IconButton } from "../ui/Button";
import { Segmented } from "../ui/Field";
import { Loading, ErrorNote } from "../ui/Loading";
import { Menu } from "../ui/Menu";
import { Pill } from "../ui/Pill";
import { EmptyState, Table, Cell } from "../ui/Table";
import { useToast } from "../ui/Toast";
import { HeaderBar } from "../sections/studio/HeaderBar";
import { PaymentDialog } from "../sections/studio/PaymentDialog";
import { StudioBody } from "../sections/studio/StudioLayout";

export default function Payments() {
  const guides = useData(() => api.listGuides(), []);
  const clients = useData(() => api.listClients(), []);
  const [filter, setFilter] = useState("unpaid");
  const [paying, setPaying] = useState(null);
  const toast = useToast();

  const rows = useMemo(() => {
    const all = guides.data || [];
    if (filter === "unpaid") return all.filter((g) => !g.paid);
    if (filter === "paid") return all.filter((g) => g.paid).sort((a, b) => (b.paid_at || "").localeCompare(a.paid_at || ""));
    return all;
  }, [guides.data, filter]);

  // The add-on only matters for clients who would not qualify on their own (architecture 2 and 8.1).
  const addonClients = (clients.data || []).filter((c) => c.paid_guides < 2);

  async function removePayment(g) {
    await api.markUnpaid(g.id);
    toast("Payment removed");
    guides.reload({ quiet: true });
    clients.reload({ quiet: true });
  }

  async function setAddon(c, paid) {
    await api.updateClient(c.id, { dashboard_addon_paid: paid ? 1 : 0 });
    toast(paid ? "Dashboard add-on marked as paid" : "Dashboard add-on removed");
    clients.reload({ quiet: true });
  }

  return (
    <>
      <HeaderBar title="Payments" />
      <StudioBody>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-md font-semibold m-0">Guide payments</h2>
          <Segmented
            label="Show"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "unpaid", label: "Not paid" },
              { value: "paid", label: "Paid" },
              { value: "all", label: "All" },
            ]}
          />
        </div>
        {guides.loading ? (
          <Loading />
        ) : guides.error ? (
          <ErrorNote error={guides.error} onRetry={guides.reload} />
        ) : (
          <Table
            rows={rows}
            empty={<EmptyState icon="receipt" title={filter === "unpaid" ? "Everything is paid" : "No payments yet"} />}
            columns={[
              { key: "p", label: "Property", render: (g) => <Cell title={g.property_name} detail={g.client?.name} /> },
              {
                key: "s",
                label: "Status",
                width: 110,
                render: (g) => (g.paid ? <Pill tone="neutral">Paid</Pill> : <Pill tone="accent">Not paid</Pill>),
              },
              { key: "a", label: "Amount", width: 120, render: (g) => <span className="text-muted">{g.paid ? money(g.payment_amount, g.payment_currency) : ""}</span> },
              { key: "m", label: "Method", width: 140, render: (g) => <span className="text-muted">{g.payment_method || ""}</span> },
              { key: "r", label: "Reference", width: 160, render: (g) => <span className="text-muted">{g.payment_reference || ""}</span> },
              { key: "d", label: "Received", width: 130, render: (g) => <span className="text-muted">{shortDate(g.paid_at)}</span> },
              {
                key: "x",
                label: "",
                width: 140,
                align: "right",
                render: (g) =>
                  g.paid ? (
                    <Menu
                      trigger={({ toggle }) => <IconButton icon="dots" label="More actions" size="sm" variant="ghost" onClick={toggle} />}
                      items={[{ label: "Remove payment", icon: "x", danger: true, onClick: () => removePayment(g) }]}
                    />
                  ) : (
                    <Button size="sm" onClick={() => setPaying(g)}>
                      Mark as paid
                    </Button>
                  ),
              },
            ]}
          />
        )}

        <div className="mt-12 mb-5">
          <h2 className="text-md font-semibold m-0">Dashboard add-on</h2>
          <p className="text-muted mt-1 mb-0 max-w-2xl">
            Clients with two or more paid guides get a dashboard included. A single-property client can buy it for $5, one time.
          </p>
        </div>
        {clients.loading ? (
          <Loading />
        ) : (
          <Table
            rows={addonClients}
            empty={<EmptyState icon="layout-dashboard" title="Every client already has a dashboard" />}
            columns={[
              { key: "n", label: "Client", render: (c) => <Cell title={c.name} detail={c.type === "company" ? "Company" : "Individual owner"} /> },
              { key: "g", label: "Paid guides", width: 140, render: (c) => <span className="text-muted">{plural(c.paid_guides, "guide")}</span> },
              {
                key: "s",
                label: "Add-on",
                width: 130,
                render: (c) => (c.dashboard_addon_paid ? <Pill tone="neutral">Paid</Pill> : <span className="text-muted">Not bought</span>),
              },
              {
                key: "x",
                label: "",
                width: 170,
                align: "right",
                render: (c) =>
                  c.dashboard_addon_paid ? (
                    <Button size="sm" variant="ghost" onClick={() => setAddon(c, false)}>
                      Remove add-on
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setAddon(c, true)}>
                      Mark add-on paid
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </StudioBody>
      <PaymentDialog
        open={!!paying}
        guide={paying}
        onClose={() => setPaying(null)}
        onSaved={() => {
          toast("Payment recorded");
          guides.reload({ quiet: true });
          clients.reload({ quiet: true });
        }}
      />
    </>
  );
}
