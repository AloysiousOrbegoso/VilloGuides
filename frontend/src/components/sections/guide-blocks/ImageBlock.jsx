export function ImageBlock({ src, alt, caption }) {
  return (
    <figure className="block block-image">
      <img src={src} alt={alt} loading="lazy" decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
