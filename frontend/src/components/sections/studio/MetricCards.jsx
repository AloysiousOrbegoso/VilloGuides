import { Icon } from "../../ui/icons";

/** Small counts above the review queue. Only the pending count uses the accent. */
export function MetricCards({ items }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map((m) => (
        <div key={m.label} className="bg-card border border-line rounded-xl px-4 py-3.5 flex items-center gap-3">
          <Icon name={m.icon} className={`text-lg ${m.accent ? "text-accent" : "text-muted"}`} />
          <div>
            <div className="text-xs text-muted">{m.label}</div>
            <div className="text-xl font-semibold leading-tight">{m.value ?? "0"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
