// =============================================================================
// GLOBAL TYPES — Object-based configuration
// =============================================================================

import type { VexField, InferFieldsType } from "./fields";

/**
 * Admin UI configuration for a global.
 * Controls how the global appears and behaves in the admin panel.
 */
export interface GlobalAdminConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
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
 * A global definition. Users create these as plain objects
 * with `as const satisfies VexGlobal`.
 *
 * @example
 * ```ts
 * const siteSettings = {
 *   slug: "site_settings",
 *   label: "Site Settings",
 *   fields: {
 *     siteName: { type: "text", label: "Site Name", required: true },
 *   },
 * } as const satisfies VexGlobal;
 * ```
 */
export interface VexGlobal<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  /** The global identifier, used in URLs and the database. */
  readonly slug: string;
  /**
   * The fields that make up this global document.
   */
  fields: TFields;
  /**
   * Display label for the global in the admin UI.
   * If not provided, the label is derived from the global slug.
   */
  label?: string;
  /**
   * The name of the table generated for this global in the
   * generated vex schema file. Defaults to the global slug.
   */
  tableName?: string;
  /**
   * Admin UI configuration for this global.
   * Controls sidebar grouping, icons, and permissions.
   */
  admin?: GlobalAdminConfig<TFields>;
  /**
   * TypeScript interface name used in generated `vex.types.ts`.
   * If not set, auto-generated from slug via PascalCase conversion.
   * @example "SiteSettings"
   */
  interfaceName?: string;
  /**
   * Type helper — use `typeof global._docType` to get the
   * inferred document shape for this global.
   */
  readonly _docType?: InferFieldsType<TFields>;
}
