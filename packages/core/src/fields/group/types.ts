import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig } from "../baseTypes";
import { AdminField } from "../types";

/**
 * Configuration input for a `group()` field.
 *
 * Group fields store a named set of sub-fields as a single nested object.
 * All properties except `fields` are optional; unset properties fall back
 * to the defaults applied by `group()`.
 *
 * **Defaults applied by `group()`:**
 * ```ts
 * {
 *   type:        "group",
 *   label:       "",      // inferred from the field key by defineCollection
 *   required:    false,
 *   defaultOpen: true,
 *   defaultValue: {},
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width:         "full",
 *     cellAlignment: "left",
 *   }
 * }
 *
 * @example
 * ```ts
 * seo: group({
 *   label: "SEO",
 *   fields: {
 *     title:       text({ required: true }),
 *     description: text(),
 *   },
 *   defaultOpen: false,  // accordion starts collapsed
 * })
 *
 * @see {@link GroupField} for the resolved output type
 * @see {@link group} for the config function that produces this type
 */
export interface GroupFieldInput<
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TFieldMeta> {
  /**
   * Sub-fields that form the object's shape.
   *
   * Accepts any `AdminField` value, including nested `group()` or `array()`.
   * Each sub-field uses its own `required` setting for both Zod validation
   * and Convex schema generation.
   */
  fields: Record<string, AdminField>;
  /** Pre-filled value shown when creating a new document. Defaults to `{}`. */
  defaultValue?: Record<string, unknown>;
  /**
   * Whether the accordion fieldset starts open in the admin form.
   *
   * Defaults to `true`. Set `false` for secondary or rarely-edited groups
   * (e.g. SEO metadata on a page) to reduce visual noise on load.
   */
  defaultOpen?: boolean;
  interfaceName?: string;
}

/**
 * Resolved configuration for a `group()` field, after all defaults are applied.
 *
 * This is the type field input components and validator functions receive.
 * `interfaceType` is a computed TypeScript object-type string built from the
 * sub-fields (e.g. `"{ title: string; description?: string }"`), used by
 * `generateVexTypes` to emit accurately-typed document interfaces.
 *
 * @see {@link GroupFieldInput} for the user-facing input type
 * @see {@link group} for the config function that produces this type
 */
export interface GroupField<
  TFieldMeta extends {} = {},
> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.group.type;
  /** Display label shown in the admin form. Always set — inferred from field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: FieldAdminConfig;
  /**
   * Sub-fields that form the object's shape.
   *
   * Each sub-field retains its own `required`, `label`, and admin settings.
   * Convex and Zod validators are generated per-field respecting those settings.
   */
  fields: Record<string, AdminField>;
  /**
   * Computed TypeScript object-type string for `generateVexTypes`.
   *
   * Built from sub-fields in `group()` — e.g. `"{ title: string; description?: string }"`.
   * Automatically reflects nested groups or arrays within the sub-fields.
   */
  interfaceType: string;
  interfaceName?: string;
  /** Pre-filled value shown when creating a new document. */
  defaultValue: Record<string, unknown>;
  /**
   * Whether the accordion fieldset starts open in the admin form.
   *
   * Resolved value after defaults — always `true` unless explicitly set `false`.
   */
  defaultOpen: boolean;
}
