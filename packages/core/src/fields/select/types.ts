import { ADMIN_FIELDS, type FieldSchemaValidator } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldValidateProps,
  SchemaOverrideInput,
} from "../baseTypes";
import type { VexResourceSlug } from "../../types/generated";

/** Display modes a `select()` field's admin input can render as. */
export const SELECT_DISPLAYS = {
  dropdown: "dropdown",
  radio: "radio",
} as const;

/** `"dropdown" | "radio"` — see {@link SELECT_DISPLAYS}. */
export type SelectDisplay =
  (typeof SELECT_DISPLAYS)[keyof typeof SELECT_DISPLAYS];

/** Per-type `admin` input for `select()` — adds `searchable`/`display`. */
export interface SelectFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /**
   * Shows a search box inside the options popover. Only meaningful when
   * `display` is `"dropdown"` (the default) — the `"radio"` display has no
   * popover to search.
   *
   * Default: `false`
   */
  searchable?: boolean;
  /**
   * How the field renders its options.
   *
   * - `"dropdown"` — a searchable-optional popover trigger (`MultiSelect`).
   * - `"radio"` — an inline list with no popover: radio buttons when
   *   `hasMany` is `false`, checkboxes when `hasMany` is `true`.
   *
   * Default: `"dropdown"`
   */
  display?: SelectDisplay;
}

/** Resolved per-type `admin` for `select()`. */
export interface SelectFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfig<TCollectionSlug> {
  /** Whether the options popover shows a search box (`"dropdown"` display only). */
  searchable: boolean;
  /** How the field renders its options — `"dropdown"` or `"radio"`. */
  display: SelectDisplay;
}

/**
 * Configuration input for a `select()` field.
 *
 * Select fields store an array of chosen option values — status labels, categories,
 * tags, or any enumerable set. All properties are optional; unset properties fall
 * back to the defaults listed below.
 *
 * **Defaults applied by `select()`:**
 * ```ts
 * {
 *   type:         "select",
 *   label:        "",    // inferred from the field key by defineCollection
 *   required:     false, // field is optional by default
 *   defaultValue: [],    // empty selection
 *   options:      [],    // no options configured
 *   hasMany:      false, // single-select by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width: "100%",  // spans the full form width, not half
 *     cellAlignment: "left",  // aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Single-select status
 * tier: select({
 *   required: true,
 *   options: [
 *     { label: "Free", value: "free" },
 *     { label: "Pro", value: "pro" },
 *   ],
 * })
 *
 * // Multi-select tags with badge colours
 * tags: select({
 *   hasMany: true,
 *   options: [
 *     { label: "News", value: "news", badgeColor: "#3b82f6" },
 *     { label: "Tutorial", value: "tutorial", badgeColor: "#10b981" },
 *   ],
 * })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`)
 */
export interface SelectFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  THasMany extends boolean = boolean,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Admin UI configuration for this field. */
  admin?: SelectFieldAdminInput<TCollectionSlug>;
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values. An array unless `schema.validator`
   * is set, in which case it is the single selected value (empty string
   * for "no selection").
   */
  defaultValue?: string | string[];
  options?: {
    label: string;
    value: string;
    badgeColor?: string;
  }[];
  hasMany?: THasMany;
  /**
   * Overrides the Convex storage shape for a single-value select
   * (`hasMany: false`). `"literal"` stores `v.union(v.literal(...))` — a
   * bare `v.literal(...)` when there is exactly one option — and types the
   * field's value as its option union. `"string"` stores `v.string()` and
   * types the value `string`; the admin form and this field's own
   * `inputSchema` still enforce `options`, even though the Convex column
   * itself accepts any string. `never` when `hasMany: true` — overrides
   * only apply to single-value storage.
   */
  schema?: SchemaOverrideInput<THasMany, Extract<FieldSchemaValidator, "literal" | "string">>;
  optionInterfaceName?: string;
  /** Server-only async validation. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}

/**
 * Resolved configuration for a `select()` field, after all defaults are applied.
 *
 * This is the type that framework adapters and field components receive —
 * `fieldDef` in `FieldComponentProps<SelectField>` and `CellComponentProps<SelectField>`
 * is this type.
 *
 * @see {@link SelectFieldInput} for the user-facing input type
 * @see {@link select} for the config function that produces this type
 */
export interface SelectField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  /** Resolved admin UI configuration with all defaults applied. */
  admin: SelectFieldAdminConfig<TCollectionSlug>;
  readonly type: typeof ADMIN_FIELDS.select.type;
  /** Pre-filled value shown in the admin form when creating a new field. */
  defaultValue: string | string[];
  options: {
    label: string;
    value: string;
    badgeColor?: string;
  }[];
  hasMany: boolean;
  /** Set only when the field's storage is overridden (see {@link SelectFieldInput.schema}). */
  schema?: { validator: Extract<FieldSchemaValidator, "literal" | "string"> };
  optionInterfaceName?: string;
  /** Server-only async validation. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}
