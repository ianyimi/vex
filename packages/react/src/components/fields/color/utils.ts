/**
 * A CSS custom property declared by the host application's stylesheet that
 * holds a colour value.
 */
export interface ThemeColorToken {
  /** The custom-property name, including the leading dashes: `"--primary"`. */
  name: string;
  /** The value stored when this token is selected: `"var(--primary)"`. */
  reference: string;
  /** The value declared for the light colour scheme. */
  lightValue: string;
  /** The value declared under `.dark`, or `null` when the token has no dark variant. */
  darkValue: string | null;
}

/**
 * Selectors that declare light-scheme tokens. Anchored: a compound selector
 * such as `:root.dark` must not be read as a light declaration.
 */
const LIGHT_SELECTOR = /^(?::root|html)$/;

/**
 * Selectors that declare dark-scheme tokens. Anchored so Tailwind's `dark:`
 * utilities — whose `selectorText` is `.dark\:bg-red-500` — are excluded.
 */
const DARK_SELECTOR = /^(?:html|:root)?\.dark$/;

/**
 * CSS colour notations a token may use. Matching by notation rather than
 * `CSS.supports` because jsdom does not implement `CSS.supports`, so a
 * supports-based check would be untestable. Named colours are excluded
 * deliberately: `--radius: 0.25rem` must not be classified as a colour, and no
 * shadcn token is a named colour.
 */
const COLOR_VALUE =
  /^(?:#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\()/;

/** A value that is entirely one custom-property reference: `var(--primary)`. */
const VAR_REFERENCE = /^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/;

/**
 * Tailwind's `@theme inline` block re-declares every token under a `--color-`
 * namespace as `var(--<token>)`. Those are aliases, not tokens, and listing
 * them would double the picker.
 */
const TAILWIND_ALIAS_PREFIX = "--color-";

/** Maximum `var()` hops followed when resolving a declared value. */
const MAX_VAR_DEPTH = 4;

/**
 * Reads a stylesheet's rules, returning an empty list when access throws.
 *
 * A cross-origin stylesheet throws `SecurityError` on `cssRules`. That is
 * expected — a CDN font stylesheet declares no theme tokens — so it is skipped
 * rather than surfaced.
 *
 * @param props - Input props.
 * @param props.sheet - The stylesheet to read.
 * @returns The sheet's rules, or `[]` if they are inaccessible.
 */
function safeCssRules(props: { sheet: CSSStyleSheet }): CSSRule[] {
  try {
    return Array.from(props.sheet.cssRules);
  } catch {
    return [];
  }
}

/**
 * Recursively collects declared custom properties into the light and dark maps.
 *
 * Grouping rules (`@layer`, `@media`, `@supports`) carry their own `cssRules`
 * and are descended into — Tailwind v4 emits `:root` inside `@layer base`, so
 * skipping them would find nothing.
 *
 * @param props - Input props.
 * @param props.rules - Rules to walk.
 * @param props.light - Accumulator for light-scheme declarations, mutated in place.
 * @param props.dark - Accumulator for dark-scheme declarations, mutated in place.
 */
function collectDeclarations(props: {
  rules: CSSRule[];
  light: Map<string, string>;
  dark: Map<string, string>;
}): void {
  for (const rule of props.rules) {
    const grouping = rule as CSSRule & { cssRules?: CSSRuleList };
    if (grouping.cssRules) {
      collectDeclarations({
        rules: Array.from(grouping.cssRules),
        light: props.light,
        dark: props.dark,
      });
      continue;
    }

    const styleRule = rule as CSSStyleRule;
    if (!styleRule.selectorText || !styleRule.style) continue;

    const selectors = styleRule.selectorText.split(",").map((s) => s.trim());
    const isLight = selectors.some((s) => LIGHT_SELECTOR.test(s));
    const isDark = selectors.some((s) => DARK_SELECTOR.test(s));
    if (!isLight && !isDark) continue;

    // Indexed access, not `.item(i)`: jsdom's `CSSStyleDeclaration` does not
    // implement `item`, so `.item(i)` throws under vitest (measured).
    for (let i = 0; i < styleRule.style.length; i += 1) {
      const name = styleRule.style[i];
      if (!name.startsWith("--")) continue;
      const value = styleRule.style.getPropertyValue(name).trim();
      if (!value) continue;
      // Later declarations win, matching the cascade for equal specificity.
      if (isLight) props.light.set(name, value);
      if (isDark) props.dark.set(name, value);
    }
  }
}

/**
 * Resolves a declared value through up to {@link MAX_VAR_DEPTH} `var()` hops.
 *
 * @param props - Input props.
 * @param props.value - The declared value.
 * @param props.declared - The scheme's declaration map.
 * @param props.depth - Hops already followed. Callers pass nothing.
 * @returns The resolved value, or the last unresolvable value seen.
 */
function resolveValue(props: {
  value: string;
  declared: Map<string, string>;
  depth?: number;
}): string {
  const depth = props.depth ?? 0;
  const match = VAR_REFERENCE.exec(props.value);
  if (!match || depth >= MAX_VAR_DEPTH) return props.value;
  const target = props.declared.get(match[1]);
  if (target === undefined) return props.value;
  return resolveValue({ value: target, declared: props.declared, depth: depth + 1 });
}

/**
 * Reads every colour-valued CSS custom property declared by the document's
 * stylesheets, with both its light and dark values.
 *
 * Reads **declared** values out of the CSSOM rather than calling
 * `getComputedStyle` on the live tree: the admin panel may itself be in dark
 * mode, in which case computed values would report the dark palette twice.
 *
 * The admin panel renders inside the host application, so these are the site's
 * own design tokens.
 *
 * @returns Colour tokens sorted by name. Empty when there is no `document`
 * (SSR) or when no stylesheet declares a colour-valued custom property.
 *
 * @example
 * ```ts
 * readThemeColorTokens()
 * // [{ name: "--primary", reference: "var(--primary)",
 * //    lightValue: "oklch(60.5% 0.175 42)", darkValue: "oklch(72% 0.175 50)" }, …]
 * ```
 */
export function readThemeColorTokens(): ThemeColorToken[] {
  if (typeof document === "undefined") return [];

  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  for (const sheet of Array.from(document.styleSheets)) {
    collectDeclarations({ rules: safeCssRules({ sheet }), light, dark });
  }

  const tokens: ThemeColorToken[] = [];
  for (const [name, declared] of light) {
    if (name.startsWith(TAILWIND_ALIAS_PREFIX)) continue;
    const lightValue = resolveValue({ value: declared, declared: light });
    if (!COLOR_VALUE.test(lightValue)) continue;

    const declaredDark = dark.get(name);
    const darkValue =
      declaredDark === undefined
        ? null
        : resolveValue({ value: declaredDark, declared: dark });

    tokens.push({ name, reference: `var(${name})`, lightValue, darkValue });
  }

  return tokens.sort((a, b) => a.name.localeCompare(b.name));
}