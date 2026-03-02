// =============================================================================
// AUTH TABLE DEFINITIONS
// =============================================================================

/**
 * A field definition for auth infrastructure tables.
 * Uses validator strings since these tables are not user-configurable
 * through the Vex field system — they come from the auth provider.
 *
 * Optionality is encoded directly in the validator string itself
 * (e.g., `"v.optional(v.string())"` vs `"v.string()"`).
 */
export interface AuthFieldDefinition {
  /** Convex validator string, e.g. "v.string()", "v.optional(v.boolean())" */
  validator: string;
}

/**
 * An index definition for auth infrastructure tables.
 */
export interface AuthIndexDefinition {
  /** Index name (must be unique within the table) */
  name: string;
  /** Field names to index (order matters for compound indexes) */
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
  /** Field definitions using validator strings */
  fields: Record<string, AuthFieldDefinition>;
  /** Database indexes */
  indexes?: AuthIndexDefinition[];
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
 * This is NOT an abstract interface for multiple providers.
 * It's the concrete shape that `vexBetterAuth()` returns.
 * If a second auth provider is needed later, generalize this type then.
 */
export interface VexAuthAdapter {
  /** Auth provider identifier (e.g., "better-auth") */
  readonly name: string;

  /**
   * Which collection slug represents the user table.
   * This collection's fields will be merged with auth-provided user fields.
   */
  userCollection: string;

  /**
   * All fields that the auth provider adds to the user collection.
   * Already includes contributions from all active auth plugins
   * (e.g., admin plugin's `banned`, `role` fields).
   * Uses validator strings, not VexField, because they're schema-only.
   */
  userFields: Record<string, AuthFieldDefinition>;

  /**
   * All auth infrastructure tables (account, session, verification, jwks, etc.).
   * Already includes plugin-contributed tables and field extensions
   * (e.g., admin plugin's `impersonatedBy` on session).
   * These are added to vex.schema.ts but NOT shown in the admin sidebar.
   */
  tables: AuthTableDefinition[];
}
