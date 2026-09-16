import { mapsSearchUrl } from "../../../lib/links";
export function MapLinkBlock({ label, query, note }) {
  return (
    <div className="block block-map">
      <a className="action-row" href={mapsSearchUrl(query)} target="_blank" rel="noopener noreferrer">
        <i className="ti ti-map-2 action-row__icon" aria-hidden="true" />
        <span className="action-row__body">
          <span className="action-row__label">{label}</span>
          <span className="action-row__detail">Opens in Google Maps</span>
        </span>
      </a>
      {note && <p className="block-map__note">{note}</p>}
    </div>
  );
}
