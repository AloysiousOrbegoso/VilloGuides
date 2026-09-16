import { useDeferredValue, useState } from "react";
import { themes } from "../../../../lib/guideThemes";
import { Dialog } from "../../../ui/Dialog";
import { Segmented } from "../../../ui/Field";
import { GuideRoot } from "../../../shell/GuideRoot";

/**
 * Live preview in the property's theme. Phone renders inline; Desktop opens a
 * large preview so it is readable. The swatches set this guide's theme.
 */
export function PreviewPanel({ draft, focusPageId, onThemeChange }) {
  const [size, setSize] = useState("phone");
  const content = useDeferredValue(draft);
  const preset = draft.theme.preset;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <Segmented
          label="Preview size"
          value={size}
          onChange={setSize}
          options={[
            { value: "phone", label: "Phone", icon: "device-mobile" },
            { value: "desktop", label: "Desktop", icon: "device-desktop" },
          ]}
        />
        {preset !== "custom" && (
          <div className="flex gap-2" role="group" aria-label="Guide theme">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-label={t.label}
                title={t.label}
                aria-pressed={preset === t.id}
                onClick={() => onThemeChange(t.id)}
                className={`w-5 h-5 rounded-full border-2 border-canvas ${preset === t.id ? "ring-2 ring-navy" : "ring-1 ring-line"}`}
                style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }}
              />
            ))}
          </div>
        )}
      </div>

      <StudioPhone>
        <GuideRoot content={content} layout="mobile" focusPageId={focusPageId} embedded switcher={false} />
      </StudioPhone>

      <Dialog open={size === "desktop"} onClose={() => setSize("phone")} title="Desktop preview" width={1240}>
        <div className="h-[72vh] rounded-xl overflow-hidden border border-line">
          <GuideRoot content={content} layout="desktop" focusPageId={focusPageId} switcher={false} />
        </div>
      </Dialog>
    </div>
  );
}

/** Plain device outline for studio and intake previews. Keeps fixed-position guide parts inside. */
export function StudioPhone({ children, width = 320, height = 640 }) {
  return (
    <div className="mx-auto rounded-[42px] bg-[#111] p-2.5 ring-1 ring-[#2e2e2e]" style={{ width, height }}>
      <div className="h-full rounded-[33px] overflow-hidden relative [transform:translateZ(0)] pt-0">{children}</div>
    </div>
  );
}
