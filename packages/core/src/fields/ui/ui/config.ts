import { ADMIN_FIELDS } from "../../constants";
import type { VexResourceSlug } from "../../../types/generated";
import type { ComponentHKT } from "../../baseTypes";
import type { UIField, UIFieldInput } from "./types";

/**
 * Renders a fully custom admin-form field with no data representation.
 * Dropped by `getDataFields` — never reaches schema, validation, type-gen,
 * RBAC, indexing, or default-value resolution. Legal in any `fields` record
 * (a collection/global's own, a `group()`'s, a group-shaped `array()`'s
 * items, a `blocks()` block's own).
 *
 * @typeParam TCollectionSlug - Types `Field`/`Cell`'s `data` and
 *   `admin.condition`'s `data` against that resource's real document.
 *
 * @param props - UI field configuration: `admin.components` and layout options.
 * @returns The resolved `UIField` definition with defaults applied.
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     wordCount: ui<typeof TABLE_SLUG_PAGES>({
 *       admin: { components: { Field: WordCountField } },
 *     }),
 *   },
 * })
 * ```
 */
export function ui<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TComponent extends ComponentHKT = ComponentHKT,
>(props: UIFieldInput<TCollectionSlug, TFieldMeta, TComponent>): UIField<TCollectionSlug, TFieldMeta, TComponent> {
  return {
    type: ADMIN_FIELDS.ui.type,
    label: props.label ?? "",
    description: props.description,
    meta: { ...props.meta } as TFieldMeta,
    admin: {
      hidden: props.admin.hidden ?? false,
      readOnly: props.admin.readOnly ?? false,
      position: props.admin.position ?? "main",
      width: props.admin.width ?? "100%",
      components: props.admin.components,
      condition: props.admin.condition,
    },
  };
}
