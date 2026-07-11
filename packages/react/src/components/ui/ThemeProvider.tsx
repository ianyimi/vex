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

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
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
    localStorage.setItem(storageKey, newTheme);
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
