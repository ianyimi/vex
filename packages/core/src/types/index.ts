import { VexCollection } from "./collections";
import { VexGlobal } from "./globals";
import type { VexAuthAdapter } from "./auth";
import { AdminConfig, AdminConfigInput } from "./admin";
import { SchemaConfig, SchemaConfigInput } from "./schema";

export * from "./fields";
export * from "./collections";
export * from "./globals";
export * from "./auth";
export * from "./admin";
export * from "./schema";

// =============================================================================
// CONFIG TYPES
// =============================================================================

/** Resolved Vex CMS configuration */
export interface VexConfig {
  /** Base URL path for the admin panel */
  basePath: string;
  /** Array of collection definitions */
  collections: VexCollection<any>[];
  /** Array of global definitions */
  globals: VexGlobal<any>[];
  /** Admin panel configuration */
  admin: AdminConfig;
  /** Auth adapter — required. Use `vexBetterAuth(authConfig)` to create. */
  auth: VexAuthAdapter;
  /** Schema generation config */
  schema: SchemaConfig;
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
  collections?: VexCollection<any>[];
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
}
