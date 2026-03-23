import type { TabsFieldDef } from "../../types/fields";

/**
 * Creates a tabs field definition.
 * Groups fields into tabbed UI sections in the admin panel.
 *
 * Tabs with `slug` create nested objects in the document.
 * Tabs without `slug` flatten their fields onto the parent.
 *
 * @param props - Tabs field configuration
 * @param props.tabs - Array of tab definitions with label, optional slug, and fields
 * @returns TabsFieldDef
 */
export function tabs(props: Omit<TabsFieldDef, "type">): TabsFieldDef {
  return {
    ...props,
    type: "tabs" as const,
  };
}
