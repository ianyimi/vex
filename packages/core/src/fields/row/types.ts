import type { VexResourceSlug } from "../../types/generated";
import type { BaseUIField, BaseUIFieldInput } from "../baseTypes";
import type { AdminField } from "../types";

/**
 * Configuration input for a `row()` field — a UI-only field (no stored
 * value) that lays out its `fields` side by side in the admin form.
 */
export interface RowFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TFields extends Record<string, AdminField> = Record<string, AdminField>,
> extends BaseUIFieldInput<TCollectionSlug, TFieldMeta> {
  fields: TFields;
}

/**
 * Resolved `row()` field definition after defaults are applied.
 */
export interface RowField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TFields extends Record<string, AdminField> = Record<string, AdminField>,
> extends BaseUIField<TCollectionSlug, TFieldMeta> {
  readonly type: "row";
  fields: TFields;
}
