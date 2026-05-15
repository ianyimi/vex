import { CollectionConfig } from "../collections";
import { ComponentHKT } from "../fields";
import { CollectionSlug } from "../types";
import { AuthFieldMeta } from "./mergeCollections";

/**
 * Metadata attached to auth collections to control merge behavior with
 * user-defined collections.
 *
 * Auth adapters mark collections as `protected` to prevent accidental
 * overrides that could break authentication.
 */
export type AuthCollectionMeta = {
  /**
   * When `true`, this auth collection cannot be overridden by a user-defined
   * collection with the same slug. Attempting to do so throws a
   * {@link VexAuthConfigError}.
   *
   * When `false` or omitted, user-defined collections can extend or
   * override this auth collection (unlocked fields can still be overridden,
   * but locked fields are preserved — see {@link AuthFieldMeta}).
   */
  protected?: boolean;
};

/**
 * Auth collection config — extends `CollectionConfig` with field-level
 * locking so auth adapters can protect fields that must not be overridden.
 */
export type AuthCollectionConfig<
  TSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
> = CollectionConfig<
  AuthFieldMeta,
  AuthCollectionMeta,
  TSlug,
  TFieldSlug,
  TComponent
>;

/**
 * Auth adapter returned by an auth provider package (e.g. `@vexcms/better-auth`).
 *
 * The adapter exposes auth collections as standard Vex `CollectionConfig[]`
 * so that schema generation, admin navigation, and CRUD views treat them
 * identically to user-defined collections.
 *
 * @see {@link betterAuthAdapter} — the Better Auth implementation
 */
export interface VexAuthAdapter {
  /** Provider identifier for debugging and telemetry. */
  readonly name: string;

  /**
   * Auth collections to register alongside user-defined collections.
   *
   * These are merged into `VexConfig.collections` automatically by
   * `defineConfig()`. Each collection uses standard Vex field builders
   * (`text()`, `relationship()`, etc.) and may carry `admin.readOnly`
   * defaults on system fields.
   */
  readonly collections: AuthCollectionConfig[];

  /**
   * The slug of the collection that stores user documents.
   *
   * Used by the admin panel to resolve user references and by auth-aware
   * components to look up the current user collection.
   */
  readonly userCollection: CollectionSlug;
}

/**
 * Error thrown when auth configuration is invalid or when a user-defined
 * collection attempts to override a protected auth collection.
 *
 * @see {@link mergeAuthCollections} for the merge logic that throws this error
 */
export class VexAuthConfigError extends Error {
  /**
   * @param message — Human-readable description of the configuration error.
   */
  constructor(message: string) {
    super(message);
    this.name = "VexAuthConfigError";
  }
}
