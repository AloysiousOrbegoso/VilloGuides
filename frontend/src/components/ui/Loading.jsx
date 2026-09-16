import { Icon } from "./icons";

export function Loading({ full = false, label = "Loading" }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-muted text-sm ${full ? "min-h-screen" : "py-16"}`} role="status">
      <Icon name="loader-2" className="animate-spin" />
      {label}
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  return (
    <div className="flex items-center gap-3 py-10 text-muted">
      <Icon name="alert-circle" className="text-accent text-lg" />
      <span>{error?.message || "Something went wrong."}</span>
      {onRetry && (
        <button type="button" className="font-semibold text-link underline underline-offset-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
