import { VexCollection } from "./collections";
import { VexGlobal } from "./globals";

export * from "./fields";
export * from "./collections";
export * from "./globals";

// =============================================================================
// CONFIG TYPES
// =============================================================================

/** Resolved admin panel configuration */
export interface AdminConfig {
  /** Collection slug used for user authentication */
  user: string;
  /** Page metadata */
  meta: {
    /** Suffix appended to the page title in the browser tab */
    titleSuffix: string;
    /** Path to the favicon for the admin panel */
    favicon: string;
  };
  /** Sidebar navigation configuration */
  sidebar: {
    /** Whether global collections are hidden from the sidebar */
    hideGlobals: boolean;
  };
}

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
}

// =============================================================================
// CONFIG INPUT TYPES (used by defineConfig — all fields optional with defaults)
// =============================================================================

/**
 * Admin page metadata configuration.
 *
 * Default:
 * ```
 * titleSuffix: "| Admin"
 * favicon:     "/favicon.ico"
 * ```
 */
export interface AdminMetaInput {
  /**
   * Suffix appended to the page title in the browser tab.
   *
   * Default: `"| Admin"`
   */
  titleSuffix?: string;
  /**
   * Path to the favicon for the admin panel.
   *
   * Default: `"/favicon.ico"`
   */
  favicon?: string;
}

/**
 * Admin sidebar configuration.
 *
 * Default:
 * ```
 * hideGlobals: false
 * ```
 */
export interface AdminSidebarInput {
  /**
   * Hide global collections from the sidebar navigation.
   *
   * Default: `false`
   */
  hideGlobals?: boolean;
}

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
export interface AdminConfigInput {
  /**
   * Collection slug to use for user authentication.
   *
   * Default: `"users"`
   */
  user?: string;
  /**
   * Admin page metadata configuration.
   *
   * Default:
   * ```
   * titleSuffix: "| Admin"
   * favicon:     "/favicon.ico"
   * ```
   */
  meta?: AdminMetaInput;
  /**
   * Sidebar navigation configuration.
   *
   * Default:
   * ```
   * hideGlobals: false
   * ```
   */
  sidebar?: AdminSidebarInput;
}

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
}
