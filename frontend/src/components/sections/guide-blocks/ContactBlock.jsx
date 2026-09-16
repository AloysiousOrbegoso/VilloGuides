import { contactHref, contactIcon } from "../../../lib/links";
/** Real tel:/sms:/mailto: links. They dial on phones and are harmless on desktop. */
export function ContactBlock({ heading, methods, urgent }) {
  const visible = methods.filter((m) => m.value.trim() !== "");
  return (
    <div className={`block block-contact${urgent ? " block-contact--urgent" : ""}`}>
      {heading && <h3 className="block-heading">{heading}</h3>}
      <ul className="contact-list">
        {visible.map((m) => (
          <li key={`${m.kind}-${m.label}`}>
            <a
              className="action-row action-row--large"
              href={contactHref(m)}
              {...(m.kind === "messenger" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <i className={`ti ti-${contactIcon[m.kind]} action-row__icon`} aria-hidden="true" />
              <span className="action-row__body">
                <span className="action-row__label">{m.label}</span>
                {!m.label.includes(m.value) && <span className="action-row__value">{m.value}</span>}
                {m.detail && <span className="action-row__detail">{m.detail}</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
