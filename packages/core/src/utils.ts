import type { icons } from "lucide-react";

/**
 * Valid Lucide icon name string (e.g. `"FileText"`, `"Users"`, `"Settings"`).
 *
 * Derived from the `icons` map exported by `lucide-react` — the same map the
 * `Icon` component in `@vexcms/react` indexes at render time. This is
 * deliberately narrower than the set of names `lucide-react` exports as
 * components: alias exports (`AlertCircle` → `CircleAlert`), the `*Icon`
 * suffixed duplicates (`UsersIcon`), and non-icon exports (`createLucideIcon`,
 * `icons`, `Icon`) are absent from the map and would render nothing.
 *
 * Use the canonical PascalCase name as listed on the Lucide site.
 * @see https://lucide.dev/icons
 *
 * @example
 * ```ts
 * const icon: LucideIconName = "CircleAlert";  // ✅ canonical, renders
 * const alias: LucideIconName = "AlertCircle"; // ❌ alias export, not in `icons`
 * const bad: LucideIconName = "NotAnIcon";     // ❌ not an icon at all
 * ```
 *
 * @see the `Icon` component from `@vexcms/react` that renders a `LucideIconName`
 */
export type LucideIconName = keyof typeof icons;

const MINOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  // "at",
  "but",
  "by",
  "for",
  "if",
  "in",
  "nor",
  "of",
  "on",
  "or",
  "so",
  "the",
  "to",
  "up",
  "yet",
]);

/**
 * Converts a string to title case, handling camelCase, snake_case, and kebab-case inputs.
 * Minor words (e.g. "a", "and", "the") are lowercased unless they appear at the start.
 *
 * @param input - The string to convert.
 * @returns The title-cased string.
 */
export function toTitleCase(input: string): string {
  const words = input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/);

  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && MINOR_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Returns the plural form of an English word using common suffix rules.
 *
 * Handles the most common cases: words ending in s/x/z/ch/sh, consonant+y,
 * and f/fe. Falls back to appending "s" for everything else.
 *
 * @param word - The singular word to pluralise (e.g. `"Post"`, `"Category"`)
 * @returns The pluralised word (e.g. `"Posts"`, `"Categories"`)
 *
 * @example
 * ```ts
 * plural("Post")      // "Posts"
 * plural("Category")  // "Categories"
 * plural("Leaf")      // "Leaves"
 * ```
 */
export function plural(word: string): string {
  if (/[sxz]$/i.test(word) || /[cs]h$/i.test(word)) {
    return word + "es";
  }
  if (/[^aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + "ies";
  }
  if (/fe?$/i.test(word)) {
    return word.replace(/fe?$/i, "ves");
  }
  return word + "s";
}

/**
 * Ensures a string starts with a `/`, prepending one if it is absent.
 *
 * @param text - The path string to normalise.
 * @returns The path with a guaranteed leading slash (e.g. `"admin"` → `"/admin"`).
 */
export function addLeadingSlash(text: string): string {
  if (text.charAt(0) !== "/") {
    return `/${text}`;
  }
  return text;
}
