import { Link } from "react-router-dom";
import { Icon } from "./icons";

/*
  Buttons say exactly what happens. Maroon (primary) is for the one action that
  matters on a screen. Everything else is secondary, ghost, or link.
*/

const SIZES = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-9 px-4 text-sm rounded-lg gap-2",
  lg: "h-13 px-5 text-lg rounded-xl gap-2",
};

const VARIANTS = {
  primary:
    "bg-accent border-accent text-on-accent hover:brightness-110 disabled:bg-transparent disabled:border-line disabled:text-faint disabled:hover:brightness-100",
  secondary: "bg-card border-line text-ink hover:bg-field disabled:text-faint",
  ghost: "bg-transparent border-transparent text-muted hover:bg-card hover:text-ink disabled:text-faint",
  danger: "bg-card border-line text-accent hover:bg-pill disabled:text-faint",
  link: "bg-transparent border-transparent text-link !px-0 !h-auto hover:underline underline-offset-4",
};

export function buttonClass({ variant = "secondary", size = "md", block = false, className = "" } = {}) {
  return [
    "inline-flex items-center justify-center border font-semibold whitespace-nowrap transition-[background-color,filter,color]",
    SIZES[size],
    VARIANTS[variant],
    block ? "w-full" : "",
    className,
  ].join(" ");
}

export function Button({ variant, size, block, icon, iconRight, children, className, to, href, type = "button", ...rest }) {
  const cls = buttonClass({ variant, size, block, className });
  const content = (
    <>
      {icon && <Icon name={icon} className="text-[1.15em] opacity-90" />}
      {children}
      {iconRight && <Icon name={iconRight} className="text-[1.15em]" />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{content}</a>;
  return <button type={type} className={cls} {...rest}>{content}</button>;
}

/** Square icon-only button. label is required for screen readers. */
export function IconButton({ icon, label, size = "md", variant = "secondary", className = "", ...rest }) {
  const dims = size === "sm" ? "w-8 h-8 text-[15px]" : size === "lg" ? "w-13 h-13 text-xl rounded-xl" : "w-9 h-9 text-base";
  const look =
    variant === "ghost"
      ? "bg-transparent border-transparent text-muted hover:bg-card hover:text-ink"
      : "bg-card border-line text-muted hover:text-ink hover:bg-field";
  return (
    <button type="button" aria-label={label} title={label} className={`inline-grid place-items-center rounded-lg border ${dims} ${look} ${className}`} {...rest}>
      <Icon name={icon} />
    </button>
  );
}
