import type { ApplyComponent, ComponentHKT, AdminField } from "../fields";
import type { GlobalSlug } from "../types/generated";
import type { LucideIconName } from "../utils";

/**
 * Field keys that are reserved by the VexCMS globals system and cannot be
 * used as user-defined field names on a global. These are the system fields
 * that appear on every flat global document returned by the API.
 */
export type ReservedGlobalFieldKey = "_id" | "_creationTime" | "_slug";

/**
 * User-facing admin panel configuration input for `defineGlobal()`.
 *
 * Intentionally narrower than `AdminCollectionConfigInput` — globals cannot
 * be relationship targets (no picker), have no list view (no `table` config),
 * and always use `label` as the admin page title (no `useAsTitle`).
 * Consequently this interface has only one generic: `TComponent`.
 *
 * @typeParam TComponent - Component HKT binding; defaults to `ComponentHKT`.
 */
export interface GlobalAdminConfigInput<TComponent extends ComponentHKT = ComponentHKT> {
  /**
   * Sidebar group label this global appears under (e.g. `"Site Builder"`).
   * Ungrouped when omitted.
   */
  group?: string;
  /**
   * Short description shown beneath the global label in `GlobalsListView`.
   */
  description?: string;
  /**
   * Live preview configuration. Reserved for future `LivePreviewPanel`
   * integration — included now so adding live preview later is non-breaking.
   */
  livePreview?: { url: string };
  /**
   * Lucide icon name shown in the admin sidebar.
   * See https://lucide.dev/icons/
   */
  icon?: LucideIconName;
  /**
   * Custom React component for rendering this global in contexts where a
   * compact preview is needed (e.g. future cross-global reference UI).
   * Typed via the HKT machinery — resolves to `ComponentType<...>` in React.
   */
  components?: {
    preview?: ApplyComponent<TComponent, { slug: string }>;
  };
}

/**
 * Resolved admin config after `defineGlobal()` applies defaults.
 *
 * @typeParam TComponent - Component HKT binding.
 */
export interface GlobalAdminConfig<TComponent extends ComponentHKT = ComponentHKT> {
  /** Sidebar group label. Empty string when not set. */
  group: string;
  /** Description. Empty string when not set. */
  description: string;
  /** Live preview config. */
  livePreview?: { url: string };
  /** Lucide icon name. */
  icon?: LucideIconName;
  /** Custom preview component. */
  components: {
    preview?: ApplyComponent<TComponent, { slug: string }>;
  };
}

/**
 * User-facing input to `defineGlobal()`.
 *
 * Mirrors `CollectionConfigInput` with the same five generics. The constraint
 * `[TFieldSlug & ReservedGlobalFieldKey] extends [never]` is enforced in
 * `defineGlobal`'s function signature — a compile-time error is emitted if
 * any field key is `_id`, `_creationTime`, or `_slug`.
 *
 * @typeParam TFieldMeta - Metadata attached to each field definition.
 * @typeParam TGlobalMeta - Metadata attached to the global config itself.
 * @typeParam TGlobalSlug - The slug string literal type (inferred by `defineGlobal`).
 * @typeParam TFieldSlug - Union of field key string literals.
 * @typeParam TComponent - Component HKT binding.
 *
 * @example
 * ```ts
 * defineGlobal({
 *   slug: "siteSettings",
 *   label: "Site Settings",
 *   fields: {
 *     siteName: text({ label: "Site Name", required: true }),
 *     activeTheme: relationship({ label: "Active Theme", collection: "themes" }),
 *   },
 *   admin: { group: "Site Builder" },
 * });
 * ```
 *
 * @see {@link GlobalConfig} for the resolved return type
 * @see {@link defineGlobal} for the config function
 */
export interface GlobalConfigInput<
  TFieldMeta extends {} = {},
  TGlobalMeta extends {} = {},
  TGlobalSlug extends string = string,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /**
   * Unique slug for this global. Becomes the `_slug` discriminator on the flat
   * document and the lookup key in `vex_globals`. Must be camelCase and unique
   * across all globals in the project.
   */
  slug: TGlobalSlug;
  /**
   * Human-readable label shown in the admin sidebar and page heading.
   * Always used as the admin page title — globals have no `useAsTitle`.
   * @example "Site Settings"
   */
  label: string;
  /**
   * Field definitions for this global. All field types supported by
   * `defineCollection` are valid. Field keys must not be `_id`,
   * `_creationTime`, or `_slug` (enforced at compile time by `defineGlobal`).
   */
  fields: Record<TFieldSlug, AdminField<TFieldMeta>>;
  /** Admin panel display and behaviour config. */
  admin?: GlobalAdminConfigInput<TComponent>;
  /**
   * Override the generated TypeScript interface name. Inferred from `slug`
   * with `Global` suffix when omitted (e.g. `"siteSettings"` → `"SiteSettingsGlobal"`).
   */
  interfaceName?: string;
  /** Arbitrary metadata attached to this global config. */
  meta?: TGlobalMeta;
  /**
   * Draft and versioning config. Parsed but ignored in v35 — versioning for
   * globals lands in Spec 36. Included now for forward compatibility so
   * `defineGlobal` call sites don't need to change when Spec 36 ships.
   */
  versions?: {
    /** Enable draft/publish workflow. Default: `false`. */
    drafts?: boolean;
  };
}

/**
 * Resolved global config returned by `defineGlobal()` and stored in
 * `VexConfig.globals`.
 *
 * @typeParam TFieldMeta - Field-level metadata.
 * @typeParam TGlobalMeta - Global-level metadata.
 * @typeParam TGlobalSlug - The exact slug type (narrowed from `GlobalSlug`).
 * @typeParam TFieldSlug - Union of field key string literals.
 * @typeParam TComponent - Component HKT binding.
 */
export interface GlobalConfig<
  TFieldMeta extends {} = {},
  TGlobalMeta extends {} = {},
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /** Unique slug — the lookup key in `vex_globals`. */
  slug: TGlobalSlug;
  /** Human-readable label. */
  label: string;
  /** Resolved field definitions. */
  fields: Record<TFieldSlug, AdminField<TFieldMeta>>;
  /** Resolved admin config. */
  admin: GlobalAdminConfig<TComponent>;
  /**
   * PascalCase interface name for generated TypeScript types.
   * E.g. `"siteSettings"` → `"SiteSettingsGlobal"`.
   */
  interfaceName: string;
  /** Global-level metadata. */
  meta: TGlobalMeta;
  /** Resolved versioning config. Always present after defaults. */
  versions: { drafts: boolean };
}
