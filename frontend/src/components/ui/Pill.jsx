import { initials } from "../../lib/format";

/*
  Status pills. Kept quiet on purpose (design principle 1): only states that need
  your action use the maroon tone. Everything else is neutral.
*/

const TONES = {
  accent: "bg-pill text-pill-ink",
  neutral: "bg-field text-muted border border-line",
  navy: "bg-navy-soft text-link",
  warn: "bg-warn-bg text-warn-ink",
};

export function Pill({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-px text-xs whitespace-nowrap ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

const GUIDE_STATUS = {
  draft: ["neutral", "Draft"],
  in_review: ["accent", "In review"],
  published: ["navy", "Published"],
  unpublished: ["neutral", "Unpublished"],
  suspended: ["warn", "Suspended"],
};
const INTAKE_STATUS = {
  sent: ["neutral", "Sent"],
  in_progress: ["navy", "In progress"],
  submitted: ["accent", "Submitted"],
  expired: ["neutral", "Expired"],
};
const REQUEST_STATUS = {
  open: ["accent", "Open"],
  done: ["neutral", "Done"],
  declined: ["neutral", "Declined"],
};

function statusPill(map, status) {
  const [tone, label] = map[status] ?? ["neutral", status];
  return <Pill tone={tone}>{label}</Pill>;
}

export const GuideStatus = ({ status }) => statusPill(GUIDE_STATUS, status);
export const IntakeStatus = ({ status }) => statusPill(INTAKE_STATUS, status);
export const RequestStatus = ({ status }) => statusPill(REQUEST_STATUS, status);

/** Client initials in a circle. Maroon tint marks company clients; individuals are neutral. */
export function Avatar({ name, tone = "accent", size = 28 }) {
  const look = tone === "accent" ? "bg-pill text-pill-ink" : "bg-field text-muted border border-line";
  return (
    <span
      className={`inline-grid place-items-center rounded-full font-semibold shrink-0 ${look}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
