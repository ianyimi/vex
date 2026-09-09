"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";

/**
 * Theme mode: light, dark, or system (respects `prefers-color-scheme`).
 */
export type Theme = "light" | "dark" | "system";

/**
 * Context value for the theme provider.
 */
interface ThemeContextValue {
  /** Current theme setting (may be "system"). */
  theme: Theme;
  /** Resolved theme (never "system" — either "light" or "dark"). */
  resolvedTheme: "light" | "dark";
  /** Set the theme and persist to localStorage. */
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "vex-theme";

/**
 * Reads the persisted theme, tolerating an absent or throwing Web Storage.
 *
 * `localStorage` is not universally reachable from a browser-like context:
 * Safari's private mode and any "block all cookies" setting make the property
 * access itself throw a `SecurityError`, and a jsdom/worker test environment
 * can expose the global without a backing store at all. An unguarded read
 * throws during the mount effect, which unmounts the whole admin shell — a
 * persisted colour preference is not worth that, so a failed read degrades to
 * "no stored preference" and leaves `defaultTheme` in place.
 *
 * Reached through `window`, never the bare global: Node exposes its own
 * experimental `globalThis.localStorage` that logs
 * "localStorage is not available because --localstorage-file was not provided"
 * on first touch, so a bare reference turns every server render into a warning.
 *
 * @param storageKey - The `localStorage` key holding the persisted theme.
 * @returns The stored theme, or `null` when unset, invalid, or unreadable.
 */
function readStoredTheme(storageKey: string): Theme | null {
  try {
    const stored =
      typeof window === "undefined" ? null : window.localStorage?.getItem(storageKey);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Persists the theme, tolerating an absent or throwing Web Storage.
 *
 * Same failure modes as {@link readStoredTheme}, plus `QuotaExceededError`.
 * A failed write only costs persistence across reloads — the in-memory theme
 * still applies — so it is swallowed rather than propagated into the click
 * handler that triggered it.
 *
 * @param storageKey - The `localStorage` key to write.
 * @param theme - The theme to persist.
 */
function writeStoredTheme(storageKey: string, theme: Theme): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage?.setItem(storageKey, theme);
  } catch {
    // Persistence is best-effort; the applied theme is already in React state.
  }
}

/**
 * Framework-agnostic theme provider.
 *
 * Manages the `.dark` class on `<html>` and persists the user's preference to
 * `localStorage`. Respects the system `prefers-color-scheme` media query when
 * theme is set to `"system"`.
 *
 * **Does NOT depend on `next-themes`** — works in any React framework.
 *
 * @param props - Component props.
 * @param props.children - Child elements.
 * @param props.defaultTheme - Initial theme (default: `"system"`).
 * @param props.storageKey - localStorage key (default: `"vex-theme"`).
 * @returns The provider wrapping children with theme context.
 *
 * @example
 * ```tsx
 * // Wrap your app root
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  ...divProps
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
} & ComponentPropsWithRef<"div">) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Load the persisted theme on mount, if it is readable at all.
  useEffect(() => {
    const stored = readStoredTheme(storageKey);
    if (stored) {
      setThemeState(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    const html = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const isDark = theme === "dark" || (theme === "system" && mediaQuery.matches);

      if (isDark) {
        html.classList.add("dark");
        setResolvedTheme("dark");
      } else {
        html.classList.remove("dark");
        setResolvedTheme("light");
      }
    }

    applyTheme();

    // Listen for system preference changes when theme is "system"
    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
    return;
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    writeStoredTheme(storageKey, newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <div {...divProps}>{children}</div>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the current theme and theme setter.
 *
 * Must be used inside a `<ThemeProvider>`.
 *
 * @returns The theme context value.
 * @throws {Error} When used outside `<ThemeProvider>`.
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useTheme();
 * setTheme("dark");
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
