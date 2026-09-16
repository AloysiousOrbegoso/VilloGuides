export function ListBlock({ heading, items }) {
  return (
    <div className="block block-list">
      {heading && <h3 className="block-heading">{heading}</h3>}
      <ul className="item-list">
        {items.map((item) => (
          <li key={item.title} className="item-list__row">
            {item.icon && <i className={`ti ti-${item.icon} item-list__icon`} aria-hidden="true" />}
            <div>
              <p className="item-list__title">{item.title}</p>
              {item.detail && <p className="item-list__detail">{item.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
