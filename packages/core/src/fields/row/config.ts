import { ADMIN_FIELDS } from "../constants";
import type { VexResourceSlug } from "../../types/generated";
import type { AdminField } from "../types";
import type { RowField, RowFieldInput } from "./types";

/**
 * Lays fields out on one admin-form row instead of each taking a full row.
 * Legal in any `fields` record (a collection/global's own, a `group()`'s, a
 * group-shaped `array()`'s items, a `blocks()` block's own). Its
 * fields hoist to the parent level once `getDataFields` flattens this
 * field. Row widths: if every child's `admin.width` is a `%` value and they
 * sum to 100 (±0.5), those widths are used (`resolveRowWidths`); otherwise
 * every child gets an equal share. Rows stack below the `sm` breakpoint.
 *
 * @typeParam TCollectionSlug - Types `admin.condition`'s `data` against that
 *   resource's real document — same convention as `tabs()`/`text()`.
 * @throws {Error} If `fields` is empty.
 * @param props - Row field configuration: `fields` and admin options.
 * @returns The resolved `RowField` definition with defaults applied.
 *
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     name: row({
 *       fields: {
 *         firstName: text({ admin: { width: "50%" } }),
 *         lastName: text({ admin: { width: "50%" } }),
 *       },
 *     }),
 *   },
 * })
 * ```
 */
export function row<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  const TFields extends Record<string, AdminField> = Record<string, AdminField>,
>(props: RowFieldInput<TCollectionSlug, TFieldMeta, TFields>): RowField<TCollectionSlug, TFieldMeta, TFields> {
  if (Object.keys(props.fields).length === 0) {
    throw new Error("row(): requires at least one field");
  }
  return {
    type: ADMIN_FIELDS.row.type,
    label: props.label ?? "",
    description: props.description,
    meta: { ...props.meta } as TFieldMeta,
    fields: props.fields,
    admin: {
      hidden: props.admin?.hidden ?? false,
      readOnly: props.admin?.readOnly ?? false,
      position: props.admin?.position ?? "main",
      width: props.admin?.width ?? "100%",
      condition: props.admin?.condition,
    },
  };
}
