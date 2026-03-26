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
export type {
  LivePreviewConfig,
  LivePreviewBreakpoint,
  AdminLivePreviewConfig,
} from "./livePreview";

/**
 * Responsive breakpoint configuration for block style controls.
 * Keys are breakpoint names (used as Tailwind prefixes), values are min-width in pixels.
 *
 * @example
 * ```ts
 * breakpoints: {
 *   sm: 640,
 *   md: 768,
 *   lg: 1024,
 *   xl: 1280,
 * }
 * ```
 */
export type BreakpointConfig = Record<string, number>;

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
  /** Responsive breakpoints for block style controls. If not set, styles apply to all viewports. */
  breakpoints?: BreakpointConfig;
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
  /** Responsive breakpoints for block style controls. If not set, styles apply to all viewports. */
  breakpoints?: BreakpointConfig;
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
  /**
   * Responsive breakpoints for block style controls.
   * Keys are Tailwind prefix names, values are min-width in pixels.
   * If not set, block styles apply to all viewports (no breakpoint tabs).
   */
  breakpoints?: BreakpointConfig;
  /**
   * Plugins to apply to the config. Each plugin is a function that receives
   * the config input and returns a modified config input. Plugins run
   * sequentially before the config is resolved.
   *
   * @example
   * ```ts
   * export default defineConfig({
   *   plugins: [
   *     seoPlugin({ collections: ["pages"] }),
   *   ],
   *   collections: [pages],
   * })
   * ```
   */
  plugins?: VexPlugin[];
}

/**
 * A Vex plugin is a function that transforms the config input.
 * Plugins receive the config (with all previous plugins applied)
 * and return a modified config. Use a curried function for options:
 *
 * @example
 * ```ts
 * export const myPlugin = (opts: MyOpts): VexPlugin =>
 *   (config) => ({
 *     ...config,
 *     collections: [...(config.collections ?? []), myCollection],
 *   })
 * ```
 */
export type VexPlugin = (config: VexConfigInput) => VexConfigInput;
