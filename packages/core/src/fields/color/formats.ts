/**
 * Supported storage notations for a `color()` field, keyed by format name.
 *
 * Each entry carries the anchored pattern that recognises values written in
 * that notation. The patterns accept exactly what `serializeColor` in
 * `@vexcms/react` emits, plus the equivalent hand-typed spellings.
 *
 * @internal
 */
export const COLOR_FORMATS = {
  hex: {
    format: "hex",
    /** `#E8622A`, `#E8622A80`. Shorthand is rejected — the picker never emits it. */
    pattern: /^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/,
  },
  rgb: {
    format: "rgb",
    /** `rgb(232, 98, 42)`, `rgba(232, 98, 42, 0.5)`. */
    pattern:
      /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/,
  },
  hsl: {
    format: "hsl",
    /** `hsl(17.7, 81%, 54%)`, `hsla(17.7, 81%, 54%, 0.5)`. */
    pattern:
      /^hsla?\(\s*-?\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?%\s*,\s*\d+(?:\.\d+)?%\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/,
  },
  oklch: {
    format: "oklch",
    /** `oklch(65.7% 0.179 40.9)`, `oklch(65.7% 0.179 40.9 / 0.5)`. */
    pattern:
      /^oklch\(\s*\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s*(?:\/\s*(?:0|1|0?\.\d+)\s*)?\)$/,
  },
} as const;

/** Union of the notations a `color()` field can store: `"hex" | "rgb" | "hsl" | "oklch"`. */
export type ColorFormat = (typeof COLOR_FORMATS)[keyof typeof COLOR_FORMATS]["format"];

/** Every supported notation's pattern, in declaration order. */
export const COLOR_FORMAT_PATTERNS = Object.values(COLOR_FORMATS).map((f) => f.pattern);

/** A value that is entirely one CSS custom-property reference: `var(--primary)`. */
export const CSS_VAR_REFERENCE = /^var\(--[A-Za-z0-9_-]+\)$/;
