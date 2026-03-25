import type { TabDef, TabsFieldDef } from "../../types/fields";

/**
 * Creates a tabs field definition.
 * Groups fields into tabbed UI sections in the admin panel.
 *
 * Tabs with `slug` create nested objects in the document.
 * Tabs without `slug` flatten their fields onto the parent.
 *
 * @param props - Tabs field configuration
 * @param props.tabs - Array of tab definitions with label, optional slug, and fields
 * @returns TabsFieldDef with preserved tab slug and field type information
 */
export function tabs<const TTabs extends TabDef[]>(
  props: Omit<TabsFieldDef<TTabs>, "type">,
): TabsFieldDef<TTabs> {
  return {
    ...props,
    type: "tabs" as const,
  };
}
