import { AnyVexCollection } from "./collections";
import { VexGlobal } from "./globals";
import type { VexAuthAdapter } from "./auth";
import { AdminConfig, AdminConfigInput } from "./admin";
import { SchemaConfig, SchemaConfigInput } from "./schema";
import type { MediaConfig, MediaConfigInput, ClientMediaConfig } from "./media";

export * from "./fields";
export * from "./collections";
export * from "./globals";
export * from "./auth";
export * from "./admin";
export * from "./schema";
export * from "./media";

// =============================================================================
// CONFIG TYPES
// =============================================================================

/** Resolved Vex CMS configuration */
export interface VexConfig {
  /** Base URL path for the admin panel */
  basePath: string;
  /** Array of collection definitions */
  collections: AnyVexCollection[];
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
  collections: AnyVexCollection[];
  globals: VexGlobal[];
  admin: AdminConfig;
  auth: VexAuthAdapter;
  schema: SchemaConfig;
  media?: ClientMediaConfig;
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
   * Array of collection definitions created with `defineCollection`.
   *
   * Default: []
   */
  collections?: AnyVexCollection[];
  /**
   * Array of global definitions created with `defineCollection`.
   *
   * Default: []
   */
  globals?: VexGlobal<any>[];
  /**
   * Admin panel configuration.
   *
   * Default:
   * ```
   * user: "users"
   * meta:
   *   titleSuffix: "| Admin"
   *   favicon:     "/favicon.ico"
   * sidebar:
   *   hideGlobals: false
   * ```
   */
  admin?: AdminConfigInput;
  /**
   * Auth adapter — **required**. Pass `vexBetterAuth(authConfig)`.
   * Vex requires auth configuration to generate the schema.
   */
  auth: VexAuthAdapter;
  /**
   * Schema generation configuration.
   *
   * Default:
   * ```
   * outputPath: "convex/vex.schema.ts"
   * ```
   */
  schema?: SchemaConfigInput;
  /**
   * Media collection configuration.
   * Requires a storage adapter when collections are provided.
   */
  media?: MediaConfigInput;
}
