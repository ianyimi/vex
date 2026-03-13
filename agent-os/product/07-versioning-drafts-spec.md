# 07 — Versioning & Drafts

## Overview

Adds per-collection versioning and draft/publish workflow to VEX CMS. When `versions: { drafts: true }` is set on a collection, the admin panel replaces the "Save" button with "Save Draft" + "Publish" controls. All saves create version records in a shared `vex_versions` table. The main collection table holds published content (or a draft placeholder until first publish). Autosave coalesces into a single version record to prevent bloat. A version history dropdown allows restoring any previous version.

## Design Decisions

1. **Payload-style architecture** — main collection table = published state. All drafts/versions stored in `vex_versions` table. Admin edit view reads from `vex_versions` for draft content. Convex reactivity provides live updates for free.
2. **`_status` field on main table** — versioned collections get `_status: "draft" | "published"` on the main document. New docs start as `"draft"`. On publish, `_status` flips to `"published"` and fields are populated from the version snapshot. Frontend queries should filter `_status === "published"`.
3. **Version fields only when enabled** — `_status`, `_version`, `_publishedAt` fields are only injected into schema when `versions.drafts` is `true`. No unused fields on non-versioned collections. Versioning is NOT available on media collections — only on user collections (including auth-merged collections like `users`).
4. **Separate mutations** — new `saveDraft`, `publish`, `unpublish`, `autosave`, `restoreVersion` mutations alongside existing unchanged CRUD mutations.
5. **Autosave coalesces** — finds the latest autosave version and updates it in-place rather than creating new records per tick.
6. **Published versions are marked** — each version record tracks whether it was the snapshot that got published, so the restore dropdown can show which versions were live.
7. **New docs start as draft** — creating a document in a versioned collection inserts a main table row with `_status: "draft"` and creates an initial version. Must publish to go live.
8. **Version diffs deferred** — since each version stores a full snapshot, diffs can be computed at read time in a future spec (enterprise branching). No extra storage needed now.

## Out of Scope

- Drafts-specific RBAC actions (`readDrafts`, `saveDraft` permissions)
- Scheduled publishing / unpublishing
- Live preview component (Spec 10)
- Query helpers/wrappers for `draft: true` parameter on user queries
- Version diff/comparison UI
- Branching / environments (enterprise)
- `_environment` field on collections
- Globals versioning (follow-up spec)

## Target Directory Structure

```
packages/core/src/
├── types/
│   └── collections.ts              # MODIFIED — add VersionsConfig, version fields to VexCollection
├── valueTypes/
│   └── generate.ts                 # MODIFIED — inject version fields + vex_versions table
├── versioning/
│   ├── index.ts                    # NEW — re-exports
│   ├── extractUserFields.ts        # NEW — strip system fields from document
│   ├── extractUserFields.test.ts   # NEW — tests
│   └── constants.ts                # NEW — VERSION_SYSTEM_FIELDS constant
├── columns/
│   └── generateColumns.ts          # MODIFIED — inject _status column for versioned collections

packages/admin-next/src/
├── views/
│   └── CollectionEditView.tsx      # MODIFIED — draft/publish buttons, read from versions
├── components/
│   ├── VersionHistoryDropdown.tsx   # NEW — dropdown showing versions with restore
│   └── StatusBadge.tsx             # NEW — draft/published badge

apps/test-app/convex/vex/
├── versions.ts                     # NEW — Convex query/mutation handlers
├── model/
│   └── versions.ts                 # NEW — version model functions
```

## Implementation Order

1. **Step 1: Types & constants** — `VersionsConfig` type, version system field constants, `extractUserFields` utility + tests. After this: `pnpm build` and `pnpm test` pass.
2. **Step 2: Schema generation** — inject `_status`/`_version`/`_publishedAt` fields and `vex_versions` table for versioned collections + tests. After this: schema generation includes version fields.
3. **Step 3: Version model functions** — `createVersion`, `getLatestVersion`, `getDocumentForEdit`, `cleanupOldVersions`, `coalesceAutosave` in test-app's `model/versions.ts`. After this: version CRUD logic exists.
4. **Step 4: Convex handlers** — `saveDraft`, `publish`, `unpublish`, `autosave`, `restoreVersion`, `listVersions`, `getDocumentForEdit` handlers in `versions.ts`. After this: full mutation/query API works.
5. **Step 5: Admin UI — StatusBadge + list view** — status badge component, inject `_status` column into list view for versioned collections. After this: list view shows draft/published status.
6. **Step 6: Admin UI — CollectionEditView** — replace Save with Save Draft + Publish + Unpublish buttons for versioned collections. Version history dropdown. Autosave hook. After this: full admin workflow works.
7. **Step 7: Test-app wiring** — enable `versions: { drafts: true }` on articles collection, verify full flow. After this: end-to-end versioning works.

---

## Step 1: Types, Constants & extractUserFields

- [ ] Modify `packages/core/src/types/collections.ts` — add `VersionsConfig` and `versions` field to `VexCollection`
- [ ] Modify `packages/core/src/config/defineCollection.ts` — add `versions` to props
- [ ] Create `packages/core/src/versioning/constants.ts`
- [ ] Create `packages/core/src/versioning/extractUserFields.ts`
- [ ] Create `packages/core/src/versioning/extractUserFields.test.ts`
- [ ] Create `packages/core/src/versioning/index.ts`
- [ ] Update `packages/core/src/index.ts` to re-export versioning
- [ ] Run `pnpm build` and `pnpm --filter @vexcms/core test`

### File: `packages/core/src/types/collections.ts`

Add `VersionsConfig` interface and `versions` field to `VexCollection`. Add after `CollectionAdminConfig`:

```typescript
/**
 * Configuration for versioning and draft/publish workflow on a collection.
 * When `drafts` is enabled, the admin panel shows Save Draft + Publish
 * instead of a simple Save button.
 */
export interface VersionsConfig {
  /**
   * Enable the draft/publish workflow.
   * When true, new documents start as drafts and must be explicitly published.
   * The schema gets `_status`, `_version`, and `_publishedAt` fields injected.
   *
   * Default: `false`
   */
  drafts?: boolean;

  /**
   * Enable autosave. Requires `drafts: true`.
   * When `true`, uses a default 2000ms interval.
   * When an object, specify a custom interval.
   *
   * Default: `false`
   */
  autosave?: boolean | {
    /** Interval in milliseconds between autosaves. Default: 2000 */
    interval: number;
  };

  /**
   * Maximum number of versions to keep per document.
   * Oldest non-published versions are deleted when exceeded.
   * `0` means unlimited.
   *
   * Default: `100`
   */
  maxPerDoc?: number;
}
```

Add to `VexCollection` interface, after `searchIndexes`:

```typescript
  /**
   * Versioning and draft/publish workflow configuration.
   * When `versions.drafts` is `true`, the collection gets draft/publish
   * workflow in the admin panel and version history tracking.
   *
   * Only available on user collections (including auth-merged collections).
   * NOT available on media collections — use VexMediaCollection for those.
   */
  versions?: VersionsConfig;
```

**Do NOT add `versions` to `VexMediaCollection`.** Media collections use the existing save flow and don't support draft/publish workflow.

### File: `packages/core/src/config/defineCollection.ts`

Add `versions` to the props type and pass it through:

```typescript
// Add to the props parameter of defineCollection:
  versions?: VersionsConfig;

// Update the destructure line to NOT strip versions:
  const { auth: _auth, ...rest } = props;
  // (versions is already included in ...rest since we only strip auth)
```

Import `VersionsConfig` from the types.

### File: `packages/core/src/versioning/constants.ts`

Constants for version system fields that get injected into versioned collection schemas.

```typescript
/**
 * System field names injected into versioned collection schemas.
 * These are excluded from user-editable fields and version snapshots.
 */
export const VERSION_SYSTEM_FIELDS = [
  "_status",
  "_version",
  "_publishedAt",
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
```

### File: `packages/core/src/versioning/extractUserFields.ts`

Strips system fields from a document, returning only user-defined content for version snapshots.

```typescript
import { ALL_SYSTEM_FIELDS } from "./constants";

/**
 * Extracts user-defined fields from a document, stripping all
 * system fields (_id, _creationTime, _status, _version, _publishedAt).
 *
 * Used to create version snapshots that contain only content fields.
 *
 * @param props.document - The full document including system fields
 * @returns A new object with only user-defined fields
 */
export function extractUserFields(props: {
  document: Record<string, unknown>;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props.document)) {
    if (!ALL_SYSTEM_FIELDS.has(key)) {
      result[key] = value;
    }
  }
  return result;
}
```

### File: `packages/core/src/versioning/extractUserFields.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { extractUserFields } from "./extractUserFields";

describe("extractUserFields", () => {
  it("strips _id and _creationTime", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        title: "Hello",
        body: "World",
      },
    });
    expect(result).toEqual({ title: "Hello", body: "World" });
  });

  it("strips version system fields", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        _status: "published",
        _version: 3,
        _publishedAt: 1234567890,
        title: "Hello",
        slug: "hello",
      },
    });
    expect(result).toEqual({ title: "Hello", slug: "hello" });
  });

  it("returns empty object when only system fields present", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        _status: "draft",
        _version: 1,
        _publishedAt: null,
      },
    });
    expect(result).toEqual({});
  });

  it("preserves fields with underscore prefix that are not system fields", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        _customField: "keep me",
        title: "Hello",
      },
    });
    expect(result).toEqual({ _customField: "keep me", title: "Hello" });
  });

  it("preserves null and undefined values in user fields", () => {
    const result = extractUserFields({
      document: {
        _id: "abc123",
        _creationTime: 1234567890,
        title: "Hello",
        subtitle: null,
        tags: undefined,
      },
    });
    expect(result).toEqual({ title: "Hello", subtitle: null, tags: undefined });
  });
});
```

### File: `packages/core/src/versioning/index.ts`

```typescript
export { extractUserFields } from "./extractUserFields";
export {
  VERSION_SYSTEM_FIELDS,
  ALL_SYSTEM_FIELDS,
  DEFAULT_MAX_VERSIONS_PER_DOC,
  DEFAULT_AUTOSAVE_INTERVAL,
} from "./constants";
```

### Update: `packages/core/src/index.ts`

Add to the existing exports:

```typescript
export * from "./versioning";
```

---

## Step 2: Schema Generation — Version Fields & vex_versions Table

- [ ] Modify `packages/core/src/valueTypes/generate.ts` — inject version fields for versioned collections + generate `vex_versions` table
- [ ] Create `packages/core/src/valueTypes/generate.versioning.test.ts` (or add to existing test file)
- [ ] Run `pnpm build` and `pnpm --filter @vexcms/core test`

### File: `packages/core/src/valueTypes/generate.ts`

Three modifications to `generateVexSchema()`:

**Where version fields get injected:**

The `for (const collection of config.collections)` loop (lines 42-117) handles ALL user collections — including ones merged with auth collections (e.g., `users`). This is the only injection point needed because:
- Auth-merged collections (like `users`) go through this loop (the auth fields get merged in, but the collection object is still the user's `VexCollection` with `versions` config)
- Unmerged auth tables (`session`, `account`, etc.) are `VexAuthCollection` types — they don't have `versions` config and are generated separately
- Media collections are generated in a separate loop and do NOT support `versions`

**1. After pushing all field lines and BEFORE pushing the closing `})` (line 103), inject version fields when enabled:**

```typescript
// After line 102: for (const f of fields) { lines.push(...) }
// Before line 103: lines.push("})")

if (collection.versions?.drafts) {
  lines.push(`  _status: v.union(v.literal("draft"), v.literal("published")),`);
  lines.push(`  _version: v.number(),`);
  lines.push(`  _publishedAt: v.optional(v.number()),`);
}

lines.push("})");
```

**2. After the existing index generation for this collection (after line 116), add `by_status` index automatically:**

```typescript
// After existing index and searchIndex generation for this collection:
if (collection.versions?.drafts) {
  const hasStatusIndex = indexes.some((i) => i.name === "by_status");
  if (!hasStatusIndex) {
    lines.push(`  .index("by_status", ["_status"])`);
  }
}
```

**3. At the end of the function (before the final `return`), generate the `vex_versions` system table if ANY user collection has versioning enabled:**

```typescript
// Check if any user collection uses versioning (media collections excluded)
const hasVersioning = config.collections.some((c) => c.versions?.drafts);

if (hasVersioning) {
  lines.push("", "/**", " * VEX SYSTEM TABLES", " **/");
  lines.push("");
  lines.push("export const vex_versions = defineTable({");
  lines.push("  collection: v.string(),");
  lines.push("  documentId: v.string(),");
  lines.push("  version: v.number(),");
  lines.push(`  status: v.union(v.literal("draft"), v.literal("published"), v.literal("autosave")),`);
  lines.push("  snapshot: v.any(),");
  lines.push("  createdAt: v.number(),");
  lines.push("  createdBy: v.optional(v.string()),");
  lines.push("  isAutosave: v.boolean(),");
  lines.push("})");
  lines.push(`  .index("by_document", ["collection", "documentId"])`);
  lines.push(`  .index("by_document_version", ["collection", "documentId", "version"])`);
  lines.push(`  .index("by_document_latest", ["collection", "documentId", "createdAt"])`);
  lines.push(`  .index("by_document_status", ["collection", "documentId", "status"])`);
  lines.push(`  .index("by_autosave", ["collection", "documentId", "isAutosave"])`);
}
```

### File: `packages/core/src/valueTypes/generate.versioning.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { generateVexSchema } from "./generate";
import type { VexConfig } from "../types";

/** Minimal config factory for versioning tests */
function makeConfig(overrides: Partial<VexConfig> = {}): VexConfig {
  return {
    basePath: "/admin",
    collections: [],
    globals: [],
    admin: { meta: {}, sidebar: {}, user: undefined },
    auth: { collections: [], type: "betterAuth" as any } as any,
    schema: { output: "convex/vex.schema.ts" },
    ...overrides,
  };
}

describe("generateVexSchema — versioning", () => {
  it("injects _status, _version, _publishedAt for versioned collection", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "articles",
          fields: {
            title: { type: "text" } as any,
          },
          versions: { drafts: true },
        },
      ],
    });

    const output = generateVexSchema({ config });

    expect(output).toContain('_status: v.union(v.literal("draft"), v.literal("published"))');
    expect(output).toContain("_version: v.number()");
    expect(output).toContain("_publishedAt: v.optional(v.number())");
  });

  it("does NOT inject version fields for non-versioned collection", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "categories",
          fields: {
            name: { type: "text" } as any,
          },
        },
      ],
    });

    const output = generateVexSchema({ config });

    expect(output).not.toContain("_status");
    expect(output).not.toContain("_version");
    expect(output).not.toContain("_publishedAt");
  });

  it("adds by_status index for versioned collection", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "posts",
          fields: {
            title: { type: "text" } as any,
          },
          versions: { drafts: true },
        },
      ],
    });

    const output = generateVexSchema({ config });

    expect(output).toContain('.index("by_status", ["_status"])');
  });

  it("generates vex_versions table when any collection is versioned", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "posts",
          fields: { title: { type: "text" } as any },
          versions: { drafts: true },
        },
        {
          slug: "categories",
          fields: { name: { type: "text" } as any },
        },
      ],
    });

    const output = generateVexSchema({ config });

    expect(output).toContain("export const vex_versions = defineTable({");
    expect(output).toContain("collection: v.string()");
    expect(output).toContain("documentId: v.string()");
    expect(output).toContain("version: v.number()");
    expect(output).toContain("snapshot: v.any()");
    expect(output).toContain("isAutosave: v.boolean()");
    expect(output).toContain('.index("by_document", ["collection", "documentId"])');
    expect(output).toContain('.index("by_document_version", ["collection", "documentId", "version"])');
    expect(output).toContain('.index("by_autosave", ["collection", "documentId", "isAutosave"])');
  });

  it("does NOT generate vex_versions table when no collection is versioned", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "categories",
          fields: { name: { type: "text" } as any },
        },
      ],
    });

    const output = generateVexSchema({ config });

    expect(output).not.toContain("vex_versions");
  });

  it("does not duplicate by_status index if user defines one", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "posts",
          fields: { title: { type: "text" } as any },
          versions: { drafts: true },
          indexes: [{ name: "by_status", fields: ["_status"] }],
        },
      ],
    });

    const output = generateVexSchema({ config });

    // Count occurrences of by_status — should be exactly 1
    const matches = output.match(/by_status/g);
    expect(matches?.length).toBe(1);
  });
});
```

---

## Step 3: Version Model Functions

- [ ] Create `apps/test-app/convex/vex/model/versions.ts`
- [ ] Verify `pnpm build` succeeds in test-app

### File: `apps/test-app/convex/vex/model/versions.ts`

All version data operations. These are called by the Convex handlers in Step 4.

```typescript
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server"

import { ConvexError } from "convex/values"

/**
 * Status values for version records.
 * - "draft": a saved draft
 * - "published": this snapshot was published to the main document
 * - "autosave": an autosave version (coalesced in-place)
 */
export type VersionStatus = "draft" | "published" | "autosave"

/**
 * Gets the next version number for a document.
 *
 * @param props.ctx - Convex query context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID in the main collection
 * @returns The next version number (1-based)
 */
export async function getNextVersionNumber<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
}): Promise<number> {
  // TODO: implement
  //
  // 1. Query vex_versions with index "by_document_latest"
  //    where collection === props.collection AND documentId === props.documentId
  //    → order desc by createdAt
  //    → take first
  //
  // 2. If a version exists, return version.version + 1
  //    If no version exists, return 1
  //
  // Edge cases:
  // - First version for a document: return 1
  // - Concurrent creates: Convex handles serialization, no race condition
  throw new Error("Not implemented")
}

/**
 * Creates a new version record in the vex_versions table.
 *
 * @param props.ctx - Convex mutation context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID in the main collection
 * @param props.snapshot - Full user-field snapshot
 * @param props.status - Version status (draft, published, autosave)
 * @param props.createdBy - User ID or email of the creator
 * @returns The created version's ID and version number
 */
export async function createVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  collection: string
  documentId: string
  snapshot: Record<string, unknown>
  status: VersionStatus
  createdBy: string | null
}): Promise<{ versionId: string; version: number }> {
  // TODO: implement
  //
  // 1. Call getNextVersionNumber to get the next version number
  //
  // 2. Insert into vex_versions table:
  //    {
  //      collection: props.collection,
  //      documentId: props.documentId,
  //      version: nextVersion,
  //      status: props.status,
  //      snapshot: props.snapshot,
  //      createdAt: Date.now(),
  //      createdBy: props.createdBy,
  //      isAutosave: props.status === "autosave",
  //    }
  //
  // 3. Return { versionId: inserted ID, version: nextVersion }
  throw new Error("Not implemented")
}

/**
 * Gets the latest version for a document (any status).
 * Used by the admin edit view to load the most recent content.
 *
 * @param props.ctx - Convex query context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID in the main collection
 * @returns The latest version record or null
 */
export async function getLatestVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
}): Promise<Record<string, unknown> | null> {
  // TODO: implement
  //
  // 1. Query vex_versions with index "by_document_latest"
  //    where collection === props.collection AND documentId === props.documentId
  //    → order desc (newest first)
  //    → take first
  //
  // 2. Return the version record or null
  throw new Error("Not implemented")
}

/**
 * Gets the latest version with status "published" for a document.
 * Used to find the content that was last published.
 *
 * @param props.ctx - Convex query context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID in the main collection
 * @returns The latest published version record or null
 */
export async function getLatestPublishedVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
}): Promise<Record<string, unknown> | null> {
  // TODO: implement
  //
  // 1. Query vex_versions with index "by_document_status"
  //    where collection === props.collection
  //    AND documentId === props.documentId
  //    AND status === "published"
  //    → order desc
  //    → take first
  //
  // 2. Return the version record or null
  throw new Error("Not implemented")
}

/**
 * Lists all versions for a document, ordered newest first.
 * Excludes autosave versions from the list.
 *
 * @param props.ctx - Convex query context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID in the main collection
 * @param props.limit - Max number of versions to return (default: 50)
 * @returns Array of version records (without full snapshot for list performance)
 */
export async function listVersions<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
  limit?: number
}): Promise<Record<string, unknown>[]> {
  // TODO: implement
  //
  // 1. Query vex_versions with index "by_document_latest"
  //    where collection === props.collection AND documentId === props.documentId
  //    → order desc (newest first)
  //    → take(props.limit ?? 50)
  //
  // 2. Filter out versions with isAutosave === true
  //
  // 3. Map results to exclude the full snapshot (return only metadata):
  //    { _id, version, status, createdAt, createdBy, isAutosave }
  //
  // Edge cases:
  // - No versions exist: return []
  // - All versions are autosave: return []
  throw new Error("Not implemented")
}

/**
 * Gets a specific version by version number.
 * Includes the full snapshot for restore preview.
 *
 * @param props.ctx - Convex query context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID in the main collection
 * @param props.version - Version number to retrieve
 * @returns Full version record including snapshot, or null
 */
export async function getVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
  version: number
}): Promise<Record<string, unknown> | null> {
  // TODO: implement
  //
  // 1. Query vex_versions with index "by_document_version"
  //    where collection === props.collection
  //    AND documentId === props.documentId
  //    AND version === props.version
  //    → take first
  //
  // 2. Return the full version record or null
  //
  // Edge cases:
  // - Version number doesn't exist: return null
  throw new Error("Not implemented")
}

/**
 * Finds the latest autosave version for a document and updates it in-place.
 * If no autosave exists, creates a new one.
 * This prevents autosave from creating excessive version records.
 *
 * @param props.ctx - Convex mutation context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID in the main collection
 * @param props.snapshot - Updated field snapshot
 * @param props.createdBy - User ID or email
 * @returns The version ID and version number
 */
export async function coalesceAutosave<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  collection: string
  documentId: string
  snapshot: Record<string, unknown>
  createdBy: string | null
}): Promise<{ versionId: string; version: number }> {
  // TODO: implement
  //
  // 1. Query vex_versions with index "by_autosave"
  //    where collection === props.collection
  //    AND documentId === props.documentId
  //    AND isAutosave === true
  //    → order desc
  //    → take first
  //
  // 2. If an autosave version exists:
  //    a. Patch it with { snapshot: props.snapshot, createdAt: Date.now() }
  //    b. Return { versionId: existing._id, version: existing.version }
  //
  // 3. If no autosave version exists:
  //    a. Call createVersion with status: "autosave"
  //    b. Return the result
  //
  // Edge cases:
  // - Autosave exists from before an explicit save: still update it
  //   (the explicit save created a "draft" version, not "autosave")
  throw new Error("Not implemented")
}

/**
 * Cleans up old versions exceeding the maxPerDoc limit.
 * Preserves all published versions regardless of limit.
 * Never deletes the most recent version.
 *
 * @param props.ctx - Convex mutation context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID in the main collection
 * @param props.maxPerDoc - Maximum versions to keep (0 = unlimited)
 */
export async function cleanupOldVersions<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  collection: string
  documentId: string
  maxPerDoc: number
}): Promise<void> {
  // TODO: implement
  //
  // 1. If maxPerDoc === 0, return early (unlimited)
  //
  // 2. Query ALL versions for this document, ordered by version desc
  //    (newest first)
  //
  // 3. Separate into: keep list and delete candidates
  //    - Always keep the first `maxPerDoc` versions (newest)
  //    - Always keep any version with status === "published"
  //    - Everything else is a delete candidate
  //
  // 4. Delete the candidates via ctx.db.delete()
  //
  // Edge cases:
  // - Fewer versions than maxPerDoc: nothing to delete
  // - All versions are published: keep all
  // - maxPerDoc === 1: keep only the newest + any published
  throw new Error("Not implemented")
}
```

---

## Step 4: Convex Handlers

- [ ] Create `apps/test-app/convex/vex/versions.ts`
- [ ] Verify `pnpm build` succeeds in test-app (after schema is regenerated with versioning)

### File: `apps/test-app/convex/vex/versions.ts`

Convex query and mutation handlers for the versioning system.

```typescript
import type { DataModel } from "@convex/_generated/dataModel"
import type { GenericQueryCtx, TableNamesInDataModel } from "convex/server"

import { mutation, query } from "@convex/_generated/server"
import {
  findCollectionBySlug,
  hasPermission,
  extractUserFields,
  DEFAULT_MAX_VERSIONS_PER_DOC,
} from "@vexcms/core"
import { ConvexError, v } from "convex/values"

import { TABLE_SLUG_USERS } from "~/db/constants"

import config from "../../vex.config"
import { access } from "../../src/vexcms/access"
import * as Versions from "./model/versions"

function requireVersionedCollection(slug: string) {
  const collections = [...config.collections, ...(config.media?.collections ?? [])]
  const match = collections.find((c) => c.slug === slug)
  if (!match) {
    throw new ConvexError(`Collection not found: ${slug}`)
  }
  if (!match.versions?.drafts) {
    throw new ConvexError(`Collection "${slug}" does not have versioning enabled`)
  }
  return match
}

async function getUser(ctx: GenericQueryCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity?.email) return null
  const user = await ctx.db
    .query(TABLE_SLUG_USERS)
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first()
  if (!user) return null
  return {
    user: user as Record<string, unknown>,
    roles: (user.role as string[]) ?? [],
    email: identity.email,
  }
}

async function requireUser(ctx: GenericQueryCtx<DataModel>) {
  const result = await getUser(ctx)
  if (!result) throw new ConvexError("Not authenticated")
  return result
}

function checkPermission(props: Parameters<typeof hasPermission>[0]) {
  const result = hasPermission(props)
  const denied =
    result === false ||
    (typeof result === "object" && !Object.values(result).some(Boolean))
  if (denied) {
    throw new ConvexError(`Access denied: "${props.action}" on "${props.resource}"`)
  }
  return result
}

/**
 * Creates a new document in a versioned collection.
 * The document starts with _status: "draft" and an initial version is created.
 */
export const createDraftDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    // TODO: implement
    //
    // 1. Call requireVersionedCollection(collectionSlug) to validate
    //
    // 2. Call requireUser(ctx) and checkPermission for "create" action
    //
    // 3. Validate fields via generateFormSchema (import from @vexcms/core)
    //    → Use .partial() since drafts skip required field validation
    //
    // 4. Insert into main collection table with:
    //    { ...validatedFields, _status: "draft", _version: 1, _publishedAt: undefined }
    //    → This creates the stable document ID
    //
    // 5. Create initial version via Versions.createVersion({
    //      ctx, collection: collectionSlug, documentId: newDocId,
    //      snapshot: validatedFields, status: "draft",
    //      createdBy: user.email
    //    })
    //
    // 6. Return { documentId: newDocId, version: 1 }
    //
    // Edge cases:
    // - Global collection with versioning: check for existing doc first
    // - Empty fields (all optional): still valid for draft
    throw new Error("Not implemented")
  },
})

/**
 * Saves a draft version without publishing.
 * Creates a new version record in vex_versions.
 * Does NOT update the main document's content fields.
 */
export const saveDraft = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, documentId, fields }) => {
    // TODO: implement
    //
    // 1. requireVersionedCollection + requireUser + checkPermission("update")
    //
    // 2. Verify document exists in main collection: ctx.db.get(documentId)
    //    → throw ConvexError if not found
    //
    // 3. Validate fields via generateFormSchema().partial()
    //    (drafts allow partial/optional fields)
    //
    // 4. Get the latest version's snapshot to merge with new fields:
    //    a. latestVersion = await Versions.getLatestVersion(...)
    //    b. If latestVersion exists: merge snapshot with new fields
    //       mergedSnapshot = { ...latestVersion.snapshot, ...validatedFields }
    //    c. If no latestVersion: use validatedFields as snapshot
    //
    // 5. Create new version: Versions.createVersion({
    //      ctx, collection: collectionSlug, documentId,
    //      snapshot: mergedSnapshot, status: "draft",
    //      createdBy: user.email
    //    })
    //
    // 6. Clean up old versions: Versions.cleanupOldVersions({
    //      ctx, collection: collectionSlug, documentId,
    //      maxPerDoc: collection.versions.maxPerDoc ?? DEFAULT_MAX_VERSIONS_PER_DOC
    //    })
    //
    // 7. Return { version: newVersion }
    //
    // Edge cases:
    // - First save after create: latestVersion is the initial draft
    // - Saving same content again: still creates a version (user explicitly saved)
    throw new Error("Not implemented")
  },
})

/**
 * Publishes the latest draft version.
 * Copies the latest version's snapshot to the main document's fields,
 * sets _status to "published", and creates a published version record.
 */
export const publish = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    // TODO: implement
    //
    // 1. requireVersionedCollection + requireUser + checkPermission("update")
    //
    // 2. Verify document exists: ctx.db.get(documentId)
    //    → throw if not found
    //
    // 3. Get the latest version: Versions.getLatestVersion(...)
    //    → throw ConvexError("No version to publish") if null
    //
    // 4. Extract the snapshot from the latest version
    //
    // 5. Patch the main document with:
    //    { ...snapshot, _status: "published", _publishedAt: Date.now(),
    //      _version: latestVersion.version }
    //
    // 6. Create a new version record with status: "published"
    //    using the same snapshot (marks this version as "was published")
    //
    // 7. Clean up old versions
    //
    // 8. Return { version: newVersion }
    //
    // Edge cases:
    // - Already published with no new drafts: still creates a published version
    //   (idempotent — user explicitly clicked publish)
    // - Latest version is autosave: publish it, the autosave becomes the published content
    throw new Error("Not implemented")
  },
})

/**
 * Unpublishes a document by setting _status back to "draft".
 * The content stays in the main document but is no longer returned
 * by frontend queries that filter by _status === "published".
 */
export const unpublish = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    // TODO: implement
    //
    // 1. requireVersionedCollection + requireUser + checkPermission("update")
    //
    // 2. Verify document exists and _status === "published"
    //    → throw ConvexError if not found
    //    → no-op (or throw) if already "draft"
    //
    // 3. Patch main document: { _status: "draft" }
    //    → Keep all content fields as-is, just change status
    //
    // 4. Create a version record with status: "draft" to mark the unpublish event
    //    → Use extractUserFields to get snapshot from current main doc
    //
    // 5. Return { version: newVersion }
    throw new Error("Not implemented")
  },
})

/**
 * Autosave — coalesces into a single autosave version record.
 * Does not create excessive version records for rapid saves.
 */
export const autosave = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, documentId, fields }) => {
    // TODO: implement
    //
    // 1. requireVersionedCollection + requireUser + checkPermission("update")
    //
    // 2. Verify document exists
    //
    // 3. Validate fields via generateFormSchema().partial()
    //
    // 4. Get latest version to merge snapshot:
    //    mergedSnapshot = { ...(latestVersion?.snapshot ?? {}), ...validatedFields }
    //
    // 5. Coalesce: Versions.coalesceAutosave({
    //      ctx, collection: collectionSlug, documentId,
    //      snapshot: mergedSnapshot, createdBy: user.email
    //    })
    //
    // 6. Return { version }
    //
    // Edge cases:
    // - Rapid autosaves: coalesceAutosave handles the dedup
    // - Autosave after explicit save: creates new autosave (old one was "draft")
    throw new Error("Not implemented")
  },
})

/**
 * Restores a previous version by creating a new draft version
 * with that version's snapshot. The user must then publish to make it live.
 */
export const restoreVersion = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    version: v.number(),
  },
  handler: async (ctx, { collectionSlug, documentId, version: versionNum }) => {
    // TODO: implement
    //
    // 1. requireVersionedCollection + requireUser + checkPermission("update")
    //
    // 2. Get the target version: Versions.getVersion({
    //      ctx, collection: collectionSlug, documentId, version: versionNum
    //    })
    //    → throw ConvexError("Version not found") if null
    //
    // 3. Create a new draft version with the restored snapshot:
    //    Versions.createVersion({
    //      ctx, collection: collectionSlug, documentId,
    //      snapshot: targetVersion.snapshot, status: "draft",
    //      createdBy: user.email
    //    })
    //
    // 4. Clean up old versions
    //
    // 5. Return { version: newVersion }
    //
    // Edge cases:
    // - Restoring the current version: still creates a new draft (user intent is clear)
    // - Restored version has fields that no longer exist in schema:
    //   include them — they'll be stripped on next explicit save via validation
    throw new Error("Not implemented")
  },
})

/**
 * Lists version history for a document.
 * Returns metadata only (no full snapshots) for performance.
 */
export const listVersions = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { collectionSlug, documentId, limit }) => {
    requireVersionedCollection(collectionSlug)

    return await Versions.listVersions<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      limit,
    })
  },
})

/**
 * Gets the document content for the admin edit view.
 * Returns the latest version's snapshot if versions exist,
 * otherwise falls back to the main document's fields.
 */
export const getDocumentForEdit = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    // TODO: implement
    //
    // 1. requireVersionedCollection(collectionSlug)
    //
    // 2. Get the main document: ctx.db.get(documentId)
    //    → return null if not found
    //
    // 3. Get the latest version: Versions.getLatestVersion(...)
    //
    // 4. If latestVersion exists:
    //    return {
    //      _id: mainDoc._id,
    //      ...latestVersion.snapshot,
    //      _status: mainDoc._status,
    //      _version: latestVersion.version,
    //      _publishedAt: mainDoc._publishedAt,
    //      _creationTime: mainDoc._creationTime,
    //    }
    //
    // 5. If no latestVersion (shouldn't happen, but fallback):
    //    return mainDoc as-is (with extractUserFields applied for content)
    //
    // Edge cases:
    // - Document exists but has no versions (e.g., versioning was just enabled
    //   on an existing collection): return main doc fields directly
    throw new Error("Not implemented")
  },
})
```

---

## Step 5: Admin UI — StatusBadge + List View Column

- [ ] Create `packages/admin-next/src/components/StatusBadge.tsx`
- [ ] Modify `packages/admin-next/src/views/CollectionsView.tsx` — inject `_status` column for versioned collections
- [ ] Run `pnpm build`

### File: `packages/admin-next/src/components/StatusBadge.tsx`

Small badge component showing draft/published status.

```tsx
"use client";

import { Badge } from "@vexcms/ui";

/**
 * Renders a badge indicating document draft/published status.
 * Used in the list view _status column and edit view header.
 */
export function StatusBadge(props: {
  status: "draft" | "published" | string;
}) {
  if (props.status === "published") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white text-xs">
        Published
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs">
      Draft
    </Badge>
  );
}
```

### Modify: `packages/admin-next/src/views/CollectionsView.tsx`

Inject a `_status` column at the beginning of the columns array when the collection has `versions.drafts === true`.

In the `useMemo` that builds `columns`, add a status column if the collection is versioned:

```typescript
const columns = useMemo(() => {
  const cols = generateColumns({ collection, auth: config.auth });

  // Inject _status column for versioned collections
  if (collection.versions?.drafts) {
    const statusCol: ColumnDef<Record<string, unknown>, unknown> = {
      accessorKey: "_status",
      header: "Status",
      size: 80,
      enableSorting: false,
      cell: (info) => {
        const value = info.getValue() as string | undefined;
        if (!value) return "";
        return <StatusBadge status={value} />;
      },
    };
    cols.unshift(statusCol);
  }

  // ... existing upload cell override logic ...
  return cols.map((col) => {
    // existing upload cell preview mapping
  });
}, [collection, config.auth]);
```

Import `StatusBadge` at the top of the file.

---

## Step 6: Admin UI — CollectionEditView Draft/Publish Workflow

- [ ] Create `packages/admin-next/src/components/VersionHistoryDropdown.tsx`
- [ ] Create `packages/admin-next/src/hooks/useAutosave.ts`
- [ ] Modify `packages/admin-next/src/views/CollectionEditView.tsx` — draft/publish buttons, version history, autosave
- [ ] Run `pnpm build`

### File: `packages/admin-next/src/components/VersionHistoryDropdown.tsx`

Dropdown showing version history with restore capability. Positioned next to the Save Draft button.

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from "@vexcms/ui";
import { History, RotateCcw, Globe } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface VersionHistoryDropdownProps {
  collectionSlug: string;
  documentId: string;
  /** Callback after a version is restored */
  onRestored?: () => void;
}

export function VersionHistoryDropdown(props: VersionHistoryDropdownProps) {
  const versionsQuery = useQuery({
    ...convexQuery(anyApi.vex.versions.listVersions, {
      collectionSlug: props.collectionSlug,
      documentId: props.documentId,
      limit: 20,
    }),
  });

  const restoreVersion = useMutation(anyApi.vex.versions.restoreVersion);

  const versions = (versionsQuery.data ?? []) as {
    _id: string;
    version: number;
    status: string;
    createdAt: number;
    createdBy: string | null;
  }[];

  const handleRestore = async (versionNum: number) => {
    await restoreVersion({
      collectionSlug: props.collectionSlug,
      documentId: props.documentId,
      version: versionNum,
    });
    props.onRestored?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto">
        {versions.length === 0 && (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No versions yet
          </div>
        )}
        {versions.map((v) => (
          <DropdownMenuItem
            key={v._id}
            className="flex items-center justify-between gap-2 cursor-pointer"
            onClick={() => handleRestore(v.version)}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">v{v.version}</span>
                {v.status === "published" && (
                  <Globe className="h-3 w-3 text-green-600" />
                )}
                <StatusBadge status={v.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(v.createdAt).toLocaleString()}
              </span>
            </div>
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### File: `packages/admin-next/src/hooks/useAutosave.ts`

Hook that triggers autosave on an interval when the form has changes.

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { DEFAULT_AUTOSAVE_INTERVAL } from "@vexcms/core";

/**
 * Autosave hook for versioned collections.
 * Calls the autosave mutation at a configurable interval
 * when there are unsaved changes.
 *
 * @param props.collectionSlug - Collection slug
 * @param props.documentId - Document ID
 * @param props.enabled - Whether autosave is active
 * @param props.interval - Autosave interval in ms (default: 2000)
 * @param props.getChangedFields - Function returning current changed fields, or null if no changes
 */
export function useAutosave(props: {
  collectionSlug: string;
  documentId: string;
  enabled: boolean;
  interval?: number;
  getChangedFields: () => Record<string, unknown> | null;
}) {
  // TODO: implement
  //
  // 1. Use useMutation to get the autosave mutation function
  //    const autosaveMutation = useMutation(anyApi.vex.versions.autosave)
  //
  // 2. Store a ref to track if an autosave is in-flight (prevent overlap)
  //    const inFlight = useRef(false)
  //
  // 3. Store a ref to getChangedFields so it doesn't trigger effect re-runs
  //    const getChangedFieldsRef = useRef(props.getChangedFields)
  //    Update it on each render
  //
  // 4. useEffect with setInterval:
  //    - If !props.enabled, return early (no interval)
  //    - Set interval at props.interval ?? DEFAULT_AUTOSAVE_INTERVAL
  //    - On each tick:
  //      a. If inFlight.current, skip
  //      b. Call getChangedFieldsRef.current() to get changes
  //      c. If null (no changes), skip
  //      d. Set inFlight.current = true
  //      e. Call autosaveMutation({ collectionSlug, documentId, fields: changes })
  //      f. In finally: set inFlight.current = false
  //    - Return cleanup: clearInterval
  //
  // 5. Deps: [props.enabled, props.interval, props.collectionSlug, props.documentId]
  //
  // Edge cases:
  // - Component unmounts during in-flight save: Convex handles it
  // - getChangedFields returns empty object {}: still autosave (could have cleared a field)
  // - Rapid prop changes: cleanup clears old interval before setting new one
}
```

### Modify: `packages/admin-next/src/views/CollectionEditView.tsx`

Major changes to support the draft/publish workflow for versioned collections:

**1. Detect if collection is versioned:**

```typescript
const isVersioned = !!collection.versions?.drafts;
```

**2. For versioned collections, fetch document via `getDocumentForEdit` instead of `getDocument`:**

```typescript
const documentQuery = useQuery({
  ...convexQuery(
    isVersioned
      ? anyApi.vex.versions.getDocumentForEdit
      : anyApi.vex.collections.getDocument,
    {
      collectionSlug: collection.slug,
      documentId: documentID,
    },
  ),
});
```

**3. Add version mutation hooks (only used when versioned):**

```typescript
const saveDraftMutation = useMutation(anyApi.vex.versions.saveDraft);
const publishMutation = useMutation(anyApi.vex.versions.publish);
const unpublishMutation = useMutation(anyApi.vex.versions.unpublish);
```

**4. Replace the submit handler for versioned collections:**

```typescript
const handleSubmit = async (changedFields: Record<string, unknown>) => {
  setIsSaving(true);
  try {
    if (isVersioned) {
      await saveDraftMutation({
        collectionSlug: collection.slug,
        documentId: documentID,
        fields: changedFields,
      });
    } else {
      await updateDocument({
        collectionSlug: collection.slug,
        documentId: documentID,
        fields: changedFields,
      });
    }
  } finally {
    setIsSaving(false);
  }
};
```

**5. Add publish/unpublish handlers:**

```typescript
const [isPublishing, setIsPublishing] = useState(false);

const handlePublish = async () => {
  setIsPublishing(true);
  try {
    await publishMutation({
      collectionSlug: collection.slug,
      documentId: documentID,
    });
  } finally {
    setIsPublishing(false);
  }
};

const handleUnpublish = async () => {
  setIsPublishing(true);
  try {
    await unpublishMutation({
      collectionSlug: collection.slug,
      documentId: documentID,
    });
  } finally {
    setIsPublishing(false);
  }
};
```

**6. Replace the button area in the header (right side):**

For versioned collections, render left-to-right: `[Version History] [Save Draft] [Publish]` (or `[Unpublish]` when published).

```tsx
{/* Button area */}
<div className="flex items-center gap-2">
  {!disableDelete && document && (
    <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </Button>
  )}

  {isVersioned ? (
    <>
      <VersionHistoryDropdown
        collectionSlug={collection.slug}
        documentId={documentID}
      />
      <Button
        type="submit"
        form="collection-edit-form"
        variant="outline"
        size="sm"
        disabled={isSaving || !perms.update.allowed}
      >
        {isSaving ? "Saving..." : "Save Draft"}
      </Button>
      {document?._status === "published" ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleUnpublish}
          disabled={isPublishing}
        >
          {isPublishing ? "..." : "Unpublish"}
        </Button>
      ) : null}
      <Button
        size="sm"
        onClick={handlePublish}
        disabled={isPublishing || !perms.update.allowed}
      >
        {isPublishing ? "Publishing..." : "Publish"}
      </Button>
    </>
  ) : (
    <Button
      type="submit"
      form="collection-edit-form"
      disabled={isSaving || fieldEntries.length === 0 || !perms.update.allowed}
    >
      {isSaving ? "Saving..." : "Save"}
    </Button>
  )}
</div>
```

**7. Add status badge in the header (after breadcrumb or next to document title):**

```tsx
{isVersioned && document?._status && (
  <StatusBadge status={document._status as string} />
)}
```

**8. Wire up autosave (if collection has autosave config):**

```typescript
const autosaveConfig = collection.versions?.autosave;
const autosaveEnabled = isVersioned && !!autosaveConfig && !!document;
const autosaveInterval =
  typeof autosaveConfig === "object" ? autosaveConfig.interval : DEFAULT_AUTOSAVE_INTERVAL;

// Need a ref to the form's getChangedFields — this depends on AppForm's API.
// If AppForm exposes a way to get current dirty fields, wire it here.
// Otherwise, autosave uses the form's onSubmit path with a timer.

useAutosave({
  collectionSlug: collection.slug,
  documentId: documentID,
  enabled: autosaveEnabled,
  interval: autosaveInterval,
  getChangedFields: () => {
    // Implementation depends on how AppForm exposes dirty state.
    // If using TanStack Form, you can check form.state.isDirty
    // and extract changed values.
    // This is a guided stub — implement based on AppForm's API.
    return null;
  },
});
```

**9. For versioned collections, the CreateDocumentDialog should use `createDraftDocument` instead of `createDocument`:**

Update the `onCreated` callback in the create dialog to use the version-aware mutation when the collection is versioned.

---

## Step 7: Test-App Wiring

- [ ] Modify `apps/test-app/src/vexcms/collections/articles.ts` — add `versions: { drafts: true }` config
- [ ] Run `pnpm --filter @vexcms/cli generate` (or equivalent) to regenerate the schema
- [ ] Verify the generated schema includes `_status`, `_version`, `_publishedAt` on articles and `vex_versions` table
- [ ] Deploy to Convex dev and test the full workflow:
  - [ ] Create a new article → starts as draft
  - [ ] Save draft → creates version record
  - [ ] Publish → copies to main doc, status badge changes
  - [ ] Edit published → save draft → new version created, main doc unchanged
  - [ ] Publish again → main doc updated
  - [ ] Unpublish → status reverts to draft
  - [ ] View version history → see all versions with published indicators
  - [ ] Restore previous version → creates new draft with old content
  - [ ] Autosave fires → coalesced version record updated
- [ ] Verify non-versioned collections (posts, categories) still work exactly as before

### File: `apps/test-app/src/vexcms/collections/articles.ts`

Add `versions` config:

```typescript
export const articles = defineCollection({
  slug: TABLE_SLUG_ARTICLES,
  admin: {
    defaultColumns: ["name", "index", "slug", "banner"],
    group: "Content",
    useAsTitle: "name",
  },
  fields: {
    name: text({ label: "Name", required: true }),
    slug: text({ label: "Slug", required: true }),
    banner: upload({ to: TABLE_SLUG_MEDIA }),
    index: number({
      admin: { cellAlignment: "center" },
      defaultValue: 0,
      label: "Index",
    }),
  },
  labels: { plural: "Articles", singular: "Article" },
  versions: {
    drafts: true,
    autosave: true,
    maxPerDoc: 50,
  },
})
```

---

## Success Criteria

- [ ] `VersionsConfig` type exists on `VexCollection` and `defineCollection` accepts it
- [ ] Schema generation injects `_status`, `_version`, `_publishedAt` fields only for versioned collections
- [ ] Schema generation produces `vex_versions` table with proper indexes when any collection is versioned
- [ ] Non-versioned collections are completely unchanged (no version fields, no behavior changes)
- [ ] `extractUserFields` correctly strips all system fields (unit tested)
- [ ] Admin list view shows `_status` badge column for versioned collections
- [ ] Admin edit view shows Save Draft + Publish buttons for versioned collections
- [ ] Admin edit view shows plain Save button for non-versioned collections (unchanged)
- [ ] Save Draft creates a version record without updating main document content
- [ ] Publish copies latest version snapshot to main document and sets `_status: "published"`
- [ ] Unpublish sets `_status` back to `"draft"` without changing content
- [ ] Version history dropdown shows versions with published/draft indicators and timestamps
- [ ] Restoring a version creates a new draft (safe, reversible)
- [ ] Autosave coalesces into a single version record (no record bloat)
- [ ] Version cleanup respects `maxPerDoc`, preserves published versions
- [ ] New documents in versioned collections start with `_status: "draft"`
- [ ] `pnpm build` passes across all packages
- [ ] `pnpm --filter @vexcms/core test` passes with new versioning tests
