import { forwardRef, useEffect, useId, useLayoutEffect, useRef } from "react";
import { Icon } from "./icons";

/*
  Form controls. Two sizes:
    md  studio and dashboard (40px)
    lg  intake form and public pages (52px, 16px text so phones do not zoom)
*/

const CONTROL = {
  md: "h-10 rounded-lg px-3 text-base bg-field",
  lg: "h-13 rounded-xl px-4 text-lg bg-card",
};
const BASE =
  "w-full border border-line text-ink placeholder:text-faint focus:outline-none focus:border-navy focus:bg-card transition-colors disabled:opacity-60";

export function Field({ label, hint, error, children, size = "md", className = "", htmlFor }) {
  const labelCls = size === "lg" ? "block text-md font-semibold text-ink mb-1.5" : "block text-sm text-muted mb-1.5";
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className={labelCls}>
          {label}
        </label>
      )}
      {hint && <p className={`text-muted -mt-0.5 mb-2 ${size === "lg" ? "text-sm" : "text-xs"}`}>{hint}</p>}
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-accent flex items-center gap-1.5">
          <Icon name="alert-circle" />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ size = "md", className = "", invalid, ...rest }, ref) {
  return <input ref={ref} className={`${BASE} ${CONTROL[size]} ${invalid ? "!border-accent" : ""} ${className}`} {...rest} />;
});

/** Grows with its content. minRows sets the resting height. */
export function Textarea({ size = "md", minRows = 2, className = "", value, invalid, ...rest }) {
  const ref = useRef(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useLayoutEffect(fit, [value]);
  useEffect(() => {
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const pad = size === "lg" ? "rounded-xl px-4 py-3 text-lg bg-card" : "rounded-lg px-3 py-2 text-base bg-field";
  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      className={`${BASE} ${pad} leading-relaxed resize-none overflow-hidden ${invalid ? "!border-accent" : ""} ${className}`}
      {...rest}
    />
  );
}

export function Select({ size = "md", className = "", children, ...rest }) {
  return (
    <div className={`relative ${className}`}>
      <select className={`${BASE} ${CONTROL[size]} appearance-none pr-9`} {...rest}>
        {children}
      </select>
      <Icon name="chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
    </div>
  );
}

export function Checkbox({ checked, onChange, children, size = "md", id }) {
  const auto = useId();
  const cid = id ?? auto;
  const box = size === "lg" ? "w-6 h-6 rounded-[7px]" : "w-[18px] h-[18px] rounded-[5px]";
  return (
    <label htmlFor={cid} className={`flex items-start gap-3 cursor-pointer ${size === "lg" ? "text-md" : "text-base"}`}>
      <input id={cid} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={`${box} mt-0.5 shrink-0 grid place-items-center border-[1.5px] transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-navy peer-focus-visible:outline-offset-2 ${
          checked ? "bg-navy border-navy text-white" : "bg-card border-faint"
        }`}
        aria-hidden="true"
      >
        {checked && <Icon name="check" className="text-[0.8em]" />}
      </span>
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}

/** Door and lockbox code warning (architecture 5.4 and 12). Actions are optional. */
export function SensitiveWarning({ onRemove, onKeep, size = "md" }) {
  return (
    <div
      role="status"
      className={`flex gap-2.5 border border-warn-line bg-warn-bg text-warn-ink ${
        size === "lg" ? "rounded-xl px-4 py-3.5 text-md" : "rounded-lg px-3.5 py-3 text-sm"
      }`}
    >
      <Icon name="alert-circle" className="text-[1.25em] mt-px" />
      <div className="leading-relaxed">
        <p className="m-0">
          <b>This looks like a door or lockbox code.</b> Anyone with the guide link can read it. Send codes to guests privately instead.
        </p>
        {(onRemove || onKeep) && (
          <div className="flex gap-5 mt-2">
            {onRemove && (
              <button type="button" className="font-semibold underline underline-offset-3" onClick={onRemove}>
                Remove the code
              </button>
            )}
            {onKeep && (
              <button type="button" className="font-semibold underline underline-offset-3" onClick={onKeep}>
                Keep it
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex p-[3px] gap-0.5 border border-line rounded-[9px] bg-card">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-7 px-3 rounded-md inline-flex items-center gap-1.5 text-sm transition-colors ${
            value === o.value ? "bg-navy-soft text-ink font-semibold" : "text-muted hover:text-ink"
          }`}
        >
          {o.icon && <Icon name={o.icon} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${BASE} ${CONTROL.md} pl-9`}
      />
    </div>
  );
}
