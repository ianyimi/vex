// =============================================================================
// GLOBAL TYPES — Object-based configuration
// =============================================================================

import type { VexField, InferFieldsType } from "./fields";
import type { LivePreviewConfig } from "./livePreview";
import type { VersionsConfig } from "./collections";

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
   * Live preview configuration.
   * When set, the admin edit view shows a toggleable side-by-side preview panel
   * with an iframe loading the configured URL.
   */
  livePreview?: LivePreviewConfig<TFields>;
}

/**
 * A global definition. Globals are singleton documents — only one
 * document exists per global. The admin panel shows them as a single
 * editable form, not a list view.
 *
 * @example
 * ```ts
 * const siteSettings = defineGlobal({
 *   slug: "site_settings",
 *   label: "Site Settings",
 *   fields: {
 *     siteName: text({ label: "Site Name", required: true }),
 *     description: text({ label: "Description" }),
 *   },
 *   admin: { useAsTitle: "siteName" },
 * });
 * ```
 */
export interface VexGlobal<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TSlug extends string = string,
> {
  /** The global identifier, used in URLs and the database. */
  readonly slug: TSlug;
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
   * Controls sidebar grouping, icons, and live preview.
   */
  admin?: GlobalAdminConfig<TFields>;
  /**
   * Versioning and draft/publish workflow configuration.
   * When `drafts` is enabled, the admin panel shows Save Draft + Publish
   * and version history, same as versioned collections.
   */
  versions?: VersionsConfig;
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
