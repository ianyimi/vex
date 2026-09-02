/**
 * Theme field key → CSS custom property, for the 32 shadcn design tokens.
 *
 * This map is the theming system's contract. `themeColorFields` derives the
 * collection's colour fields from it, and `buildThemeCss` emits one declaration
 * per entry — so a token cannot exist in the stored document without also being
 * applied, or vice versa. The names are exactly the custom properties shadcn
 * components consume and exactly the set tweakcn exports, so a preset maps
 * across with no gaps.
 */
export const THEME_COLOR_TOKENS = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
} as const;

/** One of the 32 shadcn colour-token keys, camelCased: `"cardForeground"`, `"chart1"`. */
export type ThemeColorTokenKey = keyof typeof THEME_COLOR_TOKENS;

/**
 * Scheme-independent fields, read from the theme document root.
 *
 * `--font-sans` is commonly also set by the host's font loader (e.g.
 * `next/font`) as a class on `<html>`; both are specificity (0,1,0), so the
 * later declaration wins. A stack naming a font the app has not loaded degrades
 * to the next entry rather than breaking.
 */
export const THEME_SHARED_TOKENS = {
  radius: "--radius",
  fontFamily: "--font-sans",
} as const;

/** Where a theme's CSS applies. */
export type ThemeScope = "admin" | "site";

/**
 * Stark × Ember — this repo's house palette, lifted verbatim from the `:root`
 * block of `globals.css`. A freshly created theme starts from these values, so
 * "new theme" means "fork the current look", not "32 empty pickers".
 */
export const EMBER_LIGHT: Record<ThemeColorTokenKey, string> = {
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
};

/** Stark × Ember dark-mode values, from `globals.css`'s `.dark` block. */
export const EMBER_DARK: Record<ThemeColorTokenKey, string> = {
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
};

/**
 * Builds one CSS declaration block.
 *
 * @param props - Input props.
 * @param props.values - Field key → stored value.
 * @param props.tokens - Field key → custom property name.
 * @returns Newline-joined `--token: value;` declarations, or `""` when none apply.
 */
function buildDeclarations(props: {
  values: Record<string, unknown> | undefined;
  tokens: Record<string, string>;
}): string {
  if (!props.values) return "";
  const declarations: string[] = [];
  for (const [fieldKey, cssVar] of Object.entries(props.tokens)) {
    const value = props.values[fieldKey];
    if (typeof value === "string" && value) declarations.push(`  ${cssVar}: ${value};`);
  }
  return declarations.join("\n");
}

/**
 * Builds the stylesheet text applying a theme document at a scope.
 *
 * Values are written through verbatim — a `color()` field storing
 * `oklch(60.5% 0.175 42)` needs no conversion, because custom properties accept
 * any colour notation. `.dark` is assumed to sit on `<html>`, which *is*
 * `:root`, so the dark selector is a compound, never a descendant.
 *
 * The two scopes form a specificity ladder that no injection order can upset:
 * site light `:root` (0,1,0) < site dark `.dark` (0,1,0, later) < admin light
 * `:root:root` (0,2,0) < admin dark `.dark:root:root` (0,3,0). Emit the site
 * theme once for the whole document and the admin theme from the admin route
 * only, and the admin block wins exactly where it renders.
 *
 * @param props - Input props.
 * @param props.theme - The theme document — `light`/`dark` colour groups plus
 * root-level `radius` and `fontFamily`, i.e. the shape `themeColorFields`
 * stores.
 * @param props.scope - `"site"` emits `:root`; `"admin"` emits `:root:root`.
 * @returns The stylesheet text, or `""` when the theme sets nothing.
 *
 * @example
 * ```ts
 * const css = buildThemeCss({ theme, scope: "site" });
 * // ":root {\n  --background: oklch(96.1% 0 0);\n  …\n}\n\n.dark {\n  …\n}"
 * ```
 */
export function buildThemeCss(props: {
  theme: Record<string, unknown>;
  scope: ThemeScope;
}): string {
  const selector = props.scope === "admin" ? ":root:root" : ":root";
  const darkSelector = props.scope === "admin" ? ".dark:root:root" : ".dark";

  const light = [
    buildDeclarations({
      values: props.theme.light as Record<string, unknown> | undefined,
      tokens: THEME_COLOR_TOKENS,
    }),
    buildDeclarations({ values: props.theme, tokens: THEME_SHARED_TOKENS }),
  ]
    .filter(Boolean)
    .join("\n");
  const dark = buildDeclarations({
    values: props.theme.dark as Record<string, unknown> | undefined,
    tokens: THEME_COLOR_TOKENS,
  });

  return [light && `${selector} {\n${light}\n}`, dark && `${darkSelector} {\n${dark}\n}`]
    .filter(Boolean)
    .join("\n\n");
}
