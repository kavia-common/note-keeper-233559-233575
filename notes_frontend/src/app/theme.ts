export type Theme = "light" | "dark";

const STORAGE_KEY = "note-keeper-theme";

/**
 * PUBLIC_INTERFACE
 * Detect the user's system preference.
 */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * PUBLIC_INTERFACE
 * Get the persisted theme from localStorage, if any.
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "light" || raw === "dark" ? raw : null;
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Persist theme to localStorage.
 */
export function storeTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors (private mode, disabled storage, etc.)
  }
}

/**
 * PUBLIC_INTERFACE
 * Apply theme to the document root using a data attribute.
 */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

/**
 * PUBLIC_INTERFACE
 * Initialize theme on the client: stored theme first, otherwise system theme.
 * Returns the active theme.
 */
export function initTheme(): Theme {
  const stored = getStoredTheme();
  const theme = stored ?? getSystemTheme();
  applyTheme(theme);
  return theme;
}

/**
 * PUBLIC_INTERFACE
 * Subscribe to system theme changes (only useful if user has not explicitly chosen a theme).
 * Returns an unsubscribe function.
 */
export function onSystemThemeChange(handler: (theme: Theme) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return () => {};

  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const listener = () => handler(media.matches ? "dark" : "light");

  // Safari < 14 uses addListener/removeListener
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }

  media.addListener(listener);
  return () => media.removeListener(listener);
}
