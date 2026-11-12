"use client";

import { type ComponentProps, type ComponentPropsWithRef } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";

/**
 * Theme toggle dropdown component.
 *
 * Framework-agnostic (no `next-themes` dependency). Toggles between light,
 * dark, and system themes. Renders a button with sun/moon icons and a dropdown
 * menu with three options.
 *
 * Must be rendered inside a `<ThemeProvider>`.
 *
 * Renders the theme-NEUTRAL `"SunMoon"` icon, DISABLED, until `ThemeProvider`'s `mounted`
 * flips — identical on the server AND the client's FIRST render (hydration never has
 * anything to mismatch against: `mounted` itself starts `false` both sides and only ever
 * flips inside an effect) — THEN switches to the theme's own resolved icon AND enables.
 * Developer-confirmed: this is intentional, not just a hydration-safety measure — every
 * mount (the `<Suspense>` fallback's own instance, AND the real, settled one) looks
 * IDENTICAL at the instant it first appears (`"SunMoon"` + disabled, same size/position),
 * so there is never a size/position change at the enable/icon switch, only the ICON and
 * `disabled` state updating in place. `props.disabled` ORs into this — passing it `true`
 * keeps the toggle disabled even once mounted (not currently used anywhere; kept for a
 * caller that needs to force it, e.g. a future read-only surface).
 *
 * @param props - Standard div props (forwarded to wrapper), plus an optional `size` for the
 *   underlying toggle `Button` (default `"icon"`, matching `Button`'s own default), and an
 *   optional `disabled` to force-disable regardless of `mounted`.
 * @param props.disabled - ORed with `!mounted` — `true` forces the toggle disabled even
 *   once mounted (the `<Suspense>` fallback's own instance, `AdminSidebarSkeleton`,
 *   `@vexcms/react/admin`, no longer strictly needs to pass this: `ThemeToggle` is already
 *   disabled pre-mount on its own, and that fallback is itself replaced wholesale, never
 *   mounted long enough to flip — but passing it there stays explicit about intent).
 * @returns A dropdown button that controls the theme.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <ThemeToggle className="ml-auto" />
 * </ThemeProvider>
 * ```
 */
export function ThemeToggle({
  size = "icon",
  disabled = false,
  ...divProps
}: ComponentPropsWithRef<"div"> & { size?: ComponentProps<typeof Button>["size"]; disabled?: boolean }) {
  const { theme, mounted, setTheme } = useTheme();
  const effectiveDisabled = disabled || !mounted;
  let themeIcon: "SunMoon" | "Sun" | "Moon" = "SunMoon";
  if (mounted) {
    if (theme === "dark") {
      themeIcon = "Moon";
    } else if (theme === "light") {
      themeIcon = "Sun";
    }
  }

  return (
    <div {...divProps}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size={size}
              variant="outline"
              icon={themeIcon}
              iconPosition="center"
              disabled={effectiveDisabled}
              aria-disabled={effectiveDisabled}
            />
          }
          disabled={effectiveDisabled}
          suppressHydrationWarning
        >
          <span className="sr-only">Toggle theme</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={theme === "light"}
            disabled={theme === "light"}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("light");
              }
            }}
          >
            Light
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={theme === "dark"}
            disabled={theme === "dark"}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("dark");
              }
            }}
          >
            Dark
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={theme === "system"}
            disabled={theme === "system"}
            onCheckedChange={(val) => {
              if (val) {
                setTheme("system");
              }
            }}
          >
            System
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
