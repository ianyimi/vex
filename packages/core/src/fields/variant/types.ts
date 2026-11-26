import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldValidateProps,
} from "../baseTypes";
import type { AdminDataField, AdminField } from "../types";
import type { VexResourceSlug } from "../../types/generated";

/** Picker style for a `variant()` field's type switcher. */
export const VARIANT_DISPLAYS = {
  select: "select",
  segmented: "segmented",
} as const;

/** `"select" | "segmented"` — see {@link VARIANT_DISPLAYS}. */
export type VariantDisplay = (typeof VARIANT_DISPLAYS)[keyof typeof VARIANT_DISPLAYS];

/** Per-type `admin` input for `variant()` — adds `display`. */
export interface VariantFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /** How the variant/type picker renders. Default `"select"`. */
  display?: VariantDisplay;
  /**
   * Whether the accordion fieldset starts COLLAPSED in the admin form.
   *
   * Defaults to `false`, so a variant is expanded on load. Mirrors
   * `group()`'s option of the same name — see
   * {@link GroupFieldAdminConfigInput.defaultCollapsed}.
   */
  defaultCollapsed?: boolean;
}

/** Resolved per-type `admin` for `variant()`. */
export interface VariantFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfig<TCollectionSlug> {
  display: VariantDisplay;
  /**
   * Whether the accordion fieldset starts COLLAPSED in the admin form.
   * Always present after `variant()` applies its defaults; `false` unless
   * the field opted in. @see {@link VariantFieldAdminInput.defaultCollapsed}
   */
  defaultCollapsed: boolean;
}

/**
 * One discriminated variant's own definition, passed inline under
 * `variant({ discriminator, variants: { [key]: ... } })`.
 */
export interface VariantMemberInput {
  /** Display label shown in the variant/type picker. Falls back to the variant's own key. */
  label?: string;
  /**
   * Fields that make up this variant's data shape. May not declare a key
   * equal to the field's own `discriminator` — `variant()` throws
   * `VexConfigError` if it does.
   */
  fields: Record<string, AdminField>;
}

/** Resolved counterpart of {@link VariantMemberInput}. */
export interface VariantMemberConfig {
  label?: string;
  fields: Record<string, AdminField>;
  /**
   * Computed TypeScript object-type string for this one variant — the
   * discriminator key as a literal, followed by its own fields, e.g.
   * `{ kind: "email"; address: string }`.
   */
  interfaceType: string;
}

/**
 * Configuration input for a DISCRIMINATED `variant()` field — an object
 * union keyed by `discriminator`, storing `v.union(v.object({ [discriminator]:
 * v.literal(key), ...fields }), ...)` (a single variant collapses to a bare
 * `v.object()`). No `id`/`blockName` keys are injected — unlike `blocks()`,
 * the stored shape is exactly the discriminator plus the variant's own fields.
 *
 * **Defaults applied by `variant()`:**
 * ```ts
 * {
 *   type:     "variant",
 *   label:    "",
 *   required: false,
 *   nullable: false,
 *   admin: { display: "select", hidden: false, readOnly: false, position: "main", width: "100%", cellAlignment: "left" },
 * }
 * ```
 *
 * @example
 * ```ts
 * channel: variant({
 *   label: "Notification channel",
 *   discriminator: "kind",
 *   variants: {
 *     email: { label: "Email", fields: { address: text({ required: true }) } },
 *     sms:   { label: "SMS",   fields: { phoneNumber: text({ required: true }) } },
 *   },
 * })
 * ```
 *
 * @see {@link PrimitiveVariantFieldInput} for the primitive-union mode
 * @see {@link DiscriminatedVariantField} for the resolved output type
 * @see {@link variant} for the config function
 */
export interface DiscriminatedVariantFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends Omit<BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>, "admin"> {
  admin?: VariantFieldAdminInput<TCollectionSlug>;
  /** Property name stored on every variant, naming which one is active. */
  discriminator: string;
  /** One entry per variant, keyed by its stored discriminant value. */
  variants: Record<string, VariantMemberInput>;
  /**
   * Optional TypeScript union alias name. When set, emits `export type
   * NotificationChannel = { kind: "email"; ... } | { kind: "sms"; ... }`
   * and the collection interface uses the alias instead of the inline union.
   */
  interfaceName?: string;
  defaultValue?: Record<string, unknown>;
  /** Server-only async validation with `value` typed as the stored object. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, Record<string, unknown>>): Promise<void> | void;
}

/** Resolved configuration for a discriminated `variant()` field. */
export interface DiscriminatedVariantField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.variant.type;
  admin: VariantFieldAdminConfig<TCollectionSlug>;
  discriminator: string;
  variants: Record<string, VariantMemberConfig>;
  interfaceName?: string;
  defaultValue?: Record<string, unknown>;
  validate?(props: FieldValidateProps<TCollectionSlug, Record<string, unknown>>): Promise<void> | void;
}

/**
 * Configuration input for a PRIMITIVE `variant()` field — no `discriminator`,
 * storing `v.union(...)` over each member's own validator directly (a single
 * member collapses to a bare validator). Members must resolve to distinct
 * runtime kinds — `VexConfigError` at config time otherwise.
 * @see {@link classifyVariantMemberKind}
 *
 * @example
 * ```ts
 * amount: variant({
 *   label: "Amount",
 *   variants: { fixed: text({ required: true }), metered: number({ required: true }) },
 * })
 * ```
 *
 * @see {@link DiscriminatedVariantFieldInput} for the discriminated mode
 * @see {@link PrimitiveVariantField} for the resolved output type
 * @see {@link variant} for the config function
 */
export interface PrimitiveVariantFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends Omit<BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>, "admin"> {
  admin?: VariantFieldAdminInput<TCollectionSlug>;
  discriminator?: undefined;
  /**
   * One member per variant, keyed by its display name. Each is any
   * `AdminDataField` — its own `required` is ignored (`variant()` forces
   * `required: true` on every member: a union branch can never itself be
   * `v.optional()`).
   */
  variants: Record<string, AdminDataField>;
  interfaceName?: string;
  defaultValue?: unknown;
  /** Server-only async validation. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, unknown>): Promise<void> | void;
}

/** Resolved configuration for a primitive `variant()` field. */
export interface PrimitiveVariantField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.variant.type;
  admin: VariantFieldAdminConfig<TCollectionSlug>;
  discriminator?: undefined;
  variants: Record<string, AdminDataField>;
  interfaceName?: string;
  defaultValue?: unknown;
  validate?(props: FieldValidateProps<TCollectionSlug, unknown>): Promise<void> | void;
}

/** Configuration input for a `variant()` field — discriminated or primitive. @see {@link DiscriminatedVariantFieldInput} @see {@link PrimitiveVariantFieldInput} */
export type VariantFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> =
  | DiscriminatedVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>
  | PrimitiveVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>;

/** Resolved configuration for a `variant()` field — discriminated or primitive. @see {@link DiscriminatedVariantField} @see {@link PrimitiveVariantField} */
export type VariantField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> = DiscriminatedVariantField<TCollectionSlug, TFieldMeta> | PrimitiveVariantField<TCollectionSlug, TFieldMeta>;
