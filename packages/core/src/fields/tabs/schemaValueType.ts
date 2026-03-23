import type { TabsFieldDef, VexField } from "../../types/fields";

/**
 * Convert a tabs field to its Convex schema value type string(s).
 *
 * This is special — tabs don't produce a single value type.
 * Instead, they produce multiple fields:
 * - Tabs with slug → `v.optional(v.object({ ... }))` under the slug key
 * - Tabs without slug → individual fields flattened onto the parent
 *
 * The caller (generate.ts) must handle tabs specially by iterating
 * the tab definitions and generating fields accordingly.
 *
 * This function returns a placeholder — the actual generation happens
 * in the schema generator which knows about the tabs structure.
 */
export function tabsToValueTypeString(props: {
  field: TabsFieldDef;
  collectionSlug: string;
  fieldName: string;
  resolveInnerField: (innerProps: {
    field: VexField;
    collectionSlug: string;
    fieldName: string;
  }) => string;
}): { slugged: { slug: string; fields: { name: string; valueType: string }[] }[]; flat: { name: string; valueType: string }[] } {
  const slugged: { slug: string; fields: { name: string; valueType: string }[] }[] = [];
  const flat: { name: string; valueType: string }[] = [];

  for (const tab of props.field.tabs) {
    const tabFields: { name: string; valueType: string }[] = [];

    for (const [fieldName, field] of Object.entries(tab.fields)) {
      if (field.type === "ui") continue;
      tabFields.push({
        name: fieldName,
        valueType: props.resolveInnerField({
          field,
          collectionSlug: props.collectionSlug,
          fieldName,
        }),
      });
    }

    if (tab.slug) {
      slugged.push({ slug: tab.slug, fields: tabFields });
    } else {
      flat.push(...tabFields);
    }
  }

  return { slugged, flat };
}
