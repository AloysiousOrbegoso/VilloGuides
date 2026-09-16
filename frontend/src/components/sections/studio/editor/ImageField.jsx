import { useRef, useState } from "react";
import { api } from "../../../../lib/api";
import { Button } from "../../../ui/Button";
import { Icon } from "../../../ui/icons";

/**
 * Photo picker for the editor. Photos are resized in the browser to 1600px WebP
 * under 1 MB before upload (architecture 12). upload: override the uploader.
 */
export function ImageField({ value, onChange, aspect = "16/10", round = false, upload = api.uploadImage, label = "Upload photo" }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { url } = await upload(file);
      onChange(url);
    } catch (err) {
      setError(err.message || "The photo could not be uploaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className={`relative shrink-0 overflow-hidden bg-field border border-line grid place-items-center text-faint ${round ? "w-16 h-16 rounded-full" : "w-40 rounded-lg"}`}
          style={round ? undefined : { aspectRatio: aspect }}
        >
          {value ? <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <Icon name="photo" className="text-2xl" />}
          {busy && <div className="absolute inset-0 bg-card/80 grid place-items-center text-xs text-muted">Resizing</div>}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <Button size="sm" icon="upload" onClick={() => input.current?.click()} disabled={busy}>
            {value ? "Replace" : label}
          </Button>
          {value && (
            <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => onChange("")}>
              Remove
            </button>
          )}
          <span className="text-xs text-muted">JPG, PNG, or WebP</span>
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} tabIndex={-1} />
      {error && <p className="text-sm text-accent mt-2 mb-0">{error}</p>}
    </div>
  );
}
