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
 * Defines an auth infrastructure table (e.g., account, session).
 * These tables are NOT admin-managed collections — they don't appear
 * in the sidebar or have CRUD views. They only exist in the schema.
 */
export interface AuthTableDefinition {
  /** Table slug (e.g., "account", "session") */
  slug: string;
  /** Field definitions using valueType strings */
  fields: Record<string, AuthFieldDefinition>;
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
export interface VexAuthAdapter {
  /** Auth provider identifier (e.g., "better-auth") */
  readonly name: string;

  /**
   * All auth tables (user, session, account, verification, plugin tables, etc.).
   * Already includes plugin-contributed tables and field extensions.
   * Core's schema generator uses these as the base, then merges any
   * user-defined collection configs on top for admin UI customization.
   */
  tables: AuthTableDefinition[];
}
