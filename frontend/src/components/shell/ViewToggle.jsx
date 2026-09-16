export function ViewToggle({ mode, onChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="Preview as">
      {["desktop", "phone"].map((m) => (
        <button key={m} type="button" aria-pressed={mode === m} onClick={() => onChange(m)}>
          <i className={`ti ti-device-${m === "desktop" ? "desktop" : "mobile"}`} aria-hidden="true" />
          {m === "desktop" ? "Desktop" : "Phone"}
        </button>
      ))}
    </div>
  );
}
