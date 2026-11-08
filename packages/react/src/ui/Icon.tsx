"use client";

import type { IconNode, LucideProps } from "lucide-react";
import type { DynamicIcon as DynamicIconType } from "lucide-react/dynamic";
import type { ComponentPropsWithRef, ReactNode } from "react";
import type { IconName } from "@vexcms/core";

import { Icon as LucideIcon } from "lucide-react";
// `lucide-react@0.577.0` ships no package.json "exports" map (fixed only in
// 1.x), so the extensionless "lucide-react/dynamic" specifier above resolves
// fine for TYPES under TypeScript's "bundler" resolution, but NOT at runtime
// in real consumer bundlers (confirmed: Node's own ESM loader throws
// `ERR_MODULE_NOT_FOUND` for it) — only the exact on-disk file,
// "lucide-react/dynamic.mjs", resolves everywhere. TypeScript in turn can't
// find a declaration for THAT extension-qualified path, so the runtime
// import below keeps the real types via the aliases imported above instead.
// @ts-expect-error -- see comment above; no declaration for the extension-qualified runtime path
import { DynamicIcon as UntypedDynamicIcon } from "lucide-react/dynamic.mjs";
import { createContext, useContext, useMemo } from "react";

import { iconKeyOf, isIconName, type IconKey } from "./iconKey";

export type { IconName };
export { isIconName };

const DynamicIcon: typeof DynamicIconType = UntypedDynamicIcon;

/** Icon nodes keyed by lucide key ("layout-grid"), as built by `resolveIconNodes`. */
export type IconNodeMap = Partial<Record<IconKey, IconNode>>;

const IconNodeContext = createContext<IconNodeMap>({});

/**
 * Supplies server-resolved icon nodes so `Icon` renders them synchronously,
 * real SVG in the server HTML with no request, instead of loading each icon
 * on demand. Nested providers merge; the inner map wins on a shared key.
 *
 * @param props.nodes - Map produced by `resolveIconNodes` from `@vexcms/react/server`.
 * @param props.children - Subtree whose `Icon`s should use the map.
 */
export function IconNodeProvider(props: { nodes: IconNodeMap; children: ReactNode }) {
  const parent = useContext(IconNodeContext);
  const value = useMemo(() => ({ ...parent, ...props.nodes }), [parent, props.nodes]);
  return <IconNodeContext.Provider value={value}>{props.children}</IconNodeContext.Provider>;
}

/**
 * Props for the `Icon` component.
 *
 * Extends the full Lucide props surface (`strokeWidth`, `absoluteStrokeWidth`,
 * all SVG attributes, and ref forwarding) with a required `name` discriminant.
 */
export type IconProps = ComponentPropsWithRef<"svg"> &
  LucideProps & {
    /**
     * The Lucide icon to render.
     * Must be a valid {@link IconName} (e.g. `"FileText"`, `"Users"`).
     */
    name: IconName;
  };

const warnedNames = new Set<string>();

/**
 * Renders a Lucide icon by name.
 *
 * If `IconNodeProvider` carries a node for `name` (server-resolved via
 * `resolveIconNodes`), it renders synchronously from that node — real SVG in
 * the server HTML, no request. Otherwise it falls back to loading the icon
 * on demand: resolves `name` to `lucide-react/dynamic`'s kebab-case key and
 * renders `DynamicIcon`, so only the icons a page actually uses are fetched —
 * not `lucide-react`'s full icon set. Until the icon's own dynamic import
 * resolves, a placeholder `<svg>` reserves the exact box the icon will
 * render into (same `width`/`height`/`className`), so nothing shifts when it
 * arrives.
 *
 * Returns `null` if `name` does not match a known icon, so a bad string from
 * untyped data cannot throw at runtime. After `vex generate`, {@link IconName}
 * is exact, so that only happens via an unchecked cast, `any`, or a project
 * that has not generated types; outside production the miss is reported once
 * per name with `console.warn`.
 *
 * @param props - Icon props. See {@link IconProps} for all fields.
 * @returns The rendered SVG icon, or `null` if the name is unrecognised.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Icon name="FileText" />
 *
 * // With sizing and color
 * <Icon name="Users" className="size-4 text-muted-foreground" />
 *
 * // With custom stroke width
 * <Icon name="Settings" strokeWidth={1.5} className="size-5" />
 *
 * // Dynamically from a collection's admin.icon string
 * <Icon name={collection.admin.icon} className="size-4" />
 * ```
 *
 * @see {@link IconName} for the full set of valid icon names
 * @see {@link isIconName} to guard untyped data before rendering
 */
export function Icon({ name, className, ...rest }: IconProps) {
  const nodes = useContext(IconNodeContext);
  const key = iconKeyOf({ name });
  if (!key) {
    if (process.env.NODE_ENV !== "production" && !warnedNames.has(name)) {
      warnedNames.add(name);
      console.warn(
        `<Icon name="${name}" /> is not a Lucide icon and rendered nothing. ` +
          `Use the canonical PascalCase name from https://lucide.dev/icons — ` +
          `alias exports ("AlertCircle") and "*Icon" duplicates ("UsersIcon") are not valid.`,
      );
    }
    return null;
  }
  const iconNode = nodes[key];
  if (iconNode) {
    return <LucideIcon className={className} iconNode={iconNode} {...rest} />;
  }
  // Read, don't destructure, `width`/`height`/`size` off `rest`: destructuring
  // them out and passing them back explicitly (`width={width}`) sets that key
  // to `undefined` on the element whenever the caller omitted it, which
  // overrides `DynamicIcon`'s own `size`-derived default — the placeholder
  // and the loaded icon would then disagree on their box. Leaving them inside
  // `rest` and spreading it keeps an omitted prop genuinely absent.
  const boxWidth = rest.width ?? rest.size ?? 24;
  const boxHeight = rest.height ?? rest.size ?? 24;
  function Placeholder() {
    return <svg aria-hidden="true" className={className} height={boxHeight} width={boxWidth} />;
  }
  return <DynamicIcon className={className} fallback={Placeholder} name={key} {...rest} />;
}
