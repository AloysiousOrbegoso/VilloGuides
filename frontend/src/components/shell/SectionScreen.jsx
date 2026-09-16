import { BlockRenderer } from "../sections/guide-blocks/BlockRenderer";
import { PlacesList } from "./PlacesScreen";
function initials(name) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}
export function HostCard({ host }) {
  return (
    <div className="host-card">
      {host.photo ? (
        <img className="host-card__photo" src={host.photo} alt={host.name} />
      ) : (
        <div className="host-card__photo host-card__photo--monogram" aria-hidden="true">
          {initials(host.name)}
        </div>
      )}
      <div>
        <p className="host-card__name">{host.name}</p>
        <p className="host-card__bio">{host.bio}</p>
      </div>
    </div>
  );
}
/** The one bold moment of a guide. On the mobile home screen the name is the page title. */
export function Cover({ property, as: Tag = "p" }) {
  return (
    <div className="cover">
      {property.coverImage ? (
        <img className="cover__img" src={property.coverImage} alt="" />
      ) : (
        <div className="cover__img cover__img--empty" aria-hidden="true" />
      )}
      <div className="cover__text">
        <Tag className="cover__name">{property.name}</Tag>
        <p className="cover__tagline">{property.tagline}</p>
      </div>
    </div>
  );
}
/**
 * Renders one page. Shell-agnostic: the same component fills the desktop
 * content pane, the phone frame, and the full-screen mobile view.
 */
export function SectionScreen({ page, content }) {
  const isWelcome = page.type === "welcome";
  return (
    <article className={`section-screen section-screen--${page.type}`} aria-labelledby={`title-${page.id}`}>
      {isWelcome && <Cover property={content.property} />}
      <header className="section-screen__head">
        {!isWelcome && <i className={`ti ti-${page.icon} section-screen__icon`} aria-hidden="true" />}
        <h1 id={`title-${page.id}`} className={`section-screen__title${isWelcome ? " visually-hidden" : ""}`}>
          {page.title}
        </h1>
      </header>
      {page.type === "host" && <HostCard host={content.host} />}
      <div className="section-screen__blocks">
        {page.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} />
        ))}
        {page.type === "places" && <PlacesList places={content.places} />}
      </div>
    </article>
  );
}
