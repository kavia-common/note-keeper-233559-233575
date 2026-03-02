"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  getStoredTheme,
  initTheme,
  onSystemThemeChange,
  storeTheme,
  type Theme,
} from "./theme";

/**
 * PUBLIC_INTERFACE
 * Theme toggle button that switches between light and dark themes.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [hasExplicitChoice, setHasExplicitChoice] = useState<boolean>(false);

  useEffect(() => {
    const stored = getStoredTheme();
    setHasExplicitChoice(Boolean(stored));
    setTheme(initTheme());

    // If the user hasn't explicitly chosen, follow system changes.
    if (!stored) {
      return onSystemThemeChange((t) => {
        applyTheme(t);
        setTheme(t);
      });
    }
    return;
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setHasExplicitChoice(true);
    setTheme(next);
    applyTheme(next);
    storeTheme(next);
  }

  return (
    <button
      type="button"
      className="retro-btn retro-btn-quiet"
      onClick={toggle}
      aria-label="Toggle theme"
      aria-pressed={theme === "dark"}
      title={hasExplicitChoice ? `Theme: ${theme}` : `Theme (system): ${theme}`}
    >
      {theme === "dark" ? "DARK" : "LIGHT"}
    </button>
  );
}
