import type { VexResourceSlug } from "../../../types/generated";
import type { BaseUIField, BaseUIFieldInput, UIFieldAdminConfig, UIFieldAdminInput } from "../../baseTypes";
import type { AdminField } from "../../types";

/** Per-type `admin` input for `collapsible()` — adds `defaultCollapsed`. */
export interface CollapsibleFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends UIFieldAdminInput<TCollectionSlug> {
  /** Whether the fieldset starts collapsed. Default: `false`. */
  defaultCollapsed?: boolean;
}

/**
 * Configuration input for a `collapsible()` field — a UI-only fieldset
 * (no stored value) that groups its `fields` behind a collapsible toggle
 * in the admin form. Its fields hoist to the parent level once flattened.
 */
export interface CollapsibleFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TFields extends Record<string, AdminField> = Record<string, AdminField>,
> extends BaseUIFieldInput<TCollectionSlug, TFieldMeta> {
  /** Fieldset label shown above the collapsible toggle. */
  label: string;
  fields: TFields;
  admin?: CollapsibleFieldAdminInput<TCollectionSlug>;
}

/** Resolved per-type `admin` for `collapsible()`. */
export interface CollapsibleFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends UIFieldAdminConfig<TCollectionSlug> {
  defaultCollapsed: boolean;
}

/**
 * Resolved `collapsible()` field definition after defaults are applied.
 */
export interface CollapsibleField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TFields extends Record<string, AdminField> = Record<string, AdminField>,
> extends BaseUIField<TCollectionSlug, TFieldMeta> {
  readonly type: "collapsible";
  label: string;
  fields: TFields;
  admin: CollapsibleFieldAdminConfig<TCollectionSlug>;
}
