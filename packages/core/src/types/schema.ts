/** Schema generation configuration. */
export interface SchemaConfig {
  /**
   * Output path for the generated schema file, relative to project root.
   *
   * Default: `"convex/vex.schema.ts"`
   */
  outputPath: string;
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
}
