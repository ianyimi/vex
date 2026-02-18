# Versioning & Drafts Implementation Spec

This document defines the implementation plan for Vex CMS versioning and draft functionality. It covers the data model, version history, draft workflow, autosave, and restore operations.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.6

**Depends on**:
- [schema-field-system-spec.md](./schema-field-system-spec.md) - Field types and collection configuration
- [convex-integration-spec.md](./convex-integration-spec.md) - Admin handlers, access control, and hook execution

---

## Design Goals

1. **User queries return published by default** - Standard Convex queries on main collections return published content without any special filtering
2. **Draft edits don't affect published** - Editing creates a draft snapshot; published content remains unchanged until explicit publish
3. **Full version history** - All saves (draft and published) stored in versions table for restore
4. **Single versions table** - One `vex_versions` table for all collections, indexed by collection slug
5. **Autosave support** - Configurable autosave that doesn't create excessive version records

---

## Data Model

### Main Document Fields (Added to Each Versioned Collection)

```typescript
interface VersionedDocumentFields {
  /** Current status of the main document fields */
  _status: "draft" | "published";

  /** Current version number (increments on each save) */
  _version: number;

  /**
   * Snapshot of pending draft edits (null if no pending draft)
   * Contains all user-defined fields, not system fields
   */
  _draftSnapshot: Record<string, any> | null;

  /** Version number of the current draft snapshot */
  _draftVersion: number | null;

  /** Whether a draft exists (for efficient querying) */
  _hasDraft: boolean;

  /** Timestamp of last publish */
  _publishedAt: number | null;

  /** Timestamp reserved for future scheduled publishing */
  _scheduledPublishAt: number | null;

  /** Timestamp reserved for future scheduled unpublishing */
  _scheduledUnpublishAt: number | null;
}
```

### Versions Table Schema

```typescript
interface VersionDocument {
  _id: Id<"vex_versions">;

  /** Collection slug (e.g., "posts", "pages") */
  collection: string;

  /** Document ID in the main collection (stored as string for flexibility) */
  documentId: string;

  /** Incrementing version number within this document */
  version: number;

  /** Status at time of save */
  status: "draft" | "published" | "autosave";

  /** Full snapshot of all user-defined fields */
  snapshot: Record<string, any>;

  /** When this version was created */
  createdAt: number;

  /** User who created this version */
  createdBy: string | null;

  /** For autosave: marks the "working" autosave that gets updated */
  isAutosave: boolean;
}
```

### Indexes on vex_versions

```typescript
// In schema generation
defineTable(vexVersionsValidator)
  .index("by_collection", ["collection"])
  .index("by_document", ["collection", "documentId"])
  .index("by_document_version", ["collection", "documentId", "version"])
  .index("by_document_latest", ["collection", "documentId", "createdAt"])
```

---

## Type Definitions

### Collection Config Extensions

```typescript
interface VersionsConfig {
  /** Enable versioning for this collection */
  enabled?: boolean;

  /** Enable draft/publish workflow */
  drafts?: boolean;

  /** Autosave configuration */
  autosave?: boolean | {
    /** Interval in milliseconds (default: 2000) */
    interval: number;
  };

  /** Maximum versions to keep per document (default: 100, 0 = unlimited) */
  maxPerDoc?: number;

  /** Whether to keep all published versions regardless of maxPerDoc */
  preservePublished?: boolean;
}

interface CollectionConfig<TFields> {
  fields: TFields;

  /** Versioning and draft configuration */
  versions?: VersionsConfig;

  // ... other existing config
}
```

### Version Operation Types

```typescript
/**
 * Result of listing versions for a document
 */
interface VersionListItem {
  _id: Id<"vex_versions">;
  version: number;
  status: "draft" | "published" | "autosave";
  createdAt: number;
  createdBy: string | null;
  /** Whether this version matches current published content */
  isCurrentPublished: boolean;
  /** Whether this version matches current draft content */
  isCurrentDraft: boolean;
}

/**
 * Full version data for restore preview
 */
interface VersionDetail extends VersionListItem {
  snapshot: Record<string, any>;
}

/**
 * Arguments for version operations
 */
interface ListVersionsArgs {
  collection: string;
  documentId: string;
  limit?: number;
  cursor?: string;
}

interface GetVersionArgs {
  collection: string;
  documentId: string;
  version: number;
}

interface RestoreVersionArgs {
  collection: string;
  documentId: string;
  version: number;
}
```

---

## Document Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOCUMENT STATES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. NEW DRAFT                                                        │
│     Main fields: initial content                                     │
│     _status: "draft"                                                 │
│     _draftSnapshot: null                                             │
│     _hasDraft: false                                                 │
│     User queries: returns nothing (unless they query drafts)         │
│                                                                      │
│  2. PUBLISHED (no pending edits)                                     │
│     Main fields: published content                                   │
│     _status: "published"                                             │
│     _draftSnapshot: null                                             │
│     _hasDraft: false                                                 │
│     User queries: returns main fields ✓                              │
│                                                                      │
│  3. PUBLISHED WITH DRAFT                                             │
│     Main fields: published content (unchanged)                       │
│     _status: "published"                                             │
│     _draftSnapshot: { ...edited content }                            │
│     _hasDraft: true                                                  │
│     User queries: returns main fields (published) ✓                  │
│     Admin edit: reads from _draftSnapshot                            │
│                                                                      │
│  4. UNPUBLISHED (was published, now draft)                           │
│     Main fields: last published content                              │
│     _status: "draft"                                                 │
│     _draftSnapshot: null (or pending edits)                          │
│     _hasDraft: varies                                                │
│     User queries: returns nothing                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Required Functions

### Admin Mutation Handlers

#### `adminCreate(ctx, args): { _id, _version }`

Creates a new document in a versioned collection.

**Must accomplish:**
- Create document with `_status: "draft"` (new docs start as drafts)
- Set `_version: 1`, `_draftSnapshot: null`, `_hasDraft: false`
- Create initial version record in `vex_versions` with `status: "draft"`
- Run beforeCreate/afterCreate hooks

**Edge cases:**
- Collection doesn't have versioning enabled: create without version fields
- Hooks modify data: validate after hooks, before version snapshot

---

#### `adminSaveDraft(ctx, args: { collection, id, data }): { _version }`

Saves draft changes without publishing.

**Must accomplish:**
- Fetch existing document
- Check update access
- If document is published: store changes in `_draftSnapshot`, keep main fields unchanged
- If document is already a draft (never published): update main fields directly
- Increment `_draftVersion`
- Create version record with `status: "draft"`
- Run beforeUpdate/afterUpdate hooks
- Clean up old versions if exceeding `maxPerDoc`

**Edge cases:**
- Document not found: throw error
- No changes from current state: skip version creation? Or create anyway?
- Hooks throw: abort, don't create version

---

#### `adminAutosave(ctx, args: { collection, id, data }): { _version }`

Autosave that updates existing autosave version instead of creating new.

**Must accomplish:**
- Same as saveDraft, but:
- Check for existing version with `isAutosave: true` for this document
- If exists: update that version's snapshot instead of creating new
- If not exists: create new version with `isAutosave: true`
- Update `_draftSnapshot` on main document

**Edge cases:**
- Rapid autosaves: should debounce on client, but server handles concurrent safely
- Autosave after explicit save: create new autosave version (previous was "draft" not "autosave")

---

#### `adminPublish(ctx, args: { collection, id }): { _version }`

Publishes the current draft.

**Must accomplish:**
- Fetch existing document
- Check update access
- If `_draftSnapshot` exists: copy to main fields
- Set `_status: "published"`, `_publishedAt: Date.now()`
- Clear `_draftSnapshot`, `_draftVersion`, set `_hasDraft: false`
- Update latest version record to `status: "published"` OR create new published version
- Run beforeUpdate/afterUpdate hooks

**Edge cases:**
- No draft to publish (already published, no changes): no-op or error?
- Document is new draft (never published): publish main fields as-is

---

#### `adminUnpublish(ctx, args: { collection, id }): { _version }`

Reverts a published document to draft status.

**Must accomplish:**
- Fetch existing document
- Check update access
- Set `_status: "draft"`, clear `_publishedAt`
- Main fields remain unchanged (content preserved, just not "published")
- Create version record with `status: "draft"`

**Edge cases:**
- Document is already draft: no-op
- Document has pending draft edits: preserve `_draftSnapshot`

---

#### `adminRevertToPublished(ctx, args: { collection, id }): { _version }`

Discards draft changes, reverts to last published state.

**Must accomplish:**
- Fetch existing document
- Verify document has `_status: "published"` (has been published before)
- Clear `_draftSnapshot`, `_draftVersion`, set `_hasDraft: false`
- Main fields already contain published content, no change needed
- Optionally create version record marking the revert

**Edge cases:**
- No published version exists: throw error
- No draft to revert: no-op

---

#### `adminRestoreVersion(ctx, args: RestoreVersionArgs): { _version }`

Restores document to a previous version's state.

**Must accomplish:**
- Fetch version record from `vex_versions`
- Verify version belongs to specified document
- Check update access
- Copy version snapshot to `_draftSnapshot` (becomes a draft, needs re-publish)
- Set `_hasDraft: true`
- Create new version record with `status: "draft"` indicating restore
- Preserve `_status` as is (if was published, still published but now has draft)

**Edge cases:**
- Version not found: throw error
- Restoring to current version: no-op
- Version snapshot has fields that no longer exist in schema: include anyway? strip?

---

### Admin Query Handlers

#### `adminGetById(ctx, args): Document`

Returns document for editing (draft content if exists).

**Must accomplish:**
- Fetch document from main collection
- If `_draftSnapshot` exists: return merged object with draft content
- If no draft: return main fields
- Include version metadata (`_version`, `_status`, `_hasDraft`)

**Implementation:**
```typescript
async function adminGetById(ctx, { collection, id }) {
  const doc = await ctx.db.get(id);
  if (!doc) return null;

  // Check read access
  await checkAccess(ctx, collection, "read", doc);

  if (doc._draftSnapshot) {
    // Return draft content for editing
    return {
      _id: doc._id,
      ...doc._draftSnapshot,
      // Include system fields
      _status: "draft",
      _version: doc._draftVersion,
      _hasDraft: true,
      _publishedAt: doc._publishedAt,
    };
  }

  // Return published content
  return {
    _id: doc._id,
    ...extractUserFields(doc),
    _status: doc._status,
    _version: doc._version,
    _hasDraft: false,
    _publishedAt: doc._publishedAt,
  };
}
```

---

#### `adminListVersions(ctx, args: ListVersionsArgs): VersionListItem[]`

Lists version history for a document.

**Must accomplish:**
- Query `vex_versions` by collection + documentId
- Order by version descending (newest first)
- Paginate with cursor
- Mark which version is current published / current draft
- Exclude autosave versions? Or include with flag?

**Edge cases:**
- Document has no versions (shouldn't happen): return empty array
- Hundreds of versions: paginate efficiently

---

#### `adminGetVersion(ctx, args: GetVersionArgs): VersionDetail`

Gets full version data for preview before restore.

**Must accomplish:**
- Fetch specific version record
- Return full snapshot for preview
- Include metadata (who created, when, status)

**Edge cases:**
- Version not found: return null or throw

---

### Version Cleanup Functions

#### `cleanupOldVersions(ctx, collection, documentId, maxPerDoc, preservePublished)`

Removes old versions exceeding the limit.

**Must accomplish:**
- Query all versions for document
- Sort by version number
- Keep newest `maxPerDoc` versions
- If `preservePublished`: also keep all versions with `status: "published"`
- Delete the rest
- Never delete the current version

**Edge cases:**
- All versions are published: keep all if `preservePublished`
- `maxPerDoc: 0`: keep all versions

---

### Helper Functions

#### `extractUserFields(doc): Record<string, any>`

Extracts user-defined fields from document, excluding system fields.

**Must accomplish:**
- Return all fields except: `_id`, `_creationTime`, `_status`, `_version`, `_draftSnapshot`, `_draftVersion`, `_hasDraft`, `_publishedAt`, `_scheduledPublishAt`, `_scheduledUnpublishAt`

---

#### `getLatestPublishedVersion(ctx, collection, documentId): VersionDocument | null`

Gets the most recent published version for a document.

**Must accomplish:**
- Query `vex_versions` with `status: "published"`
- Order by version descending
- Return first (latest)

---

#### `getNextVersionNumber(ctx, collection, documentId): number`

Gets the next version number for a document.

**Must accomplish:**
- Query latest version by version number
- Return `latestVersion + 1` or `1` if no versions

---

## Schema Generation

### Adding Version Fields to Collections

When generating Convex schema, if collection has `versions.enabled: true`:

```typescript
function buildTableValidator(collection) {
  const baseValidators = extractFieldValidators(collection.fields);

  if (collection.versions?.enabled) {
    return {
      ...baseValidators,
      _status: v.union(v.literal("draft"), v.literal("published")),
      _version: v.number(),
      _draftSnapshot: v.optional(v.any()),
      _draftVersion: v.optional(v.number()),
      _hasDraft: v.boolean(),
      _publishedAt: v.optional(v.number()),
      _scheduledPublishAt: v.optional(v.number()),
      _scheduledUnpublishAt: v.optional(v.number()),
    };
  }

  return baseValidators;
}
```

### System Tables

```typescript
// Added to schema automatically
const vexVersionsTable = defineTable({
  collection: v.string(),
  documentId: v.string(),
  version: v.number(),
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("autosave")
  ),
  snapshot: v.any(),
  createdAt: v.number(),
  createdBy: v.optional(v.string()),
  isAutosave: v.boolean(),
})
  .index("by_collection", ["collection"])
  .index("by_document", ["collection", "documentId"])
  .index("by_document_version", ["collection", "documentId", "version"])
  .index("by_document_status", ["collection", "documentId", "status"])
  .index("by_autosave", ["collection", "documentId", "isAutosave"]);
```

---

## Admin Panel Integration

### Document Edit Form

```typescript
// Load document for editing
const doc = useQuery(api.vex.adminGetById, { collection, id });

// doc contains draft content if draft exists, otherwise published content
// Form edits this data

// Save draft
const saveDraft = useMutation(api.vex.adminSaveDraft);
await saveDraft({ collection, id, data: formData });

// Publish
const publish = useMutation(api.vex.adminPublish);
await publish({ collection, id });
```

### Draft Indicator

```typescript
// In document header
{doc._hasDraft && (
  <Badge variant="warning">Unsaved Draft</Badge>
)}
{doc._status === "draft" && !doc._publishedAt && (
  <Badge variant="secondary">Never Published</Badge>
)}
```

### Version History Panel

```typescript
const versions = useQuery(api.vex.adminListVersions, {
  collection,
  documentId: id
});

// Display list with restore buttons
{versions.map(v => (
  <VersionRow
    key={v._id}
    version={v}
    onRestore={() => restore({ collection, id, version: v.version })}
    isCurrent={v.isCurrentDraft || v.isCurrentPublished}
  />
))}
```

### Publish/Unpublish Actions

```typescript
// Document toolbar
{doc._status === "published" ? (
  <>
    {doc._hasDraft && (
      <Button onClick={() => revertToPublished({ collection, id })}>
        Discard Draft
      </Button>
    )}
    <Button onClick={() => unpublish({ collection, id })}>
      Unpublish
    </Button>
  </>
) : (
  <Button onClick={() => publish({ collection, id })}>
    Publish
  </Button>
)}
```

---

## User Query Behavior

### Default: Published Only

```typescript
// Developer's query - works perfectly
export const listPosts = query({
  handler: async (ctx) => {
    return ctx.db.query("posts")
      .filter(q => q.eq(q.field("_status"), "published"))
      .collect();
  },
});

// Or with index (recommended)
export const listPublishedPosts = query({
  handler: async (ctx) => {
    return ctx.db.query("posts")
      .withIndex("by_status", q => q.eq("_status", "published"))
      .collect();
  },
});
```

### Accessing Draft Content (Opt-in)

For preview functionality, developers can explicitly access drafts:

```typescript
export const getPostForPreview = query({
  args: { id: v.id("posts") },
  handler: async (ctx, { id }) => {
    const post = await ctx.db.get(id);
    if (!post) return null;

    // Return draft if exists
    if (post._draftSnapshot) {
      return { _id: post._id, ...post._draftSnapshot };
    }

    return post;
  },
});
```

---

## Globals Versioning

Globals follow the same pattern with minor differences:

```typescript
// vex_globals table
interface GlobalDocument {
  _id: Id<"vex_globals">;
  slug: string;                    // Global identifier
  data: Record<string, any>;       // Published content
  _status: "draft" | "published";
  _version: number;
  _draftSnapshot: Record<string, any> | null;
  _draftVersion: number | null;
  _hasDraft: boolean;
  _publishedAt: number | null;
}

// Versions stored in same vex_versions table
// collection: "vex_global:{slug}" (e.g., "vex_global:header")
```

---

## File Structure

```
@vex/convex/
├── handlers/
│   ├── ... (existing)
│   ├── saveDraft.ts        # adminSaveDraft mutation
│   ├── autosave.ts         # adminAutosave mutation
│   ├── publish.ts          # adminPublish mutation
│   ├── unpublish.ts        # adminUnpublish mutation
│   ├── revertToPublished.ts
│   ├── restoreVersion.ts   # adminRestoreVersion mutation
│   ├── listVersions.ts     # adminListVersions query
│   └── getVersion.ts       # adminGetVersion query
├── versions/
│   ├── index.ts            # Version utility exports
│   ├── cleanup.ts          # cleanupOldVersions
│   ├── helpers.ts          # extractUserFields, getNextVersionNumber
│   └── types.ts            # Version-related types
└── schema/
    ├── ... (existing)
    └── versions.ts         # vex_versions table definition
```

---

## Testing Requirements

- Unit tests for version number incrementing
- Unit tests for draft snapshot merge logic
- Unit tests for version cleanup with maxPerDoc
- Integration tests for full draft → publish → edit → publish cycle
- Integration tests for restore to previous version
- Integration tests for autosave coalescing
- E2E tests for admin panel draft/publish workflow
