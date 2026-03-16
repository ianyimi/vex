import { VexCollection } from "./collections";
import { VexGlobal } from "./globals";
import type { VexAuthAdapter } from "./auth";
import { AdminConfig, AdminConfigInput } from "./admin";
import { SchemaConfig, SchemaConfigInput } from "./schema";
import type { MediaConfig, MediaConfigInput, ClientMediaConfig } from "./media";
import type { VexAccessConfig } from "../access/types";
import type { VexEditorAdapter } from "./editor";

export * from "./fields";
export * from "./collections";
export * from "./globals";
export * from "./auth";
export * from "./admin";
export * from "./schema";
export * from "./media";
export * from "./editor";

// =============================================================================
// CONFIG TYPES
// =============================================================================

/** Resolved Vex CMS configuration */
export interface VexConfig {
  /** Base URL path for the admin panel */
  basePath: string;
  /** Array of collection definitions */
  collections: VexCollection[];
  /** Array of global definitions */
  globals: VexGlobal[];
  /** Admin panel configuration */
  admin: AdminConfig;
  /** Auth adapter — required. Use `vexBetterAuth(authConfig)` to create. */
  auth: VexAuthAdapter;
  /** Schema generation config */
  schema: SchemaConfig;
  /** Media collection configuration */
  media?: MediaConfig;
  /** RBAC access permissions config. Optional — if not set, all actions are allowed. */
  access?: VexAccessConfig;
  /** Global rich text editor adapter. Used by all richtext fields unless overridden. */
  editor?: VexEditorAdapter;
}

/**
 * Client-safe version of VexConfig with all non-serializable values stripped.
 * Use this when passing config across RSC serialization boundaries
 * (e.g., from a server component to a client component).
 *
 * Created via `sanitizeConfigForClient(config)`.
 */
export interface ClientVexConfig {
  basePath: string;
  collections: VexCollection[];
  globals: VexGlobal[];
  admin: AdminConfig;
  auth: VexAuthAdapter;
  schema: SchemaConfig;
  media?: ClientMediaConfig;
  /** Global rich text editor adapter. */
  editor?: VexEditorAdapter;
}

// =============================================================================
// CONFIG INPUT TYPES (used by defineConfig — all fields optional with defaults)
// =============================================================================

/**
 * Input configuration for `defineConfig`. All fields are optional
 * and merged with defaults at runtime.
 */
export interface VexConfigInput {
  /**
   * Base URL path for the admin panel.
   *
   * Default: `"/admin"`
   */
  basePath?: string;
  /**
   * Array of collection definitions.
   *
   * Default: []
   */
  collections?: VexCollection[];
  /**
   * Array of global definitions.
   *
   * Default: []
   */
  globals?: VexGlobal<any>[];
  /**
   * Admin panel configuration.
   */
  admin?: AdminConfigInput;
  /**
   * Auth adapter — **required**. Pass `vexBetterAuth(authConfig)`.
   * Vex requires auth configuration to generate the schema.
   */
  auth: VexAuthAdapter;
  /**
   * Schema generation configuration.
   */
  schema?: SchemaConfigInput;
  /**
   * Media collection configuration.
   * Requires a storage adapter when collections are provided.
   */
  media?: MediaConfigInput;
  /**
   * RBAC access permissions configuration.
   * Created with `defineAccess()` or defined inline.
   *
   * If not set, the admin panel allows all actions on all fields (permissive default).
   */
  access?: VexAccessConfig;
  /**
   * Global rich text editor adapter.
   * Used as the default editor for all richtext fields.
   * Pass `plateEditor()` from `@vexcms/richtext/editor`.
   */
  editor?: VexEditorAdapter;
}
