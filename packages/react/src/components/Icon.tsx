import { icons, type LucideProps } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import type { LucideIconName } from "@vexcms/core";

export type { LucideIconName };

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

const warnedNames = new Set<string>();

/**
 * Renders a Lucide icon by name.
 *
 * Looks up the icon from the `lucide-react` icon map at runtime, so tree-shaking
 * applies at the bundler level. Accepts the full Lucide props surface —
 * `strokeWidth`, `absoluteStrokeWidth`, all SVG attributes, and ref forwarding.
 * `className` is extracted and merged through `cn()` before being passed to the
 * underlying icon component.
 *
 * Returns `null` if `name` does not match a known icon, so a bad string from
 * untyped data cannot throw at runtime. Because {@link LucideIconName} is exact,
 * that can only happen via an unchecked cast or `any`, so outside production the
 * miss is reported once per name with `console.warn`.
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
 * @see {@link LucideIconName} for the full set of valid icon names
 */
export function Icon({ name, className, ...rest }: IconProps) {
  const LucideIcon = icons[name];
  if (!LucideIcon) {
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
  return <LucideIcon className={className} {...rest} />;
}
