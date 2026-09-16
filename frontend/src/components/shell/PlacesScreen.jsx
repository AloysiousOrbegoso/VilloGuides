export function PlacesList({ places }) {
  return (
    <ul className="places">
      {places.map((p) => (
        <li key={p.name} className="place">
          <div className="place__head">
            <h3 className="place__name">{p.name}</h3>
            <span className="place__category">{p.category}</span>
          </div>
          <p className="place__note">{p.note}</p>
          <a className="place__link" href={p.mapsUrl} target="_blank" rel="noopener noreferrer">
            <i className="ti ti-map-2" aria-hidden="true" />
            Open in Google Maps
          </a>
        </li>
      ))}
    </ul>
  );
}
/** Mobile "Places" tab: the nearby list without the rest of the Explore section. */
export function PlacesScreen({ places, intro }) {
  return (
    <article className="section-screen">
      <header className="section-screen__head">
        <h1 className="section-screen__title">Places nearby</h1>
      </header>
      {intro && <p className="section-screen__intro">{intro}</p>}
      <PlacesList places={places} />
    </article>
  );
}
