// =============================================================================
// AUTH TABLE DEFINITIONS
// =============================================================================

/**
 * A field definition for auth infrastructure tables.
 * Uses valueType strings since these tables are not user-configurable
 * through the Vex field system — they come from the auth provider.
 *
 * Optionality is encoded directly in the valueType string itself
 * (e.g., `"v.optional(v.string())"` vs `"v.string()"`).
 */
export interface AuthFieldDefinition {
  /** Convex valueType string, e.g. "v.string()", "v.optional(v.boolean())" */
  valueType: string;
}

/**
 * A resolved index ready for code generation.
 */
export interface ResolvedIndex {
  /** Index name (e.g., "by_slug") */
  name: string;
  /** Field names included in the index */
  fields: string[];
}

/**
 * A resolved search index ready for code generation.
 */
export interface ResolvedSearchIndex {
  /** Search index name (e.g., "search_title") */
  name: string;
  /** The field to perform full-text search on (must be a string field) */
  searchField: string;
  /** Fields that can be used to filter search results */
  filterFields: string[];
}

/**
 * Defines an auth infrastructure table (e.g., account, session).
 * These tables are NOT admin-managed collections — they don't appear
 * in the sidebar or have CRUD views. They only exist in the schema.
 *
 * Generic parameters preserve literal types for autocomplete:
 * - `TSlug` — the table slug as a string literal (e.g., `"user"`)
 * - `TFieldKeys` — union of field name literals (e.g., `"email" | "image"`)
 */
export interface AuthTableDefinition<
  TSlug extends string = string,
  TFieldKeys extends string = string,
> {
  /** Table slug (e.g., "account", "session") */
  slug: TSlug;
  /** Field definitions using valueType strings */
  fields: Record<TFieldKeys, AuthFieldDefinition>;
  /** Database indexes */
  indexes?: ResolvedIndex[];
}

// =============================================================================
// AUTH ADAPTER (returned by vexBetterAuth())
// =============================================================================

/**
 * The auth adapter object stored in `VexConfig.auth`.
 * Returned by `vexBetterAuth()`.
 *
 * This is the **fully resolved** output — all plugin contributions
 * (additional user fields, table extensions, extra tables) have already
 * been applied by `vexBetterAuth()` before this object is created.
 * Core never needs to know about auth sub-plugins.
 *
 * All auth tables (user, session, account, verification, plugin tables)
 * are returned uniformly in the `tables` array. The user table is NOT
 * special-cased — core's schema generator merges any user-defined
 * collection configs on top of all auth tables equally.
 */
export interface VexAuthAdapter<
  TTables extends AuthTableDefinition<string, string>[] = AuthTableDefinition[],
> {
  /** Auth provider identifier (e.g., "better-auth") */
  readonly name: string;

  /**
   * All auth tables (user, session, account, verification, plugin tables, etc.).
   * Already includes plugin-contributed tables and field extensions.
   * Core's schema generator uses these as the base, then merges any
   * user-defined collection configs on top for admin UI customization.
   */
  tables: TTables;
}

// =============================================================================
// AUTH UTILITY TYPES
// =============================================================================

/**
 * Extract field keys from an auth adapter's table that matches a given slug.
 *
 * @example
 * type UserAuthFields = AuthTableFieldKeys<typeof auth, "user">;
 * // => "email" | "emailVerified" | "image" | "createdAt" | "updatedAt"
 */
export type AuthTableFieldKeys<
  TAuth extends VexAuthAdapter<any>,
  TSlug extends string,
> = TAuth extends VexAuthAdapter<infer TTables>
  ? Extract<TTables[number], { slug: TSlug }> extends AuthTableDefinition<
      any,
      infer TKeys
    >
    ? TKeys
    : never
  : never;
