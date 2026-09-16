import { isSafeExternalUrl } from "../../../lib/links";

export function LinkBlock({ label, href, description }) {
  if (!isSafeExternalUrl(href)) return null; // architecture 12: user content is never trusted, even content that already passed publish-time validation
  return (
    <a className="block action-row" href={href} target="_blank" rel="noopener noreferrer">
      <i className="ti ti-external-link action-row__icon" aria-hidden="true" />
      <span className="action-row__body">
        <span className="action-row__label">{label}</span>
        {description && <span className="action-row__detail">{description}</span>}
      </span>
    </a>
  );
}
