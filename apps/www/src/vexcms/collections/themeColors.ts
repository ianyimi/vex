import {
  color,
  THEME_COLOR_TOKENS,
  type ColorField,
  type ThemeColorTokenKey,
} from "@vexcms/core";

/**
 * Stark × Ember — this site's house palette, lifted verbatim from
 * `globals.css`. A freshly created theme starts from these values, so "new
 * theme" means "fork the current look", not "32 empty pickers".
 */
const EMBER: Record<"dark" | "light", Record<ThemeColorTokenKey, string>> = {
  light: {
    background: "oklch(96.1% 0 0)",
    foreground: "oklch(13.7% 0 0)",
    card: "oklch(100% 0 0)",
    cardForeground: "oklch(13.7% 0 0)",
    popover: "oklch(100% 0 0)",
    popoverForeground: "oklch(13.7% 0 0)",
    primary: "oklch(60.5% 0.175 42)",
    primaryForeground: "oklch(100% 0 0)",
    secondary: "oklch(98% 0 0)",
    secondaryForeground: "oklch(13.7% 0 0)",
    muted: "oklch(98% 0 0)",
    mutedForeground: "oklch(50.5% 0 0)",
    accent: "oklch(96% 0.025 42)",
    accentForeground: "oklch(52% 0.180 40)",
    destructive: "oklch(57.7% 0.198 27)",
    destructiveForeground: "oklch(98% 0 0)",
    border: "oklch(85% 0 0)",
    input: "oklch(54.6% 0 0)",
    ring: "oklch(60.5% 0.175 42)",
    chart1: "oklch(60.5% 0.175 42)",
    chart2: "oklch(45% 0 0)",
    chart3: "oklch(72% 0.100 60)",
    chart4: "oklch(60% 0.040 30)",
    chart5: "oklch(78% 0 0)",
    sidebar: "oklch(98% 0 0)",
    sidebarForeground: "oklch(13.7% 0 0)",
    sidebarPrimary: "oklch(60.5% 0.175 42)",
    sidebarPrimaryForeground: "oklch(100% 0 0)",
    sidebarAccent: "oklch(96.1% 0 0)",
    sidebarAccentForeground: "oklch(13.7% 0 0)",
    sidebarBorder: "oklch(85% 0 0)",
    sidebarRing: "oklch(60.5% 0.175 42)",
  },
  dark: {
    background: "oklch(13.7% 0 0)",
    foreground: "oklch(95% 0 0)",
    card: "oklch(17.4% 0 0)",
    cardForeground: "oklch(95% 0 0)",
    popover: "oklch(17.4% 0 0)",
    popoverForeground: "oklch(95% 0 0)",
    primary: "oklch(72% 0.175 50)",
    primaryForeground: "oklch(13.7% 0 0)",
    secondary: "oklch(20% 0 0)",
    secondaryForeground: "oklch(95% 0 0)",
    muted: "oklch(20% 0 0)",
    mutedForeground: "oklch(70% 0 0)",
    accent: "oklch(72% 0.175 50 / 0.12)",
    accentForeground: "oklch(72% 0.175 50)",
    destructive: "oklch(63% 0.210 27)",
    destructiveForeground: "oklch(95% 0 0)",
    border: "oklch(25% 0 0)",
    input: "oklch(40% 0 0)",
    ring: "oklch(72% 0.175 50)",
    chart1: "oklch(72% 0.175 50)",
    chart2: "oklch(78% 0 0)",
    chart3: "oklch(78% 0.120 65)",
    chart4: "oklch(60% 0.060 30)",
    chart5: "oklch(45% 0 0)",
    sidebar: "oklch(7% 0 0)",
    sidebarForeground: "oklch(95% 0 0)",
    sidebarPrimary: "oklch(72% 0.175 50)",
    sidebarPrimaryForeground: "oklch(13.7% 0 0)",
    sidebarAccent: "oklch(20% 0 0)",
    sidebarAccentForeground: "oklch(95% 0 0)",
    sidebarBorder: "oklch(25% 0 0)",
    sidebarRing: "oklch(72% 0.175 50)",
  },
};

/**
 * Derives a human label from a token key: `"cardForeground"` → `"Card
 * Foreground"`, `"chart1"` → `"Chart 1"`.
 *
 * @param props - Input props.
 * @param props.key - The camelCase token key.
 * @returns The admin form label.
 */
function tokenLabel(props: { key: string }): string {
  const spaced = props.key.replace(/([A-Z])/g, " $1").replace(/(\d+)/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The shadcn design-token set as `color()` fields for one colour scheme.
 *
 * One field per `THEME_COLOR_TOKENS` entry, keyed camelCase, pinned to
 * `format: "oklch"` — the notation `globals.css` declares its tokens in, so
 * stored values interpolate into custom properties with no conversion.
 * Defaults come from the Stark × Ember palette for the given mode.
 *
 * @param mode - Which scheme's defaults to apply.
 * @returns One resolved `color()` field per shadcn token.
 */
export function themeColors(mode: "dark" | "light"): Record<ThemeColorTokenKey, ColorField> {
  const fields = {} as Record<ThemeColorTokenKey, ColorField>;
  for (const key of Object.keys(THEME_COLOR_TOKENS) as ThemeColorTokenKey[]) {
    fields[key] = color({
      format: "oklch",
      label: tokenLabel({ key }),
      defaultValue: EMBER[mode][key],
    });
  }
  return fields;
}
