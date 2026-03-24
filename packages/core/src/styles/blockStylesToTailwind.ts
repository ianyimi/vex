import type { BlockStylesData, BlockStyleValues } from "./types";

/**
 * Property-to-Tailwind class mapping.
 * Each function takes a style value and returns the corresponding Tailwind class.
 */
const PROPERTY_CLASS_MAP: Record<
  keyof BlockStyleValues,
  (v: string) => string
> = {
  // Container — spacing
  margin: (v) => `m-${v}`,
  marginTop: (v) => `mt-${v}`,
  marginRight: (v) => `mr-${v}`,
  marginBottom: (v) => `mb-${v}`,
  marginLeft: (v) => `ml-${v}`,
  padding: (v) => `p-${v}`,
  paddingTop: (v) => `pt-${v}`,
  paddingRight: (v) => `pr-${v}`,
  paddingBottom: (v) => `pb-${v}`,
  paddingLeft: (v) => `pl-${v}`,

  // Container — sizing
  width: (v) => `w-${v}`,
  maxWidth: (v) => `max-w-${v}`,

  // Container — background
  backgroundColor: (v) => {
    if (
      v.startsWith("var(") ||
      v.startsWith("#") ||
      v.startsWith("rgb") ||
      v.startsWith("hsl") ||
      v.startsWith("oklch")
    ) {
      return `bg-[${v}]`;
    }
    return `bg-${v}`;
  },

  // Container — border
  borderWidth: (v) => (v === "DEFAULT" ? "border" : `border-${v}`),
  borderColor: (v) => {
    if (
      v.startsWith("var(") ||
      v.startsWith("#") ||
      v.startsWith("rgb") ||
      v.startsWith("hsl") ||
      v.startsWith("oklch")
    ) {
      return `border-[${v}]`;
    }
    return `border-${v}`;
  },
  borderStyle: (v) => `border-${v}`,
  borderRadius: (v) => (v === "DEFAULT" ? "rounded" : `rounded-${v}`),

  // Container — effects
  boxShadow: (v) => (v === "DEFAULT" ? "shadow" : `shadow-${v}`),
  opacity: (v) => `opacity-${v}`,

  // Container — display
  display: (v) => {
    if (v === "inline-flex") return "inline-flex";
    return v;
  },
  overflow: (v) => `overflow-${v}`,

  // Text
  textAlign: (v) => `text-${v}`,
  fontSize: (v) => `text-${v}`,
  fontWeight: (v) => `font-${v}`,
  color: (v) => {
    if (
      v.startsWith("var(") ||
      v.startsWith("#") ||
      v.startsWith("rgb") ||
      v.startsWith("hsl") ||
      v.startsWith("oklch")
    ) {
      return `text-[${v}]`;
    }
    return `text-${v}`;
  },
  lineHeight: (v) => `leading-${v}`,
  letterSpacing: (v) => `tracking-${v}`,

  // Layout
  gap: (v) => `gap-${v}`,
  flexDirection: (v) => {
    const map: Record<string, string> = {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    };
    return map[v] ?? `flex-${v}`;
  },
  alignItems: (v) => `items-${v}`,
  justifyContent: (v) => `justify-${v}`,
  flexWrap: (v) => `flex-${v}`,

  // Media
  objectFit: (v) => `object-${v}`,
  aspectRatio: (v) => `aspect-${v}`,
  objectPosition: (v) => `object-${v}`,
};

/**
 * Convert a single breakpoint's style values into an array of Tailwind classes.
 */
function stylesToClasses(props: { styles: BlockStyleValues }): string[] {
  const classes: string[] = [];

  for (const [key, value] of Object.entries(props.styles)) {
    if (value === undefined || value === null || value === "") continue;

    const mapper = PROPERTY_CLASS_MAP[key as keyof BlockStyleValues];
    if (!mapper) continue;

    classes.push(mapper(String(value)));
  }

  return classes;
}

/**
 * Convert a blockStyles JSON string into a Tailwind class string.
 *
 * Handles responsive breakpoint prefixes. The "base" breakpoint has no prefix,
 * all other breakpoints use their key as prefix (e.g., "sm:", "md:", "lg:").
 *
 * @param props.blockStylesJson - The raw JSON string from the block instance's blockStyles field
 * @returns Tailwind class string ready to use in className, or empty string if input is empty/invalid
 *
 * @example
 * ```ts
 * blockStylesToTailwind({
 *   blockStylesJson: '{"base":{"margin":"4","padding":"2"},"sm":{"margin":"6"}}'
 * })
 * // → "m-4 p-2 sm:m-6"
 * ```
 */
export function blockStylesToTailwind(props: {
  blockStylesJson: string | undefined;
}): string {
  if (!props.blockStylesJson) return "";

  let data: BlockStylesData;
  try {
    data = JSON.parse(props.blockStylesJson);
  } catch {
    return "";
  }

  const result: string[] = [];

  // Process "base" first (no breakpoint prefix)
  if (data.base) {
    result.push(...stylesToClasses({ styles: data.base }));
  }

  // Process remaining breakpoints sorted alphabetically for deterministic output
  const breakpointKeys = Object.keys(data)
    .filter((k) => k !== "base")
    .sort();

  for (const bp of breakpointKeys) {
    const classes = stylesToClasses({ styles: data[bp] });
    for (const cls of classes) {
      result.push(`${bp}:${cls}`);
    }
  }

  return result.join(" ");
}
