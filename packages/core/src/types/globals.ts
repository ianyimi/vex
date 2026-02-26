// =============================================================================
// GLOBAL TYPES
// =============================================================================

import { InferFieldsType, VexField } from "./fields";

/**
 * Admin UI configuration for a global.
 * Controls how the global appears and behaves in the admin panel.
 */
export interface GlobalAdminConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  /**
   * Group this global under a heading in the sidebar.
   * Globals with the same group string are grouped together.
   */
  group?: string;
  /**
   * Icon name for the global in the sidebar.
   * Uses Lucide icon names (e.g. `"settings"`, `"globe"`, `"layout"`).
   */
  icon?: string;
  /**
   * Field key to use as the document title in the admin panel.
   * Should reference a text-like field from the global's fields.
   */
  useAsTitle?: keyof TFields;
  /**
   * Field keys to show as default columns in the admin view.
   * If not set, all fields are shown.
   */
  defaultColumns?: (keyof TFields)[];
  /**
   * Disable the "Create New" button in the admin panel.
   *
   * Default: `false`
   */
  disableCreate?: boolean;
  /**
   * Disable the delete action in the admin panel.
   *
   * Default: `false`
   */
  disableDelete?: boolean;
}

/**
 * Configuration passed to `defineGlobal`.
 * Defines the fields, label, and admin behavior for a global.
 */
export interface GlobalConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  /**
   * The fields that make up this global document.
   * Each key becomes a field name, and the value defines
   * its type and validation (e.g. `text()`, `number()`, `select()`).
   */
  fields: TFields;
  /**
   * Display label for the global in the admin UI.
   * If not provided, the label is derived from the global slug.
   */
  label?: string;
  /**
   * Admin UI configuration for this global.
   * Controls sidebar grouping, icons, and permissions.
   */
  admin?: GlobalAdminConfig<TFields>;
}

/**
 * A defined global with inferred document type.
 * Created by `defineGlobal()`.
 */
export interface VexGlobal<TFields extends Record<string, VexField<any, any>>> {
  /** The global identifier, used in URLs and the database. */
  readonly slug: string;
  /** The full global configuration. */
  readonly config: GlobalConfig<TFields>;
  /**
   * Type helper — use `typeof global._docType` to get the
   * inferred document shape for this global.
   */
  readonly _docType: InferFieldsType<TFields>;
}
