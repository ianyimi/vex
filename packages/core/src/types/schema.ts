/** Schema generation configuration. */
export interface SchemaConfig {
  /**
   * Output path for the generated schema file, relative to project root.
   *
   * Default: `"convex/vex.schema.ts"`
   */
  outputPath: string;
  /**
   * Output path for the generated TypeScript types file, relative to project root.
   * Contains typed interfaces for all collections, blocks, and globals.
   *
   * Default: `"convex/vex.types.ts"`
   */
  typesOutputPath: string;
  /**
   * Automatically backfill existing documents when a new required field
   * with a `defaultValue` is added.
   *
   * Default: `true`
   */
  autoMigrate: boolean;
  /**
   * Automatically remove table entries from `schema.ts` when collections
   * or globals are removed from `vex.config.ts`.
   *
   * Only removes simple entries (bare `exportName,` lines). Entries using
   * `extendTable()`, constant keys, or other custom patterns are left
   * untouched with a warning.
   *
   * Default: `false`
   */
  autoRemove: boolean;
}

/** Schema generation configuration input (all fields optional). */
export interface SchemaConfigInput {
  /**
   * Output path for the generated schema file, relative to project root.
   * Can change the filename (e.g., `"convex/generated-schema.ts"`) or
   * the directory (e.g., `"src/convex/vex.schema.ts"`).
   *
   * Default: `"convex/vex.schema.ts"`
   */
  outputPath?: string;
  /**
   * Output path for the generated TypeScript types file, relative to project root.
   * Contains typed interfaces for all collections, blocks, and globals.
   *
   * Default: `"convex/vex.types.ts"`
   */
  typesOutputPath?: string;
  /**
   * Automatically backfill existing documents when a new required field
   * with a `defaultValue` is added.
   *
   * Default: `true`
   */
  autoMigrate?: boolean;
  /**
   * Automatically remove table entries from `schema.ts` when collections
   * or globals are removed from `vex.config.ts`.
   *
   * Only removes simple entries (bare `exportName,` lines). Entries using
   * `extendTable()`, constant keys, or other custom patterns are left
   * untouched with a warning.
   *
   * Default: `false`
   */
  autoRemove?: boolean;
}
