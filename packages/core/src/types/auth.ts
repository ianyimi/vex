import type { VexCollection } from "./collections";

// =============================================================================
// AUTH INDEX TYPES
// =============================================================================

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

// =============================================================================
// AUTH ADAPTER
// =============================================================================

/**
 * A type-level map from collection slug to field key union.
 * Used by auth adapters to provide LSP autocomplete for auth field keys
 * in `defaultColumns`, `useAsTitle`, etc.
 *
 * @example
 * ```ts
 * type MyMap = {
 *   user: "email" | "createdAt" | "updatedAt";
 *   session: "userId" | "token" | "expiresAt";
 * };
 * ```
 */
export type AuthFieldKeyMap = Record<string, string>;

/**
 * The auth adapter object stored in `VexConfig.auth`.
 * Returned by `vexBetterAuth()`.
 *
 * Uses VexCollection[] — auth tables are defined with the same
 * VexField system as user collections, enabling uniform schema
 * generation, column rendering, and admin UI support.
 *
 * @typeParam TFieldKeyMap - Type-level map from collection slug to field key union.
 *   Enables LSP autocomplete for auth field keys in `defaultColumns`, `useAsTitle`, etc.
 */
export interface VexAuthAdapter<
  TFieldKeyMap extends AuthFieldKeyMap = AuthFieldKeyMap,
> {
  /** Auth provider identifier (e.g., "better-auth") */
  readonly name: string;

  /**
   * All auth collections (user, session, account, verification, plugin tables, etc.).
   * Already includes plugin-contributed tables and field extensions.
   * Core's schema generator uses these as the base, then merges any
   * user-defined collection configs on top for admin UI customization.
   */
  collections: VexCollection[];

  /**
   * Phantom property — never set at runtime.
   * Carries the type-level field key map for LSP autocomplete.
   */
  readonly _fieldKeyMap?: TFieldKeyMap;
}

// =============================================================================
// AUTH UTILITY TYPES
// =============================================================================

/**
 * Extract field keys from an auth adapter's collection that matches a given slug.
 * Looks up from the adapter's `_fieldKeyMap` phantom type.
 *
 * @example
 * type UserAuthFields = AuthCollectionFieldKeys<typeof auth, "user">;
 * // => "email" | "emailVerified" | "image" | "createdAt" | "updatedAt"
 */
export type AuthCollectionFieldKeys<
  TAuth extends VexAuthAdapter<any>,
  TSlug extends string,
> = TAuth extends VexAuthAdapter<infer TMap>
  ? TSlug extends keyof TMap
    ? TMap[TSlug] & string
    : never
  : never;

/**
 * @deprecated Use AuthCollectionFieldKeys instead.
 */
export type AuthTableFieldKeys<
  TAuth extends VexAuthAdapter<any>,
  TSlug extends string,
> = AuthCollectionFieldKeys<TAuth, TSlug>;
