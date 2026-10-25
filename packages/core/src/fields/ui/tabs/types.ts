import type { VexResourceSlug } from "../../../types/generated";
import type { BaseUIField, BaseUIFieldInput } from "../../baseTypes";
import type { AdminField } from "../../types";
import type { FieldConditionProps } from "../types";

/** Per-tab `admin` input — only `condition` is meaningful for one tab. */
export interface TabAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> {
  /** AND-ed into every field this tab contributes once flattened. */
  condition?(props: FieldConditionProps<TCollectionSlug>): boolean;
}

/**
 * One tab in a `tabs()` field. An unnamed tab (no `name`) hoists its fields
 * up into the parent `fields` record once `getDataFields` flattens it — no
 * accordion, no nesting, same as a bare `row()`/`collapsible()`. A named tab
 * stores its fields as a group-shaped object under `name` — group-like, not
 * an accordion.
 *
 * @typeParam TCollectionSlug - Types this tab's own `admin.condition` — same
 *   convention as `tabs()`/`text()`. Does not propagate into `fields`; each
 *   nested field factory is parametrized independently, same as `group()`.
 */
export interface TabInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFields extends Record<string, AdminField> = Record<string, AdminField>,
> {
  /** Tab label shown in the admin form's tab strip. */
  label: string;
  /**
   * When set, this tab's fields nest as one group-shaped data field keyed
   * by `name` instead of hoisting to the parent level.
   */
  name?: string;
  /** Helper text shown below the tab's label. */
  description?: string;
  /**
   * The FIRST tab across the whole `tabs()` field with `defaultOpen: true`
   * is the initially selected tab (no error if several are set); otherwise
   * the first tab. The `?<fieldKey>=` URL param, when present, still wins.
   */
  defaultOpen?: boolean;
  /** This tab's fields. */
  fields: TFields;
  admin?: TabAdminInput<TCollectionSlug>;
}

/** User-facing input to `tabs()`. */
export interface TabsFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TTabs extends readonly TabInput<TCollectionSlug>[] = readonly TabInput<TCollectionSlug>[],
> extends BaseUIFieldInput<TCollectionSlug, TFieldMeta> {
  tabs: TTabs;
}

/** Resolved `tabs()` field. */
export interface TabsField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TTabs extends readonly TabInput<TCollectionSlug>[] = readonly TabInput<TCollectionSlug>[],
> extends BaseUIField<TCollectionSlug, TFieldMeta> {
  readonly type: "tabs";
  tabs: TTabs;
}
