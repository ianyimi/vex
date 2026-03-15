/**
 * System field names injected into versioned collection schemas.
 * These are excluded from user-editable fields and version snapshots.
 */
export const VERSION_SYSTEM_FIELDS = [
  "vex_status",
  "vex_version",
  "vex_publishedAt",
] as const;

/**
 * All system fields (Convex built-in + versioning) to strip when
 * extracting user content from a document.
 */
export const ALL_SYSTEM_FIELDS = new Set([
  "_id",
  "_creationTime",
  ...VERSION_SYSTEM_FIELDS,
]);

/**
 * Default max versions to keep per document.
 */
export const DEFAULT_MAX_VERSIONS_PER_DOC = 100;

/**
 * Default autosave interval in milliseconds.
 */
export const DEFAULT_AUTOSAVE_INTERVAL = 2000;
