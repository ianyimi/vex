# Design Walkthrough — Media Collection & Upload Field

Companion to `spec.md`. Shows end-to-end consumer code, layering, and full
rationale for every design decision.

---

## 1. End-to-end consumer code

### 1.1 Minimal setup — single adapter, no registry needed

```ts
// vex.config.ts
import { defineConfig, defineCollection, text, upload } from "@vexcms/core";
import {
  convexFileStorage,
  defineMediaCollection,
} from "@vexcms/file-storage-convex";

const images = defineMediaCollection({
  slug: "images",
  fields: {
    alt: text({ required: true }),
    caption: text(),
  },
});

export default defineConfig({
  storageAdapters: [convexFileStorage({ mediaCollections: [images] })],
  collections: [
    defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        featuredImage: upload({ to: "images", label: "Featured Image" }),
      },
    }),
  ],
});
```

**What happens:**
1. `defineMediaCollection()` adds required fields (`alt`, `filename`, `mimeType`, `size`, `storageId`, `deleted`) and adapter-specific fields (`convexUrl`, `width`, `height`) to the `images` collection.
2. `convexFileStorage()` returns a `VexStorageAdapter` with `name: "convex"`, `mediaCollections: [images]`, and tags each collection with `meta.storageAdapterName: "convex"`.
3. `defineConfig()` calls `validateAndMergeStorageConfig()` which validates upload field references, detects slug collisions, and merges media collections into `VexConfig.mediaCollections`.
4. The `upload({ to: "images" })` field is validated against `mediaCollections` — `"images"` exists, so config succeeds.
5. Schema generation produces `images` table and `v.id("images")` on `upload()` fields.
6. Admin panel sidebar shows a "Media" section with the `images` collection.
7. The `posts` edit form shows an upload field for `featuredImage`.

### 1.2 No adapter — admin panel works without media

```ts
// vex.config.ts
import { defineConfig, defineCollection, text } from "@vexcms/core";

export default defineConfig({
  // No storageAdapters — no media support
  collections: [
    defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
      },
    }),
  ],
});
```

**What happens:**
- `defineConfig()` validates that no `upload()` fields exist (none do).
- `mediaCollections` is empty.
- Admin panel renders with no "Media" section. No errors. No default adapter is applied.
- If a user later adds `upload({ to: "images" })` without configuring `storageAdapters`, `defineConfig()` throws `VexStorageConfigError`.

### 1.3 Multiple media collections

```ts
// vex.config.ts
import { defineConfig, defineCollection, text, upload, number } from "@vexcms/core";
import {
  convexFileStorage,
  defineMediaCollection,
} from "@vexcms/file-storage-convex";

const images = defineMediaCollection({
  slug: "images",
  fields: {
    alt: text({ required: true }),
    caption: text(),
  },
});

const videos = defineMediaCollection({
  slug: "videos",
  fields: {
    alt: text({ required: true }),
    duration: number(),
  },
});

export default defineConfig({
  storageAdapters: [convexFileStorage({ mediaCollections: [images, videos] })],
  collections: [
    defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        featuredImage: upload({ to: "images", label: "Featured Image" }),
        heroVideo: upload({ to: "videos", label: "Hero Video" }),
      },
    }),
  ],
});
```

**What happens:**
1. `defineMediaCollection()` (from the adapter) adds required fields and adapter-specific fields to each collection.
2. The `alt` field in `images` is required; the `caption` field is optional. The `duration` field in `videos` is user-defined.
3. `convexFileStorage()` returns `VexStorageAdapter` with `mediaCollections: [images, videos]`. Both are tagged with `meta.storageAdapterName: "convex"`.
4. Core stores `mediaCollections` in `VexConfig.mediaCollections` (separate from `collections`).
5. Schema generation validates `upload({ to: "images" })` and `upload({ to: "videos" })` against `mediaCollections` slugs — both are valid.
6. The `softDelete: true` flag (if set) means deleting a media document marks `deleted: true` instead of removing the file.

### 1.4 Multiple storage adapters with registry

```ts
// vex.config.ts
import { defineConfig, defineCollection, text, upload } from "@vexcms/core";
import {
  convexFileStorage,
  defineMediaCollection as convexDefineMedia,
} from "@vexcms/file-storage-convex";
// Hypothetical second adapter
import {
  s3FileStorage,
  defineMediaCollection as s3DefineMedia,
} from "@vexcms/file-storage-s3";

const images = convexDefineMedia({
  slug: "images",
  fields: { alt: text({ required: true }) },
});

const backups = s3DefineMedia({
  slug: "backups",
  fields: { alt: text({ required: true }) },
});

export default defineConfig({
  storageAdapters: [
    convexFileStorage({ mediaCollections: [images] }),
    s3FileStorage({ mediaCollections: [backups] }),
  ],
  collections: [
    defineCollection({
      slug: "posts",
      fields: {
        featuredImage: upload({ to: "images" }),
      },
    }),
  ],
});
```

```ts
// apps/www/lib/storageRegistry.ts — REQUIRED for multi-adapter
import { api } from "~/convex/_generated/api";

export const storageRegistry = {
  convex: {
    generateUploadUrl: api.convexMedia.generateUploadUrl,
    uploadComplete: api.convexMedia.uploadComplete,
    deleteMedia: api.convexMedia.deleteMedia,
    getUrl: api.convexMedia.getUrl,
  },
  s3: {
    generateUploadUrl: api.s3Media.generateUploadUrl,
    uploadComplete: api.s3Media.uploadComplete,
    deleteMedia: api.s3Media.deleteMedia,
    getUrl: api.s3Media.getUrl,
  },
};
```

```tsx
// apps/www/app/admin/layout.tsx
import { storageRegistry } from "~/lib/storageRegistry";

export default function AdminLayout({ children }) {
  return (
    <AdminPanel storageRegistry={storageRegistry}>
      {children}
    </AdminPanel>
  );
}
```

**What happens:**
1. Two adapters each define media collections. All collections are tagged with `meta.storageAdapterName` ("convex" or "s3").
2. `validateAndMergeStorageConfig()` detects that both adapters have unique media collection slugs — no collision.
3. `upload({ to: "images" })` is validated — `"images"` exists in the convex adapter's collections.
4. The React app **must** provide a `storageRegistry` — the admin panel needs to know which adapter's Convex functions to call for each media collection.
5. When a user uploads a file to the "images" collection, the upload component reads `meta.storageAdapterName: "convex"` from the collection config and calls `storageRegistry.convex.generateUploadUrl`.

### 1.5 Collection with upload fields in arrays and groups

```ts
// vex.config.ts
import { defineConfig, defineCollection, text, upload, array, group } from "@vexcms/core";
import { convexFileStorage, defineMediaCollection } from "@vexcms/file-storage-convex";

const media = defineMediaCollection({
  slug: "media",
  fields: { alt: text({ required: true }) },
});

export default defineConfig({
  storageAdapters: [convexFileStorage({ mediaCollections: [media] })],
  collections: [
    defineCollection({
      slug: "products",
      fields: {
        name: text({ required: true }),
        thumbnail: upload({
          to: "media",
          label: "Thumbnail",
          admin: { position: "sidebar" },
        }),
        gallery: array({
          label: "Gallery Images",
          items: upload({ to: "media", label: "Image" }),
        }),
        specSheet: group({
          label: "Specification",
          fields: {
            pdf: upload({ to: "media", label: "PDF Document" }),
          },
        }),
      },
    }),
  ],
});
```

**What happens:**
- `thumbnail` stores a single media document ID (`v.id("media")`).
- `gallery` stores an array of media document IDs (`v.array(v.id("media"))`).
- `specSheet.pdf` stores a media document ID inside a group (`v.object({ pdf: v.id("media") })`).
- All three fields reference the same `"media"` collection.
- The admin panel renders upload inputs in all three contexts (top-level, array item, group field).

### 1.6 Media collection in admin panel

```ts
// No user code needed — media collections are defined by the adapter and appear
// in the admin sidebar under a dedicated "Media" section.

// Admin panel navigation (auto-generated):
// ├── Collections
// │   ├── Posts
// │   └── Products
// ├── Media          ← separate section, not mixed with Collections
// │   ├── Images     ← custom media collection
// │   └── Videos     ← custom media collection
// └── Users
```

Clicking a media collection opens the media library grid view:
- Thumbnail grid of all uploaded files
- Filename, size, MIME type below each thumbnail
- Click to edit: opens standard edit form (alt text, filename, etc.)
- Bulk delete button (top right) — deletes selected media files
- Upload button (top right) — opens upload dialog

### 1.7 Frontend: rendering an image from an upload field

```tsx
// app/posts/[slug]/page.tsx
import { api } from "~/convex/_generated/api";
import { fetchQuery } from "@vexcms/next";

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  // Populate the featuredImage field to get the media document
  const post = await fetchQuery(api.posts.getBySlug, {
    slug: params.slug,
    populate: { featuredImage: true },
  });

  return (
    <article>
      <h1>{post.title}</h1>
      {post.featuredImage && (
        <img
          src={post.featuredImage.convexUrl} // populated from media document
          alt={post.featuredImage.alt}
          width={post.featuredImage.width}
          height={post.featuredImage.height}
        />
      )}
    </article>
  );
}
```

**Note:** The `upload()` field stores a media document ID (`v.id("images")`). To get the URL, alt text, and dimensions, the frontend must populate the field using the same pattern as `relationship()` — the population resolves the media document by ID. This is identical to how relationship fields work; the upload field is a relationship field with a custom UI.

---

## 2. Layering diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  CONSUMER CODE (vex.config.ts, Next.js pages)                       │
│  ───────────────────────────────────────────────────────────────────│
│  defineConfig({ storageAdapters: [convexFileStorage({ mediaCollections: […] })],│
│                collections: [...] })                                │
│  upload({ to: "images" }) in collection fields                       │
│  <img src={post.featuredImage.convexUrl} /> in React components     │
│  storageRegistry in apps/www/lib/storageRegistry.ts (multi-adapter)│
├─────────────────────────────────────────────────────────────────────┤
│  @vexcms/core                                                       │
│  ───────────────────────────────────────────────────────────────────│
│  VexStorageAdapter interface                                        │
│  VexStorageAdapter validators (generateUploadUrlArgs, etc.)        │
│  upload() field config, UploadField types, validator, inputSchema      │
│  defineConfig() — calls validateAndMergeStorageConfig()             │
│    → validates upload refs, detects slug collisions, merges adapters  │
│  ADMIN_FIELDS registry (upload type)                                 │
│  AdminField union (UploadField)                                      │
│  Generic queries: listMedia, searchMedia (not adapter-specific)      │
├─────────────────────────────────────────────────────────────────────┤
│  @vexcms/file-storage-convex                                      │
│  ───────────────────────────────────────────────────────────────────│
│  defineMediaCollection() — adds required + adapter-specific fields   │
│  convexFileStorage() — returns VexStorageAdapter with mediaCollections │
│  Convex functions: generateUploadUrl, uploadComplete, deleteMedia, getUrl│
│    → all use validator factories from @vexcms/core                     │
│  Runtime: getUploadUrl, getUrl, deleteFile (Convex client wrapper)   │
├─────────────────────────────────────────────────────────────────────┤
│  @vexcms/cli                                                        │
│  ───────────────────────────────────────────────────────────────────│
│  Schema generation: media tables + v.id("images") on upload fields   │
│  Type generation: MediaDocument, ImageDocument, VideoDocument          │
│  Convex codegen: api.media.list, api.media.delete, etc.               │
├─────────────────────────────────────────────────────────────────────┤
│  @vexcms/react                                                      │
│  ───────────────────────────────────────────────────────────────────│
│  StorageRegistryContext — optional context for multi-adapter        │
│  UploadFieldInput — TanStack Form + drag-and-drop + media picker     │
│  UploadFieldCell — thumbnail in data table                           │
│  MediaLibrary — grid view of media files (per collection)            │
│  MediaPicker — popover for selecting media from a collection           │
│  MediaUploadDropzone — reusable dropzone component                     │
│  Field component registry (fieldInputComponents, fieldCellComponents) │
│  AdminPanel — accepts optional storageRegistry prop                  │
├─────────────────────────────────────────────────────────────────────┤
│  @vexcms/next                                                       │
│  ───────────────────────────────────────────────────────────────────│
│  NextAdminPage — renders admin panel with media collection routes    │
│  fetchQuery / fetchAuthQuery — server-side data helpers              │
│  generatePageMetadata — includes OG image from upload field           │
├─────────────────────────────────────────────────────────────────────┤
│  CONVEX BACKEND (generated by CLI, deployed by user)                 │
│  ───────────────────────────────────────────────────────────────────│
│  tables.images { _id, alt, filename, mimeType, size, storageId,    │
│                deleted, convexUrl, width, height }                   │
│  tables.videos { _id, alt, duration, filename, mimeType, size,        │
│                 storageId, deleted, convexUrl, width, height }        │
│  tables.posts { _id, title, featuredImage: v.id("images"),          │
│                heroVideo: v.id("videos"), gallery: v.array(v.id("media"))}│
│  actions.generateUploadUrl — returns signed URL + storageId          │
│  mutations.uploadComplete — creates media doc after upload            │
│  mutations.deleteMedia — deletes media doc + file (or soft delete)   │
│  queries.media.getUrl — returns URL for rendering (signed or public) │
│  queries.media.list — paginated media list with filter by deleted     │
│  queries.media.search — search media by filename/alt                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Type narrowing examples

### 3.1 Upload field type narrowing in field renderer

```ts
// packages/react/src/components/fields/renderFieldByType.tsx
import { ADMIN_FIELDS, type AdminField } from "@vexcms/core";

function renderField(field: AdminField) {
  switch (field.type) {
    case ADMIN_FIELDS.text.type:
      // field is TextField — autocomplete for text-specific props
      return <TextFieldInput fieldDef={field} />;
    case ADMIN_FIELDS.upload.type:
      // field is UploadField — autocomplete for upload-specific props
      // field.to is typed as "string" (the media collection slug)
      return <UploadFieldInput fieldDef={field} />;
    // ...
  }
}
```

### 3.2 Upload field in generated TypeScript interfaces

```ts
// convex/vex.types.ts (generated)
export interface MediaDocument {
  _id: string;
  _creationTime: number;
  alt: string;
  filename: string;
  mimeType: string;
  size: number;
  storageId: string;
  deleted: boolean;
  convexUrl: string;
  width?: number | null;
  height?: number | null;
}

export interface ImageDocument {
  _id: string;
  _creationTime: number;
  alt: string;
  caption?: string | null;
  filename: string;
  mimeType: string;
  size: number;
  storageId: string;
  deleted: boolean;
  convexUrl: string;
  width?: number | null;
  height?: number | null;
}

export interface PostDocument {
  _id: string;
  _creationTime: number;
  title: string;
  featuredImage?: string | null; // v.id("images") → string in generated types
  heroVideo?: string | null;     // v.id("videos") → string
  gallery: string[];             // v.array(v.id("media")) → string[]
}
```

### 3.3 Upload field in collection config (type-safe field keys)

```ts
// The upload field is a reference to a media collection
const posts = defineCollection({
  slug: "posts",
  fields: {
    title: text({ required: true }),
    // upload({ to: "images" }) is valid because "images" is a media collection
    featuredImage: upload({ to: "images", label: "Featured Image" }),
    // ❌ Runtime error: "nonexistent" is not a media collection
    // This is caught by defineConfig() validation, not TypeScript
    // (TypeScript can't validate the to parameter against dynamic collections)
    // broken: upload({ to: "nonexistent" }),
  },
});
```

---

## 4. Decisions Reference

### D1 — Storage adapter mimics `VexAuthAdapter` pattern

**Why this pattern:** The auth adapter proved that "adapter returns collections, core merges them" is a clean separation of concerns. The storage adapter follows the same mental model: the adapter defines the media collection shape, core enforces a minimum, and `defineConfig()` merges the result. Users already understand how auth adapters work; adding a storage adapter is zero new concepts.

**Alternative considered:** Core auto-generates the media collection with no adapter involvement. Rejected: different storage backends (S3, R2, Vercel Blob, local filesystem) have different metadata needs. S3 needs `bucket` and `key`; Vercel Blob needs `blobUrl` and `token`; local filesystem needs `path`. The adapter must define its own fields. Core only enforces the intersection (alt, filename, MIME type, size, storage reference, deleted flag).

**Alternative considered:** No adapter at all — file storage is a runtime configuration (env vars, not config). Rejected: media collections need schema definitions, and the schema depends on the storage backend. The storage ID format differs between backends. The adapter pattern keeps the storage abstraction at the schema level.

### D2 — Core enforces 6 base fields on every media collection

**The 6 fields:**
- `alt` (`text`) — accessibility text for every media file, required (auto-added by adapter if not present)
- `filename` (`text`) — original file name, required (for downloads, display)
- `mimeType` (`text`) — MIME type, required (for frontend rendering decisions)
- `size` (`number`) — file size in bytes, required (for quota, display)
- `storageId` (`text`) — opaque storage reference, required (adapter-specific handle)
- `deleted` (`checkbox`) — soft delete flag, always present (for admin queries)

**Why these 6:** Every storage backend needs to know what was stored, where it was stored, and how to render it. Alt text is a CMS accessibility requirement. Filename and MIME type are needed for downloads and rendering. Size is needed for UI display and quota management. Storage ID is the adapter's opaque handle. The deleted flag is always present so that admin queries can consistently filter by `deleted: false` regardless of which adapter is active.

**Why not `url` as a minimum field:** URLs are adapter-specific. Convex generates signed URLs at runtime; S3 URLs depend on the bucket and region; local filesystem URLs depend on the app's public path. The adapter is responsible for URL generation, not the core schema. The `convexUrl` field is added by the Convex adapter; other adapters add their own URL fields.

### D3 — `storageAdapters` is an optional array, no default adapter

**Why no auto-application:** Not every VexCMS project needs file uploads. A headless CMS used for API-only content, a form builder, or a simple blog might never upload files. Auto-applying a default adapter means every project carries a `media` collection in the schema even if unused. This is schema pollution.

**Why an array:** Multiple storage adapters can be active simultaneously. A user might use Convex for images (fast, signed URLs) and S3 for backups (cheaper, long-term storage). The array allows this without architectural changes later.

**Why no default "media" collection:** The user must explicitly define what media collections they want. There is no implicit `"media"` collection. This prevents surprise collections in the schema and forces the user to think about their media organization.

**Why `upload()` requires `storageAdapters`:** If a user adds `upload()` to a collection but forgets to configure `storageAdapters`, the error is immediate and descriptive at config time. This is better than a silent failure (no-op adapter) or a default that might not match the user's needs.

**Alternative considered:** Auto-apply `convexFileStorage()` when `storageAdapters` is omitted. Rejected: makes Convex storage a mandatory dependency of the core package. Core should have zero dependencies on any storage adapter. Also, schema pollution for projects that don't need media.

### D4 — `upload()` field stores media document ID (`v.id("<to-slug>")`)

**Why not a URL:** URLs are ephemeral. Signed URLs expire. CDN URLs change. Storing a media document ID means the frontend can always resolve the current URL by querying the media document. This is the same pattern as `relationship()` — store the ID, resolve the target at read time.

**Why not the storage ID directly:** The storage ID is adapter-specific and opaque. `v.id("_storage")` for Convex, a string key for S3. The media document abstracts this. It also carries metadata (alt text, filename, MIME type) that the frontend needs. If the storage backend changes, the media document IDs stay valid — only the `storageId` field changes.

**Why not `v.union(v.id("media"), v.null())` for optional fields:** The upload field's `required` option controls this. `upload({ to: "images", required: true })` generates `v.id("images")`; `upload({ to: "images", required: false })` generates `v.optional(v.id("images"))`. Same pattern as every other field type.

### D5 — Media collections are stored in `VexConfig.mediaCollections` (separate from `collections`)

**Why separate:** Media collections are conceptually different from content collections. They have a fixed shape (enforced by the adapter), are auto-generated, and are used by the upload field. Keeping them in a separate field means:
1. The admin panel can render them in a dedicated "Media" section (not mixed with "Collections").
2. Schema generation can validate `upload().to` references against `mediaCollections` only (not all collections).
3. The sidebar can show a "Media" header instead of each collection being a top-level item.
4. It's easier to add media-specific features (grid view, bulk upload, etc.) when the collections are known to be media.

**Why not merge into `VexConfig.collections`:** If media collections were merged into `collections`, the admin panel would have to detect them by convention (e.g., checking if the slug matches a `mediaCollections` entry). This is fragile. A separate field is explicit and type-safe.

**Why not a separate `media` config key:** `storageAdapters` is the adapter, and the adapter returns `mediaCollections`. The relationship is: `storageAdapters` → `mediaCollections`. Keeping `mediaCollections` on `VexConfig` (not `VexConfigInput`) means the user doesn't need to pass it — it's computed from the adapters.

### D6 — `deleted` boolean field is always present on media collections

**Why always present:** Admin queries filter by `deleted: false` to hide soft-deleted files. If the field were optional, the query would need to handle `deleted === false || deleted === undefined`, which is error-prone. Making it always present means `q.eq("deleted", false)` is always correct.

**Why in core, not adapter-specific:** The admin panel queries the media collection regardless of which adapter is active. If `deleted` were adapter-specific, the admin panel would need adapter-aware query logic. Keeping it in core means the admin panel is adapter-agnostic.

**Why default `false`:** Every new media file is visible by default. The deleted flag is only set to `true` by the delete mutation when `softDelete` is enabled.

### D7 — Admin UI supports media picker + direct upload

**Why both modes:** Content editors have two workflows:
1. **Reuse existing media** — pick an image from the library (e.g., a logo used on multiple pages).
2. **Upload new media** — drag a file directly into the page editor (e.g., a screenshot specific to this post).

Both workflows are common. The upload field input supports both: empty state shows a dropzone + "Browse media library" button; filled state shows a thumbnail + "Change" button that opens the picker.

**Why not a single mode:** If only the picker were available, editors would need to upload files in a separate page before they could use them. If only direct upload were available, there would be no way to reuse media across documents. Both modes are necessary for a complete CMS.

### D8 — Cascade delete is default, soft delete is opt-in

**Why cascade delete by default:** Most users expect "delete a media file" to mean "delete the file." A soft delete that leaves the file in storage is surprising. Making it opt-in (`softDelete: true`) means the user explicitly chooses the safer but more complex behavior.

**Why soft delete is needed:** Some users want audit trails, recovery, or "undo" for accidental deletions. Soft delete preserves the media document and marks it deleted. A scheduled cleanup job can purge old deleted files. This is the same pattern as document versioning (draft/published) — preserve state, clean up later.

**Why the `deleted` field is always present:** Even when soft delete is disabled, the field exists. This means a migration from hard delete to soft delete doesn't require a schema change — just flip the `softDelete` flag and update the delete mutation. The admin panel queries already filter by `deleted: false`.

### D9 — Upload is a distinct field type (not a relationship variant)

**Why not reuse `relationship({ to: "media" })`:** The upload field has unique UI requirements: a dropzone, a media picker, a thumbnail preview, and an upload-in-progress spinner. A relationship field has a dropdown, a search input, and a create-new button. These UIs are different enough that merging them would make both worse.

**Why not a `relationship` subtype:** If `upload` were `relationship({ to: "media", ui: "upload" })`, the `relationship` field type would need to support arbitrary UI modes. This is a premature abstraction. The upload field is a first-class type with its own validator (`v.id("<to>")`), its own input component, and its own cell component. When a third media-reference UI emerges (e.g., a "media gallery" picker), we can evaluate whether a generalization is warranted.

**Why the validator is `v.id("<to>")` (same as relationship):** The underlying data type is the same — a document ID reference. The upload field differs at the UI layer, not the data layer. This is consistent with how `text` and `textarea` would differ (same underlying type, different UI).

### D10 — Adapter exports `defineMediaCollection()` — wraps core's `defineCollection()`

**Why the adapter exports it:** The adapter needs to add adapter-specific fields (e.g., `convexUrl`, `width`, `height`) to the media collection. Core's `defineCollection()` doesn't know about these fields. The adapter's `defineMediaCollection()` is the one-stop shop for creating media collections with all required fields.

**Why core doesn't export `defineMediaCollection()`:** The required fields differ between adapters. Core enforces `alt`, `filename`, `mimeType`, `size`, `storageId`, `deleted`. The Convex adapter adds `convexUrl`, `width`, `height`. An S3 adapter would add `bucket`, `key`, `etag`. A Vercel Blob adapter would add `blobUrl`, `token`. Each adapter has its own `defineMediaCollection()` that adds its own fields.

**Why not require users to use `defineCollection()` directly:** The user would have to manually add `alt`, `filename`, `mimeType`, `size`, `storageId`, `deleted`, and adapter-specific fields. This is verbose and error-prone. The adapter's `defineMediaCollection()` adds all required fields automatically.

### D11 — `to` parameter on `upload()` is required — no default

**Why required:** With multiple media collections allowed, there is no single "default" collection. If the user has `images`, `videos`, and `documents`, which one does `upload()` without `to` reference? Requiring `to` is explicit and avoids ambiguity.

**Why not default to "media":** Only when a single `"media"` collection exists would this make sense. But as soon as the user defines custom media collections, the default becomes meaningless. Requiring `to` is consistent across all configurations.

**Why not type-safe `to: MediaCollectionSlug`:** The media collection slugs are defined at runtime (in the adapter config), not at compile time. TypeScript can't validate `to: "images"` against dynamically defined collections. The validation happens at config time (`defineConfig()`), which is sufficient. A future enhancement could use module augmentation or codegen to provide compile-time validation.

### D12 — Adapter exports Convex functions directly (not callbacks or runtime methods)

**Why direct exports:** The `@vexcms/better-auth` adapter uses this pattern: it exports Convex functions (`getUserById`, `validateSession`, etc.) from `src/convex/`, and the user imports them into their `convex/` directory. This is the established pattern for VexCMS adapters. The storage adapter follows the same convention: export `generateUploadUrl`, `uploadComplete`, `deleteMedia`, `getUrl` from `src/convex/`.

**Why not callback/wrapper pattern:** The core package could export a generic `createUploadComplete(callbacks)` function, and the adapter provides the callbacks. But this creates an extra abstraction layer that doesn't add value. The Convex functions are the primitives — the adapter just implements them with the correct validator factories. The user wires them up directly.

**Why not runtime methods on the adapter object:** The adapter object is created at build time (in `vex.config.ts`). It can't hold React hooks or Convex function references (which are runtime objects). The adapter object stores config (collections, softDelete flag), not functions. The functions are exported separately and imported by the user into their Convex project.

**Why the React components call the functions directly:** The upload component uses `useMutation(api.media.generateUploadUrl)` — standard Convex React. For multi-adapter, the component looks up the adapter name in the registry and uses `useMutation(registry.convex.generateUploadUrl)`. This is straightforward and doesn't require any wrapper functions.

### D13 — Multi-adapter support via optional storage registry

**Why optional:** For single-adapter setups, no registry is needed. The React components use the default function paths (`api.media.generateUploadUrl`). Only multi-adapter setups need the registry. This keeps the overhead at zero for the 90% case.

**Why the registry is in the user's app, not core or React:**
- Core is framework-agnostic — it has no React hooks, no Convex client, no `useMutation`.
- React doesn't know which adapters are installed — it can't import all adapters (bundling nightmare).
- Function references are runtime objects (`api.media.generateUploadUrl`) — not serializable, can't be stored in config.

**Why the registry is short:** One 5-line file per adapter. The user already imports adapter functions into their `convex/` directory. The registry is just mapping those imports to names.

**Why not fully automatic:** The React package can't detect which npm packages are installed. It can't scan `node_modules` for adapter packages. The only way to know which adapters are active is for the user to tell you — via the registry.

**Why not CLI-generated:** `vex dev` could read `storageAdapters` and generate the registry. But the CLI needs to know the function paths, which requires the adapter to export a manifest. This adds complexity that isn't needed for v1. The manual registry is acceptable for multi-adapter, which is a future use case.

### D14 — Core exports validator factories for adapter function signatures

**Why enforce signatures:** Every adapter's Convex functions must accept the same arguments and return the same shapes. Otherwise, the React components can't call them generically. The `generateUploadUrl` from the Convex adapter and the `generateUploadUrl` from the S3 adapter must both accept `{ fileName, mimeType, size }` and return `{ uploadUrl, storageId }`.

**Why validator factories:** Convex uses `v.object()` for argument validation. If every adapter defines its own validators, subtle differences in shape (e.g., `fileName` vs `filename`) cause runtime errors. Centralizing the validators in core ensures every adapter uses the exact same shape. TypeScript also enforces this at compile time if the adapter imports and uses the factory.

**Why not just a TypeScript interface:** TypeScript interfaces don't enforce runtime behavior. Two adapters could both implement `generateUploadUrl` with the same TypeScript signature but different Convex validators. The validators are the runtime enforcement layer.

**Why return value validators too:** The React components depend on the return shape. If `generateUploadUrl` returns `{ uploadUrl: string }` from one adapter and `{ url: string }` from another, the upload component breaks. Return value validators ensure consistency.

### D15 — `generateUploadUrl` returns a polymorphic upload instruction object

**Why an object, not a string:** Returning a plain string URL (`"https://..."`) would work for the presigned URL pattern. But future upload methods (direct upload, chunked upload, third-party SDK) need additional metadata. An object can be extended without breaking the interface.

**The polymorphic shape for v1:**
```ts
{ uploadUrl: string, storageId: string, method?: "PUT" | "POST", headers?: Record<string, string> }
```

**Future extensions without breaking the interface:**
```ts
// Direct upload endpoint
{ type: "directUpload", endpoint: string, method: "POST", headers: Record<string, string> }

// Third-party SDK
{ type: "sdkUpload", provider: string, uploadPreset: string }

// Chunked upload
{ type: "chunked", chunkSize: number, initiateUrl: string, completeUrl: string }
```

**Why no `type` field for v1:** The presigned URL pattern is the default. Adding `type` now would require the upload component to check it. For v1, we only support presigned URLs, so the component can assume the `uploadUrl` field exists. When we add new types, we add the `type` field and update the component to dispatch on it.

### D16 — All 4 adapter functions are required

**The 4 functions:**
1. `generateUploadUrl` (action) — gets a presigned URL/token for uploading
2. `uploadComplete` (mutation) — creates the media document after upload
3. `deleteMedia` (mutation) — deletes the media document and file
4. `getUrl` (query) — gets the URL for rendering the file

**Why all required:** Every storage adapter must support the full lifecycle: upload a file, create a document, render the file, delete the file. A partial adapter (e.g., read-only, write-only) is not a valid storage adapter in VexCMS. If a provider doesn't support a feature, the adapter must emulate it (e.g., a no-op `deleteMedia` that logs a warning).

**Why not optional functions:** Optional functions would make the React components need to check for existence before calling. This adds complexity and conditional UI (e.g., hide the delete button if `deleteMedia` is missing). Making all functions required means the UI is consistent across adapters. The adapter author handles any emulation.

**Why not `listMedia` and `searchMedia` as adapter functions:** These query the media collection (a Convex table), not the storage provider. They are generic — they work the same for all adapters. Core implements them as standard Convex queries on the media collection tables. The adapter doesn't need to provide them.

### D17 — Batch upload via `Promise.all` on `uploadComplete`

**Why not `uploadMany`:** The adapter only exports single-file functions. The React component handles batching by calling `uploadComplete` once per file in parallel. This is:
- Simpler for the adapter author (only one function to implement)
- More flexible for the caller (controls concurrency, progress tracking, retry logic)
- Works identically for every adapter (no adapter-specific batch logic)
- Each file is an independent transaction (no need for atomic batching)

**Why independent transactions are fine:** File uploads are independent. If one upload fails, the others can still succeed. The user can retry the failed file individually. This is the expected behavior for a CMS upload flow.

**Why `Promise.all` and not sequential:** Parallel uploads are faster. The user can drag 10 files and all 10 upload simultaneously. Sequential uploads would be slower and provide a worse UX.

**Why the adapter doesn't need to know about batching:** The adapter's `generateUploadUrl` and `uploadComplete` functions are per-file. The batching logic (parallelism, progress bars, cancellation) is a UI concern, not a storage concern. The adapter stays focused on storage operations.

### D18 — `listMedia` and `searchMedia` are generic Convex queries (not adapter-specific)

**Why generic:** These queries operate on the media collection tables (which are Convex collections). They don't interact with the storage provider at all. `listMedia` does `ctx.db.query("images").collect()`; `searchMedia` does `ctx.db.query("images").withSearchIndex("alt_text").search(q)`. Neither needs the storage provider.

**Why not adapter-specific:** If the adapter provided `listMedia`, it would need to know the collection schema, search index, pagination logic, etc. This is all standard Convex query behavior. The adapter shouldn't need to reimplement basic collection queries.

**Why the adapter doesn't need to provide them:** The media collections are Convex tables defined by the adapter but queried by core. The adapter defines the schema; core provides the generic CRUD and search operations. This separation is consistent with how regular collections work — the user defines the collection schema, and core provides `list`, `get`, `search`, etc.

---

## 5. Admin UI flow: uploading a file

### 5.1 Empty upload field

```
┌─────────────────────────────────────┐
│  Featured Image                       │
│  ─────────────────────────────────  │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   📁 Drop file here or      │    │
│  │   click to upload             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Browse media library]             │
│                                     │
│  Or paste a URL                       │
│  [____________________]               │
└─────────────────────────────────────┘
```

### 5.2 Upload in progress

```
┌─────────────────────────────────────┐
│  Featured Image                       │
│  ─────────────────────────────────  │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   ⏳ Uploading image.jpg...  │    │
│  │   45% ▓▓▓▓▓░░░░░             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Cancel]                             │
└─────────────────────────────────────┘
```

### 5.3 Upload complete — thumbnail shown

```
┌─────────────────────────────────────┐
│  Featured Image                       │
│  ─────────────────────────────────  │
│  ┌──────────────┐                     │
│  │              │  image.jpg         │
│  │  [thumbnail] │  128 KB • JPG      │
│  │              │                     │
│  └──────────────┘                     │
│  [Change]  [Remove]  [Edit]             │
│                                     │
│  Alt text: [A scenic mountain view]   │
└─────────────────────────────────────┘
```

### 5.4 Media picker popover (selecting from "images" collection)

```
┌────────────────────────────────────────────────┐
│  Select from Images                    [Upload]  │
│  ─────────────────────────────────────────────  │
│  Search: [________________]                    │
│  ─────────────────────────────────────────────  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │  img   │ │  img   │ │  img   │ │  img   │ │
│  │  1     │ │  2     │ │  3     │ │  4     │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │  img   │ │  img   │ │  img   │ │  img   │ │
│  │  5     │ │  6     │ │  7     │ │  8     │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ │
│                                                │
│  [Cancel]                        [Select]      │
└────────────────────────────────────────────────┘
```

---

## 6. Migration path: maprios site

The maprios site uses `upload` fields in the following places:

| Maprios Field | Target Media Collection | Block/Collection | Notes |
|---------------|------------------------|------------------|-------|
| `SiteConfig.favicon` | `"images"` | Global | Site-wide favicon |
| `SiteConfig.ogImage` | `"images"` | Global | Default social image |
| `Feature.image` | `"images"` | Feature block (inside array) | Per-feature image |
| `Gallery.items[].image` | `"images"` | Gallery block (inside array) | Gallery images |
| `Hero.backgroundImage` | `"images"` | Hero block | Background image |
| `Team.members[].photo` | `"images"` | Team block (inside array) | Team member photo |
| `Testimonial.image` | `"images"` | Testimonial block | Testimonial avatar |
| `CaseStudy.image` | `"images"` | CaseStudy block | Case study image |
| `Media.alt` | `"images"` | Media collection | Media metadata |

All of these are `upload()` fields in the VexCMS config, all referencing the `"images"` media collection:

```ts
const images = defineMediaCollection({
  slug: "images",
  fields: {
    alt: text({ required: true }),
  },
});

export default defineConfig({
  storageAdapters: [convexFileStorage({ mediaCollections: [images] })],
  collections: [
    defineCollection({
      slug: "pages",
      fields: {
        name: text({ required: true }),
        slug: text({ required: true }),
        blocks: blocks({
          blocks: [
            // ... all block definitions with upload({ to: "images" }) ...
          ],
        }),
      },
    }),
  ],
});
```

The React block components receive the media document ID and use the adapter's `getUrl()` to resolve the image URL at render time. For example, a Hero block component:

```tsx
export function HeroBlock({ backgroundImage, ...props }) {
  // backgroundImage is the media document ID (populated by the parent)
  const { url } = useQuery(api.images.getUrl, {
    collectionSlug: "images",
    mediaId: backgroundImage,
  });

  return (
    <div style={{ backgroundImage: `url(${url})` }}>
      {/* ... */}
    </div>
  );
}
```

---

## 7. Future extensibility: upload methods

The `generateUploadUrl` return type is designed to accommodate alternative upload methods without changing the adapter interface:

### 7.1 Presigned URL (v1 — implemented)

```ts
{ uploadUrl: "https://...", storageId: "pending" }
```

Client: POST file to `uploadUrl`. Server: `uploadComplete` creates the media document.

### 7.2 Direct upload endpoint (future)

```ts
{ type: "directUpload", endpoint: "/api/upload", method: "POST", headers: {} }
```

Client: POST file to `endpoint`. Server: receives file directly, creates media document.

### 7.3 Third-party SDK (future)

```ts
{ type: "sdkUpload", provider: "cloudinary", uploadPreset: "..." }
```

Client: uses Cloudinary SDK to upload. Server: `uploadComplete` receives the Cloudinary URL and creates the media document.

### 7.4 Chunked upload (future)

```ts
{ type: "chunked", chunkSize: 5_000_000, initiateUrl: "...", completeUrl: "..." }
```

Client: splits file into chunks, uploads each chunk, calls `completeUrl` to finalize. Server: reassembles chunks, creates media document.

### 7.5 How the adapter supports new methods

The adapter returns the appropriate shape from `generateUploadUrl`. The React upload component dispatches on the `type` field (or presence of `uploadUrl` for v1). No changes to the adapter interface are needed. The adapter author can add new upload methods by extending the return type and documenting the new `type` value.

The 4-function interface (`generateUploadUrl`, `uploadComplete`, `deleteMedia`, `getUrl`) remains unchanged. The adapter's `generateUploadUrl` simply returns a different shape, and the client's upload component handles it.
