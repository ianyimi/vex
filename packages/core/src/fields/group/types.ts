import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldAdminConfig, FieldAdminConfigInput } from "../baseTypes";
import { AdminField } from "../types";

/**
 * 'admin' field configuration input for a `group()` field.
 */
export interface GroupFieldAdminConfigInput extends FieldAdminConfigInput {
  /**
   * Whether the accordion fieldset starts COLLAPSED in the admin form.
   *
   * Defaults to `false`, so a group is expanded on load. Set `true` for
   * secondary or rarely-edited groups (e.g. SEO metadata on a page) to reduce
   * visual noise.
   *
   * Mirrors `blocks()`' option of the same name, and Payload's, so every
   * collapsible field in a config reads the same way. Note this is the
   * INVERSE of the top-level `defaultOpen` it replaced: `defaultOpen: false`
   * is now `admin.defaultCollapsed: true`.
   *
   * Collapsing is NAVIGATION, not editing: a caller with read access but no
   * write access can still expand the group to see its values, and every
   * sub-field stays individually gated by `readOnly`.
   */
  defaultCollapsed?: boolean;
}

/**
 * Resolved 'admin' field configuration for a `group()` field.
 */
export interface GroupFieldAdminConfig extends FieldAdminConfig {
  /**
   * Whether the accordion fieldset starts COLLAPSED in the admin form.
   *
   * Always present after `group()` applies its defaults; `false` unless the
   * field opted in. See {@link GroupFieldAdminConfigInput.defaultCollapsed}.
   */
  defaultCollapsed: boolean;
}

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
 *   defaultValue: {},
 *   admin: {
 *     hidden:            false,
 *     readOnly:          false,
 *     position:          "main",
 *     width:             "full",
 *     cellAlignment:     "left",
 *     defaultCollapsed:  false,
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * seo: group({
 *   label: "SEO",
 *   fields: {
 *     title:       text({ required: true }),
 *     description: text(),
 *   },
 *   // Collapsed on load — secondary metadata, not the primary edit target.
 *   admin: { defaultCollapsed: true },
 * })
 * ```
 *
 * @see {@link GroupField} for the resolved output type
 * @see {@link group} for the config function that produces this type
 */
export interface GroupFieldInput<TFieldMeta extends {} = {}> extends BaseFieldInput<TFieldMeta> {
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
  interfaceName?: string;
  admin?: GroupFieldAdminConfigInput;
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
export interface GroupField<TFieldMeta extends {} = {}> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.group.type;
  /** Display label shown in the admin form. Always set — inferred from field key if not provided. */
  label: string;
  /** Whether this field is required in the database schema. */
  required: boolean;
  /** Resolved admin UI configuration with all defaults applied. */
  admin: GroupFieldAdminConfig;
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
}
