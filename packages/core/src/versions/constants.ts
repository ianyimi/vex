/**
 * System field keys written onto the main table row of a versioned
 * collection (and `vex_globals`, when any registered global declares
 * `versions.drafts: true`). Present only when `versions.drafts: true` — a
 * non-versioned collection's table never has these.
 *
 * The single source of truth for these three slugs. Consumers read `.slug`:
 * `extractUserFields`' strip set, `versionFieldsToVexSchema`'s emitted
 * columns and indexes, `findDraftRow`'s index lookup, and `defineCollection`'s
 * reserved-name guard (which unions {@link VersionSystemField} with
 * `ReservedCollectionFieldKey` at its own call site rather than duplicating
 * these entries into `COLLECTION_SYSTEM_FIELDS`, whose type also keys
 * `CollectionConfig.fields` — and these are columns, never `fields` entries).
 */
export const VERSION_SYSTEM_FIELDS = {
  status: {
    slug: "vex_status",
  },
  publishedAt: {
    slug: "vex_publishedAt",
  },
  publishedId: {
    slug: "vex_publishedId",
  },
} as const;
/**
 * Version system field slug, derived from {@link VERSION_SYSTEM_FIELDS}.
 * Resolves to `"vex_status" | "vex_publishedAt" | "vex_publishedId"`.
 */
export type VersionSystemField =
  (typeof VERSION_SYSTEM_FIELDS)[keyof typeof VERSION_SYSTEM_FIELDS]["slug"];

/**
 * Version Statuses enum
 */
export const VERSION_STATUSES = {
  draft: {
    key: "draft",
    labels: {
      singular: "Draft",
      plural: "Drafts",
    },
  },
  published: {
    key: "published",
    labels: {
      singular: "Published",
      plural: "Published",
    },
  },
} as const;
/**
 * Publish-state values a versioned document (or global) can carry —
 * `vex_status`'s two literal values. Shared by `StatusBadge`
 * (`@vexcms/react`), `InputComponentProps.documentStatus` (`fields/types.ts`,
 * Step 12), and anywhere else a caller needs to name this union — defined
 * once here rather than redeclared per-package, since `@vexcms/react`
 * depends on `@vexcms/core` and never the reverse.
 */
export type VexVersionStatus = (typeof VERSION_STATUSES)[keyof typeof VERSION_STATUSES]["key"];

/**
 * Default debounce window, in milliseconds, before `useAutosave` (Step 14)
 * writes a changed draft row. Applied whenever a collection or global
 * declares `versions.autosave: true`.
 *
 * No companion max-versions-per-document default — decision 3 of this spec
 * ships unbounded version history; there is no automatic pruning to default.
 */
export const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1000 as const;
