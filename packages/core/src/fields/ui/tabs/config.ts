import { ADMIN_FIELDS } from "../../constants";
import type { VexResourceSlug } from "../../../types/generated";
import type { TabInput, TabsField, TabsFieldInput } from "./types";

/**
 * Groups fields under admin-form tabs. Legal in any `fields` record (a
 * collection/global's own, a `group()`'s, a group-shaped `array()`'s items,
 * a `blocks()` block's own). An unnamed tab
 * hoists its fields to the parent level once `getDataFields` flattens this
 * field; a named tab (`name` set) nests its fields as one group-shaped data
 * field under `name` instead.
 *
 * @typeParam TCollectionSlug - Types `admin.condition` (on the `tabs()`
 *   field itself and on each tab) against that resource's real document —
 *   same convention as `collapsible()`/`row()`/`text()`.
 * @throws {Error} If `tabs` has no entries, or any tab has no fields.
 * @param props - Tabs field configuration: `tabs` and admin options.
 * @returns The resolved `TabsField` definition with defaults applied.
 *
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     info: tabs<typeof TABLE_SLUG_PAGES>({
 *       tabs: [
 *         { label: "Content", fields: { title: text({ required: true }), body: richtext() } },
 *         { label: "SEO", name: "seo", fields: { metaTitle: text() } },
 *       ],
 *     }),
 *   },
 * })
 * ```
 */
export function tabs<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  const TTabs extends readonly TabInput<TCollectionSlug>[] = readonly TabInput<TCollectionSlug>[],
>(props: TabsFieldInput<TCollectionSlug, TFieldMeta, TTabs>): TabsField<TCollectionSlug, TFieldMeta, TTabs> {
  if (props.tabs.length === 0) throw new Error("tabs(): requires at least one tab");
  for (const tab of props.tabs) {
    if (Object.keys(tab.fields).length === 0) {
      throw new Error(`tabs(): tab "${tab.label}" requires at least one field`);
    }
  }
  return {
    type: ADMIN_FIELDS.tabs.type,
    label: props.label ?? "",
    description: props.description,
    meta: { ...props.meta } as TFieldMeta,
    tabs: props.tabs,
    admin: {
      hidden: props.admin?.hidden ?? false,
      readOnly: props.admin?.readOnly ?? false,
      position: props.admin?.position ?? "main",
      width: props.admin?.width ?? "100%",
      condition: props.admin?.condition,
    },
  };
}
