import type { IconName } from "@vexcms/core";
import type { dynamicIconImports as DynamicIconImportsType } from "lucide-react/dynamic";
// `lucide-react@0.577.0` ships no package.json "exports" map, so only the
// extension-qualified file resolves at runtime in every bundler and in Node.
// @ts-expect-error -- no declaration exists for the extension-qualified runtime path; types come from the import above
import { dynamicIconImports as untypedDynamicIconImports } from "lucide-react/dynamic.mjs";

export const dynamicIconImports: typeof DynamicIconImportsType = untypedDynamicIconImports;

export type IconKey = keyof typeof DynamicIconImportsType;

// Lucide's keys are kebab-case ("grid-2x2"), which no single casing rule
// derives from a PascalCase IconName ("Grid2x2"). Matching on the
// hyphen-free form sidesteps the ambiguity.
const compactToKey = /* @__PURE__ */ new Map<string, IconKey>(
  (Object.keys(dynamicIconImports) as IconKey[]).map((key) => [key.replaceAll("-", "") as string, key]),
);

/**
 * Resolves a PascalCase Lucide icon name to its `lucide-react/dynamic` key.
 *
 * @param props.name - Icon name as stored in config or CMS data.
 * @returns The kebab-case key, or `undefined` for an unknown name.
 */
export function iconKeyOf(props: { name: string }): IconKey | undefined {
  return compactToKey.get(props.name.toLowerCase());
}

/**
 * Whether `name` is a real Lucide icon name, usable as a type guard against
 * untyped data before rendering it.
 */
export function isIconName(name: string): name is IconName {
  return compactToKey.has(name.toLowerCase());
}
