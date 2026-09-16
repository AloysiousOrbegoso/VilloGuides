import { useNavigate } from "react-router-dom";
import { relativeDate } from "../../../lib/format";
import { Button } from "../../ui/Button";
import { Avatar, Pill } from "../../ui/Pill";
import { EmptyState, Table } from "../../ui/Table";

export function QueueTable({ rows }) {
  const navigate = useNavigate();
  const open = (g) => navigate(`/guides/${g.id}`);
  return (
    <Table
      rows={rows}
      onRowClick={open}
      empty={<EmptyState icon="circle-check" title="Nothing to review">New and updated intake submissions will show up here.</EmptyState>}
      columns={[
        {
          key: "property",
          label: "Property",
          render: (g) => (
            <div className="flex items-center gap-3">
              <Avatar name={g.client?.name} tone={g.client?.type === "company" ? "accent" : "neutral"} />
              <div className="min-w-0">
                <div className="font-semibold truncate">{g.property_name}</div>
                <div className="text-sm text-muted truncate">{g.city || "No city yet"}</div>
              </div>
              <Pill tone={g.kind === "new" ? "accent" : "neutral"}>{g.kind === "new" ? "New" : "Updated"}</Pill>
            </div>
          ),
        },
        { key: "client", label: "Client", width: 200, render: (g) => <span className="text-muted">{g.client?.name}</span> },
        { key: "paid", label: "Payment", width: 120, render: (g) => <span className="text-muted">{g.paid ? "Paid" : "Not paid"}</span> },
        { key: "submitted", label: "Submitted", width: 130, render: (g) => <span className="text-muted">{relativeDate(g.submitted_at)}</span> },
        {
          key: "action",
          label: "",
          width: 100,
          align: "right",
          render: (g) => (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                open(g);
              }}
            >
              Review
            </Button>
          ),
        },
      ]}
    />
  );
}
