"use client";

import { type ComponentPropsWithRef } from "react";
import { useTheme } from "./ThemeProvider";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/**
 * Theme toggle dropdown component.
 *
 * Framework-agnostic (no `next-themes` dependency). Toggles between light,
 * dark, and system themes. Renders a button with sun/moon icons and a dropdown
 * menu with three options.
 *
 * Must be rendered inside a `<ThemeProvider>`.
 *
 * @param props - Standard div props (forwarded to wrapper).
 * @returns A dropdown button that controls the theme.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <ThemeToggle className="ml-auto" />
 * </ThemeProvider>
 * ```
 */
export function ThemeToggle({ ...divProps }: ComponentPropsWithRef<"div">) {
  const { theme, setTheme } = useTheme();
  let themeIcon: "SunMoon" | "Sun" | "Moon" = "SunMoon";
  if (theme === "dark") {
    themeIcon = "Moon";
  } else if (theme === "light") {
    themeIcon = "Sun";
  }

  return (
    <div {...divProps}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="icon" variant="outline" icon={themeIcon} iconPosition="center" />}
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
