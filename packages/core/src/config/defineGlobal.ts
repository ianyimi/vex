import type { VexField, VexGlobal, GlobalAdminConfig } from "../types";
import type { VersionsConfig } from "../types/collections";

/**
 * Creates a VexGlobal with full LSP autocomplete on field names
 * and `admin.useAsTitle`, etc.
 *
 * A global is a singleton document — only one document exists per global.
 * The admin panel shows it as a single editable form, not a list.
 *
 * @example
 * ```ts
 * export const siteSettings = defineGlobal({
 *   slug: "site_settings",
 *   label: "Site Settings",
 *   fields: {
 *     siteName: text({ label: "Site Name", required: true }),
 *     description: text({ label: "Description" }),
 *   },
 *   admin: { useAsTitle: "siteName" },
 *   versions: { drafts: true },
 * });
 * ```
 */
export function defineGlobal<
  TFields extends Record<string, VexField>,
  TSlug extends string = string,
>(props: {
  readonly slug: TSlug;
  fields: TFields;
  label?: string;
  tableName?: string;
  admin?: GlobalAdminConfig<TFields>;
  versions?: VersionsConfig;
  interfaceName?: string;
}): VexGlobal<TFields, TSlug> {
  return props;
}
