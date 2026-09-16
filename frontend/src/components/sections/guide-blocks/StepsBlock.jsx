/** The only place numbered markers appear: genuinely sequential content. */
export function StepsBlock({ heading, steps }) {
  return (
    <div className="block block-steps">
      {heading && <h3 className="block-heading">{heading}</h3>}
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={i} className="steps__item">
            <span className="steps__num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="steps__text">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
