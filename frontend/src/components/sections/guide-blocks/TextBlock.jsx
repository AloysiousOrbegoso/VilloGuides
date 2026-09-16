export function TextBlock({ heading, body }) {
  return (
    <div className="block block-text">
      {heading && <h3 className="block-heading">{heading}</h3>}
      {body.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
