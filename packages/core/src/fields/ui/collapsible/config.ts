import { ADMIN_FIELDS } from "../../constants";
import type { VexResourceSlug } from "../../../types/generated";
import type { AdminField } from "../../types";
import type { CollapsibleField, CollapsibleFieldInput } from "./types";

/**
 * Wraps fields in a collapsible admin-form fieldset. Legal in any `fields`
 * record (a collection/global's own, a `group()`'s, a group-shaped
 * `array()`'s items, a `blocks()` block's own). Its fields hoist to
 * the parent level once `getDataFields` flattens this field.
 *
 * @typeParam TCollectionSlug - Types `admin.condition`'s `data` against that
 *   resource's real document — same convention as `tabs()`/`text()`.
 * @throws {Error} If `fields` is empty.
 * @param props - Collapsible field configuration: `label`, `fields`, and admin options.
 * @returns The resolved `CollapsibleField` definition with defaults applied.
 *
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     seoFields: collapsible({
 *       label: "SEO",
 *       admin: { defaultCollapsed: true },
 *       fields: { metaTitle: text(), metaDescription: textarea() },
 *     }),
 *   },
 * })
 * ```
 */
export function collapsible<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  const TFields extends Record<string, AdminField> = Record<string, AdminField>,
>(props: CollapsibleFieldInput<TCollectionSlug, TFieldMeta, TFields>): CollapsibleField<TCollectionSlug, TFieldMeta, TFields> {
  if (Object.keys(props.fields).length === 0) {
    throw new Error("collapsible(): requires at least one field");
  }
  return {
    type: ADMIN_FIELDS.collapsible.type,
    label: props.label,
    description: props.description,
    meta: { ...props.meta } as TFieldMeta,
    fields: props.fields,
    admin: {
      hidden: props.admin?.hidden ?? false,
      readOnly: props.admin?.readOnly ?? false,
      position: props.admin?.position ?? "main",
      width: props.admin?.width ?? "100%",
      defaultCollapsed: props.admin?.defaultCollapsed ?? false,
      condition: props.admin?.condition,
    },
  };
}
