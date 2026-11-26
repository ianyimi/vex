import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldLimit,
  FieldLimitInput,
  FieldValidateProps,
} from "../baseTypes";
import type { VexResourceSlug } from "../../types/generated";
import type { FieldMaskInput } from "../mask";

/** Per-type `admin` input for `number()` — adds `mask`. */
export interface NumberFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /**
   * An opt-in input mask, or `false` to opt out of the project default — see
   * {@link TextFieldAdminInput.mask} for the full contract. A masked number
   * field renders `type="text"` and still stores a `number`.
   */
  mask?: FieldMaskInput | false;
}

/** Resolved per-type `admin` for `number()`. */
export interface NumberFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfig<TCollectionSlug> {
  /** The field's own mask, or `false` to opt out of the project default. @see {@link NumberFieldAdminInput.mask} */
  mask?: FieldMaskInput | false;
}

/**
 * A `number()` field's `min`/`max` input when it stores `int64` — a bare
 * `bigint` pairs with the field's own default error message, or a `[value,
 * error]` tuple overrides it. @see {@link FieldLimitInput} for the `float64` equivalent
 */
export type Int64FieldLimitInput = bigint | readonly [value: bigint, error: string];

/**
 * Resolved `int64` `min`/`max` constraint after defaults are applied —
 * always a `[value, error]` tuple. @see {@link FieldLimit} for the `float64` equivalent
 */
export type Int64FieldLimit = readonly [value: bigint, error: string];

interface NumberFieldInputBase<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Admin UI configuration for this field. */
  admin?: NumberFieldAdminInput<TCollectionSlug>;
  /**
   * Step increment for the number input's native spinner/validation
   * (the HTML `step` attribute) — ignored for an `int64` field, whose input
   * is a plain integer text entry with no spinner. Submitted values are
   * never rounded or rejected against it.
   */
  step?: number;
}

/** `number()` input storing the default `v.float64()` shape — a plain JS `number`. */
export interface Float64NumberFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends NumberFieldInputBase<TCollectionSlug, TFieldKey, TFieldMeta> {
  schema?: never;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect database values — only the form's initial state.
   */
  defaultValue?: number;
  /** Minimum allowed numeric value. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum allowed numeric value. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
  /** Server-only async validation with `value` typed as `number`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, number>): Promise<void> | void;
}

/**
 * `number()` input storing `v.int64()` — a native `bigint`, selected with
 * `schema: { validator: "int64" }`. Reads return `bigint`; the admin form
 * holds `bigint`; `min`/`max`/`defaultValue` are `bigint`-typed.
 */
export interface Int64NumberFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends NumberFieldInputBase<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Storage override — `"int64"` stores `v.int64()` instead of the default `v.float64()`. */
  schema: { validator: typeof FIELD_SCHEMA_VALIDATORS.int64 };
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Left `undefined` when omitted — no silent `0n` pre-fill. Does not affect
   * database values.
   */
  defaultValue?: bigint;
  /** Minimum allowed value. @see {@link Int64FieldLimitInput} */
  min?: Int64FieldLimitInput;
  /** Maximum allowed value. @see {@link Int64FieldLimitInput} */
  max?: Int64FieldLimitInput;
  /** Server-only async validation with `value` typed as `bigint`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, bigint>): Promise<void> | void;
}

/**
 * Configuration input for a `number()` field.
 *
 * Number fields store numeric values — prices, quantities, ratings, ages, counts, etc. By
 * default they store a `v.float64()`; `schema: { validator: "int64" }` stores a native
 * `bigint` instead (`v.int64()`), typing `min`/`max`/`defaultValue`/`validate` as `bigint`.
 * All properties are optional; unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by `number()`:**
 * ```ts
 * {
 *   type:     "number",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width: "100%",  // spans the full form width, not half
 *     cellAlignment: "left",  // value aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Price")
 * price: number()
 *
 * // Required quantity with a minimum of 1 and a database index
 * quantity: number({ required: true, min: 1, index: "by_quantity" })
 *
 * // An int64 counter — bigint everywhere
 * viewCount: number({ schema: { validator: "int64" }, min: 0n })
 * ```
 *
 * @see {@link NumberField} for the resolved type after defaults are applied
 * @see {@link number} for the config function that applies defaults
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export type NumberFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> =
  | Float64NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>
  | Int64NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>;

interface NumberFieldBase<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.number.type;
  label: string;
  required: boolean;
  admin: NumberFieldAdminConfig<TCollectionSlug>;
  /** Resolved step increment for the number input's native spinner. @see {@link NumberFieldInputBase.step} */
  step?: number;
}

/** Resolved `number()` field storing the default `v.float64()` shape. */
export interface Float64NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends NumberFieldBase<TCollectionSlug, TFieldMeta> {
  schema?: never;
  interfaceType: "number";
  defaultValue: number | undefined;
  /** Resolved minimum allowed numeric value. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Resolved maximum allowed numeric value. @see {@link FieldLimit} */
  max?: FieldLimit;
  validate?(props: FieldValidateProps<TCollectionSlug, number>): Promise<void> | void;
}

/** Resolved `number()` field storing `v.int64()` — a native `bigint`. */
export interface Int64NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends NumberFieldBase<TCollectionSlug, TFieldMeta> {
  schema: { validator: typeof FIELD_SCHEMA_VALIDATORS.int64 };
  interfaceType: "bigint";
  defaultValue: bigint | undefined;
  /** Resolved minimum allowed value. @see {@link Int64FieldLimit} */
  min?: Int64FieldLimit;
  /** Resolved maximum allowed value. @see {@link Int64FieldLimit} */
  max?: Int64FieldLimit;
  validate?(props: FieldValidateProps<TCollectionSlug, bigint>): Promise<void> | void;
}

/**
 * Resolved configuration for a `number()` field, after all defaults are applied.
 *
 * @see {@link NumberFieldInput} for the user-facing input type
 * @see {@link number} for the config function that produces this type
 */
export type NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> = Float64NumberField<TCollectionSlug, TFieldMeta> | Int64NumberField<TCollectionSlug, TFieldMeta>;
