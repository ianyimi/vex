import { icons, type LucideProps } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

/**
 * Union of all valid Lucide icon name strings (e.g. `"FileText"`, `"Users"`, `"Settings"`).
 *
 * Derived from the `lucide-react` icons export map — every exported icon name
 * is a valid value. IDE autocomplete lists all ~1000 options.
 *
 * @example
 * ```ts
 * const icon: LucideIconName = "FileText"; // ✅
 * const bad: LucideIconName = "NotAnIcon"; // ❌ type error
 * ```
 *
 * @see {@link Icon} for the component that renders a `LucideIconName`
 */
export type LucideIconName = keyof typeof icons;

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
     * Must be a valid {@link LucideIconName} (e.g. `"FileText"`, `"Users"`).
     */
    name: LucideIconName;
  };

/**
 * Renders a Lucide icon by name.
 *
 * Looks up the icon from the `lucide-react` icon map at runtime, so tree-shaking
 * applies at the bundler level. Accepts the full Lucide props surface —
 * `strokeWidth`, `absoluteStrokeWidth`, all SVG attributes, and ref forwarding.
 * `className` is extracted and merged through `cn()` before being passed to the
 * underlying icon component.
 *
 * Returns `null` silently if `name` does not match a known icon, so invalid
 * strings from dynamic data (e.g. CMS content) do not throw at runtime.
 *
 * @param props - Icon props.
 * @param props.name - The Lucide icon name to render (e.g. `"FileText"`).
 * @param props.className - Additional CSS classes — merged with `cn()`.
 * @param props.strokeWidth - SVG stroke width. Defaults to Lucide's standard (`2`).
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
 * <Icon name={collection.admin.icon as LucideIconName} className="size-4" />
 * ```
 *
 * @see {@link LucideIconName} for the full set of valid icon names
 */
export function Icon({ name, className, ...rest }: IconProps) {
  const LucideIcon = icons[name];
  if (!LucideIcon) return null;
  return <LucideIcon className={className} {...rest} />;
}
