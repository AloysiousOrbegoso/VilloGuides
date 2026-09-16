import { useCallback, useEffect, useState } from "react";

/*
  Light and dark mode for the studio and client dashboard.
  The token values live in src/index.css. This file only picks which set is active
  by setting data-theme on <html>, and remembers the choice. index.html applies the
  saved value before first paint so there is no flash.
*/

const KEY = "vg-color-mode";
const query = () => window.matchMedia("(prefers-color-scheme: dark)");

function readSaved() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function currentMode() {
  const saved = readSaved();
  if (saved === "light" || saved === "dark") return saved;
  return query().matches ? "dark" : "light";
}

export function applyMode(mode) {
  document.documentElement.setAttribute("data-theme", mode);
}

/** Areas that do not offer dark mode (brand page, intake, guides) force light. */
export function useForcedLight() {
  useEffect(() => {
    applyMode("light");
  }, []);
}

export function useColorMode() {
  const [mode, setMode] = useState(currentMode);

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  // Follow the system setting until the user makes a choice.
  useEffect(() => {
    if (readSaved()) return undefined;
    const mq = query();
    const onChange = (e) => setMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode: the choice lasts for this visit only */
      }
      return next;
    });
  }, []);

  return { mode, toggle };
}
