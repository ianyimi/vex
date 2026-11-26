import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig, FieldAdminConfigInput, FieldValidateProps } from "../baseTypes";
import type { AdminDataField } from "../types";
import type { CollectionSlug, VexResourceSlug } from "../../types/generated";

/**
 * Targets the collection a `keyValue()` field's record keys reference, when
 * keys are Convex ids rather than plain strings.
 */
export interface KeyValueFieldKeysInput<TKeysSlug extends CollectionSlug = CollectionSlug> {
  /** The slug of the collection this field's keys reference. */
  collection: { slug: TKeysSlug };
}

/**
 * 'admin' field configuration input for a `keyValue()` field.
 */
export interface KeyValueFieldAdminConfigInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /**
   * Whether the accordion holding this field's rows starts COLLAPSED in the
   * admin form.
   *
   * Defaults to `false`, so a keyValue field is expanded on load. Set
   * `true` for secondary or rarely-edited records to reduce visual noise.
   * Mirrors `group()`'s option of the same name.
   *
   * Collapsing is NAVIGATION, not editing: a caller with read access but no
   * write access can still expand the field to see its entries, and the
   * row controls stay individually gated by `readOnly`.
   */
  defaultCollapsed?: boolean;
}

/**
 * Resolved 'admin' field configuration for a `keyValue()` field.
 */
export interface KeyValueFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfig<TCollectionSlug> {
  /**
   * Whether the accordion holding this field's rows starts COLLAPSED in the
   * admin form.
   *
   * Always present after `keyValue()` applies its defaults; `false` unless
   * the field opted in. See {@link KeyValueFieldAdminConfigInput.defaultCollapsed}.
   */
  defaultCollapsed: boolean;
}

/**
 * Configuration input for a `keyValue()` field.
 *
 * KeyValue fields store a Convex `v.record(keys, value)` — a dynamically-keyed
 * map from `keys` (`v.string()` by default, or `v.id(collection)` when `keys`
 * is set) to one shared `value` data field, which may itself be any data
 * field including containers (`group()`, `array()`, nested `keyValue()`).
 * A fixed, literal key set is a `group()`, not this field.
 *
 * **Defaults applied by `keyValue()`:**
 * ```ts
 * {
 *   type:        "keyValue",
 *   label:       "",
 *   required:    false,
 *   defaultValue: {},
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width: "100%",
 *     cellAlignment: "left",
 *     defaultCollapsed: false,
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * scores: keyValue({ label: "Scores", value: number({ required: true }) })
 *
 * userScores: keyValue({
 *   label: "User Scores",
 *   keys: { collection: { slug: "user" } },
 *   value: number({ required: true }),
 * })
 * ```
 *
 * @see {@link KeyValueField} for the resolved output type
 * @see {@link keyValue} for the config function that produces this type
 */
export interface KeyValueFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  TKeysSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  admin?: KeyValueFieldAdminConfigInput<TCollectionSlug>;
  /** Record key target. Omit for `v.string()` keys (the default). */
  keys?: KeyValueFieldKeysInput<TKeysSlug>;
  /**
   * The ONE data field every record entry's value is validated against.
   * Record values can't be `v.optional` in Convex — `keyValue()` forces this
   * field's own `required` to `true`; its `nullable` still applies.
   */
  value: AdminDataField;
  /** Pre-filled value shown when creating a new document. Defaults to `{}`. */
  defaultValue?: Record<string, unknown>;
  /** Server-only async validation with `value` typed as `Record<string, unknown>`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, Record<string, unknown>>): Promise<void> | void;
}

/**
 * Resolved configuration for a `keyValue()` field, after all defaults are applied.
 *
 * `interfaceType` is computed PER INSTANCE (`Record<string, V>` or
 * `Record<Id<"slug">, V>`) via `childInterfaceType(options.value)`, so a
 * nested `select`/named `group` inside `value` produces the same literal
 * union / named type it would at the top level (P-019).
 *
 * @see {@link KeyValueFieldInput} for the user-facing input type
 * @see {@link keyValue} for the config function that produces this type
 */
export interface KeyValueField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TKeysSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.keyValue.type;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: KeyValueFieldAdminConfig<TCollectionSlug>;
  label: string;
  required: boolean;
  keys?: KeyValueFieldKeysInput<TKeysSlug>;
  /** The record's own value field, with `required` forced to `true`. */
  value: AdminDataField;
  defaultValue: Record<string, unknown>;
  validate?(props: FieldValidateProps<TCollectionSlug, Record<string, unknown>>): Promise<void> | void;
}
