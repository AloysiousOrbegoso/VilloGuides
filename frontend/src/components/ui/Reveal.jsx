import { useEffect, useRef, useState } from "react";

/**
 * Fades a section up into place the first time it scrolls into view.
 * IntersectionObserver rather than a library: a one-shot reveal doesn't need
 * one, and this codebase carries no animation dependency. Reveals immediately
 * if IntersectionObserver isn't available, so content is never stuck hidden.
 */
export function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
