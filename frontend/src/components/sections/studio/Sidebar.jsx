import { NavLink } from "react-router-dom";
import { BrandMark, Icon } from "../../ui/icons";

const NAV = [
  { to: "/", label: "Review queue", icon: "clock", count: "pending", end: true },
  { to: "/guides", label: "All guides", icon: "notebook" },
  { to: "/intake-links", label: "Intake links", icon: "link" },
  { to: "/payments", label: "Payments", icon: "receipt" },
  { to: "/change-requests", label: "Change requests", icon: "message-2", count: "openRequests" },
  { to: "/clients", label: "Clients", icon: "building" },
  { to: "/activity", label: "Activity", icon: "history" },
];

function Item({ to, label, icon, count, end, stats }) {
  const n = count && stats ? stats[count] : 0;
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 h-[38px] px-2.5 rounded-lg text-[13.5px] no-underline transition-colors ${
          isActive ? "bg-navy text-nav-ink" : "text-nav-muted hover:text-nav-ink"
        }`
      }
    >
      <Icon name={icon} className="text-[17px]" />
      {label}
      {n > 0 && <span className="ml-auto text-[11px] text-nav-ink/70">{n}</span>}
    </NavLink>
  );
}

export function Sidebar({ stats }) {
  return (
    <aside className="bg-sidebar px-3.5 py-5 flex flex-col gap-1">
      <div className="flex items-center gap-2.5 px-2 pt-0.5 pb-7">
        <BrandMark size={26} tile />
        <span className="text-nav-ink text-base font-semibold">Villo Guides</span>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Studio">
        {NAV.map((n) => (
          <Item key={n.to} {...n} stats={stats} />
        ))}
      </nav>
      <div className="flex-1" />
      <Item to="/settings" label="Settings" icon="settings" />
    </aside>
  );
}
