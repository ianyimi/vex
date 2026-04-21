import { AdminField } from "../fields";
import { CoreAdminField } from "./constants";

/**
 * Admin panel configuration input for a collection.
 *
 * Controls how the collection is presented and queried in the admin panel.
 * All properties are optional.
 *
 * **Defaults applied by `defineCollection()`:**
 * ```ts
 * {
 *   useAsTitle: "_id", // falls back to the Convex document ID if not set
 * }
 * ```
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: { title: text({ required: true }) },
 *   admin: { useAsTitle: "title" },
 * })
 * ```
 *
 * @see {@link AdminCollectionConfig} for the resolved type after defaults are applied
 */
export interface AdminCollectionConfigInput<
  TFieldSlug extends string = CoreAdminField,
> {
  /**
   * The field whose value is displayed as the document's human-readable title
   * throughout the admin panel (list rows, breadcrumbs, relation pickers).
   *
   * Accepts any user-defined field slug from this collection, or a built-in
   * Convex system field (`"_id"` | `"_creationTime"`). Setting a user-defined
   * field also auto-generates a database index (`by_<field>`) and a search
   * index (`search_<field>`) for fast admin queries. Omit to fall back to `"_id"`.
   */
  useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>;
}

/**
 * Resolved admin panel configuration for a collection after defaults are applied.
 *
 * @see {@link AdminCollectionConfigInput} for the user-facing input type
 */
export interface AdminCollectionConfig<
  TFieldSlug extends string = CoreAdminField,
> {
  /** The field used as the document's human-readable title in the admin panel. */
  useAsTitle: CoreAdminField | NoInfer<TFieldSlug>;
}

/**
 * Configuration input for a `defineCollection()` call.
 *
 * A collection maps to a Convex database table. `slug` becomes the table name,
 * `fields` defines its shape, and `labels` controls how the collection appears
 * in the admin panel. Omitted labels are inferred from the slug.
 *
 * **Defaults applied by `defineCollection()`:**
 * ```ts
 * {
 *   labels: {
 *     singular: "Post",   // title-cased from slug ("posts" → "Post")
 *     plural:   "Posts",  // title-cased + pluralised from slug
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: {
 *     title: text({ required: true }),
 *     body:  richtext(),
 *   },
 * })
 * ```
 *
 * @see {@link CollectionConfig} for the resolved type after defaults are applied
 * @see {@link defineCollection} for the config function
 */
export interface CollectionConfigInput<
  TSlug extends string = string,
  TFieldSlug extends string = string,
> {
  /** Admin panel behaviour for this collection. All properties are optional. */
  admin?: AdminCollectionConfigInput<TFieldSlug>;
  /** Convex table name — used as the database table identifier and URL slug in the admin panel. */
  slug: TSlug;
  /**
   * Display names shown in the admin panel navigation and list views.
   * Both are inferred from `slug` if omitted.
   */
  labels?: {
    /** Singular display name (e.g. `"Post"`). Inferred from slug if omitted. */
    singular?: string;
    /** Plural display name (e.g. `"Posts"`). Inferred from slug if omitted. */
    plural?: string;
  };
  /** Field definitions that make up this collection's document shape. */
  fields: Record<TFieldSlug, AdminField>;
  /** Override the PascalCase interface name used in generated TypeScript types. Inferred from `slug` by `defineCollection` if omitted. */
  interfaceName?: string;
}

/**
 * Resolved collection configuration after defaults are applied by `defineCollection()`.
 *
 * @see {@link CollectionConfigInput} for the user-facing input type
 * @see {@link defineCollection} for the config function
 */
export interface CollectionConfig<
  TSlug extends string = string,
  TFieldSlug extends string = string,
> {
  /** Resolved admin panel configuration for this collection. */
  admin: AdminCollectionConfig<TFieldSlug>;
  /** Convex table name for this collection. */
  slug: TSlug;
  /** Display names shown in the admin panel — always present after defaults are applied. */
  labels: {
    /** Singular display name (e.g. `"Post"`). */
    singular: string;
    /** Plural display name (e.g. `"Posts"`). */
    plural: string;
  };
  /** Resolved field definitions for this collection. */
  fields: Record<TFieldSlug, AdminField>;
  /** PascalCase identifier derived from `slug`, used as the TypeScript interface name in generated types (e.g. `"posts"` → `"Posts"`). */
  interfaceName: string;
}
