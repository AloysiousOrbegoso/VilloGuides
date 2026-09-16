import { Link } from "react-router-dom";
import { ThemeToggle } from "../../ui/ThemeToggle";

/**
 * Top of every studio screen: title or breadcrumbs on the left, actions on the right,
 * light and dark toggle last. The one primary action sits at the far right.
 */
export function HeaderBar({ title, crumbs, badge, actions, children }) {
  return (
    <header className="h-17 shrink-0 flex items-center gap-4 px-7 border-b border-line">
      <div className="flex items-center gap-2.5 min-w-0">
        {crumbs?.map((c) => (
          <span key={c.to} className="flex items-center gap-2.5">
            <Link to={c.to} className="text-muted no-underline hover:text-ink">
              {c.label}
            </Link>
            <span className="text-faint">/</span>
          </span>
        ))}
        <h1 className="text-lg font-semibold m-0 truncate">{title}</h1>
        {badge}
      </div>
      {children}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
