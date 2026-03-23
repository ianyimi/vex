import type { ColorFieldDef } from "../../types/fields";

/**
 * Creates a color field definition.
 *
 * @param props - Color field configuration
 * @param props.label - Display label in admin panel
 * @param props.format - Output format: "hex" (default), "hsl", or "oklch"
 * @param props.themeColors - When true, shows theme CSS variable picker tab
 * @returns ColorFieldDef
 */
export function color(props?: Omit<ColorFieldDef, "type">): ColorFieldDef {
  return {
    ...props,
    type: "color" as const,
  };
}
