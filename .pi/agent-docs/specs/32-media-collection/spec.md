# Spec 32 — Media Collection, Upload Field & Storage Adapter

## Status

Draft

## Overview

Build the media collection subsystem for VexCMS: `storageAdapters` as an **optional array** in `defineConfig()`, a `VexStorageAdapter` interface (patterned after `VexAuthAdapter`), a new `upload()` field type that references media collections by slug, and the `@vexcms/file-storage-convex` package as the first adapter. Supports **multiple media collections** and **multiple storage adapters simultaneously** — users define media collections via `defineMediaCollection()` (exported from the adapter), pass them to `convexFileStorage()`, and configure `storageAdapters: [convexFileStorage({ mediaCollections: [images] })]`. The adapter processes collections (adds required fields, validates, adds adapter-specific fields), tags them with `meta.storageAdapterName`, and returns them to core. Core stores them in `VexConfig.mediaCollections` (separate from `collections`) for admin panel rendering. The `upload()` field takes a **required** `to` parameter referencing the media collection slug. Admin panel works completely without any storage adapter configured; `upload()` fields are impossible without a configured adapter. The admin panel calls the correct adapter-specific Convex functions via an **optional storage registry** provided by the user for multi-adapter setups. For single-adapter setups, no registry is needed — components use the default function paths. This unblocks the maprios migration — every block uses images (hero backgrounds, feature images, gallery images, team photos, testimonial avatars, OG images, favicons).

## Code Effect Preview

### 1. VexConfig with multiple media collections — before (no media support)

```ts
// vex.config.ts
import { defineConfig, defineCollection, text } from "@vexcms/core";

export default defineConfig({
  collections: [posts],
});
```

### 1. VexConfig with multiple media collections — after (single adapter, no registry needed)

```ts
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

### 2. Storage registry for multi-adapter setups

```ts
// apps/www/lib/storageRegistry.ts — only needed for 2+ adapters
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
  return <AdminPanel storageRegistry={storageRegistry}>{children}</AdminPanel>;
}
```

### 3. Adapter functions enforced by core validators

```ts
// @vexcms/core/src/media/validators.ts
import { v } from "convex/values";

export const generateUploadUrlArgs = v.object({
  fileName: v.string(),
  mimeType: v.string(),
  size: v.number(),
});

export const generateUploadUrlReturn = v.object({
  uploadUrl: v.string(),
  storageId: v.string(),
  method: v.optional(v.union(v.literal("PUT"), v.literal("POST"))),
  headers: v.optional(v.record(v.string(), v.string())),
});

export const uploadCompleteArgs = v.object({
  collectionSlug: v.string(),
  storageId: v.string(),
  fileName: v.string(),
  mimeType: v.string(),
  size: v.number(),
  alt: v.optional(v.string()),
  adapterFields: v.optional(v.record(v.string(), v.any())),
});

export const uploadCompleteReturn = v.string(); // media document ID

export const deleteMediaArgs = v.object({
  collectionSlug: v.string(),
  mediaId: v.string(),
});

export const deleteMediaReturn = v.boolean();

export const getUrlArgs = v.object({
  collectionSlug: v.string(),
  mediaId: v.string(),
});

export const getUrlReturn = v.object({
  url: v.string(),
  expiresAt: v.optional(v.number()), // timestamp for signed URLs
});
```

### 4. Upload field references media collection by slug

```ts
// User-defined collection
featuredImage: upload({ to: "images", label: "Featured Image" });
// → generates: featuredImage: v.id("images") in Convex schema
// → stores: media document ID in the "images" collection
```

### 5. Generated types from media collections

After running `vex generate`, the CLI produces media collection interfaces,
`MediaCollectionSlug`, and `MediaDocumentBySlug` — same pattern as
`CollectionSlug` and `DocumentBySlug` for regular collections.

```ts
// src/vex.types.ts (generated)
import type { Id } from "@convex/_generated/dataModel"
import type { VexDocument } from "@vexcms/core"

export interface ImagesDocument extends VexDocument {
  _id: Id<"images">
  alt: string
  filename: string
  mimeType: string
  size: number
  storageId: string
  deleted: boolean
  convexUrl: string
  width?: number | null
  height?: number | null
  caption?: string | null
}

export interface VideosDocument extends VexDocument {
  _id: Id<"videos">
  alt: string
  filename: string
  mimeType: string
  size: number
  storageId: string
  deleted: boolean
  convexUrl: string
  width?: number | null
  height?: number | null
  duration?: number | null
}

export type MediaCollectionSlug = "images" | "videos"
export type MediaDocumentBySlug = {
  images: ImagesDocument
  videos: VideosDocument
}

declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    CollectionSlug: "posts"
    MediaCollectionSlug: "images" | "videos"
    DocumentBySlug: { posts: PostsDocument }
    MediaDocumentBySlug: { images: ImagesDocument; videos: VideosDocument }
    CollectionsFieldTypeMap: { ... }
  }
}
```

With these generated types, `upload({ to: "images" })` is compile-time safe —
`"images"` is validated against `MediaCollectionSlug`. Invalid slugs like
`upload({ to: "nonexistent" })` produce a type error after generation.

### 6. React upload field — media picker + direct upload

```tsx
// UploadFieldInput renders:
// - Empty state: dropzone + "Browse media library" button
// - Filled state: thumbnail + "Change" button
// - Clicking "Browse" opens MediaPicker popover with grid of "images" collection
// - Dropzone uploads file → creates media doc in "images" → stores ID in field
```

## API Surface

| Export                                                                         | Package                       | Purpose                                                           |
| ------------------------------------------------------------------------------ | ----------------------------- | ----------------------------------------------------------------- |
| `VexStorageAdapter`                                                            | `@vexcms/core`                | Interface for storage adapters                                    |
| `VexStorageConfigError`                                                        | `@vexcms/core`                | Error for invalid storage config                                  |
| `generateUploadUrlArgs`, `uploadCompleteArgs`, `deleteMediaArgs`, `getUrlArgs` | `@vexcms/core`                | Convex validator factories enforcing adapter function signatures  |
| `upload()`                                                                     | `@vexcms/core`                | Field config function for upload fields                           |
| `UploadField`                                                                  | `@vexcms/core`                | Resolved upload field type                                        |
| `UploadFieldInput`                                                             | `@vexcms/core`                | Input config type for upload fields                               |
| `convexFileStorage()`                                                          | `@vexcms/file-storage-convex` | Convex file storage adapter                                       |
| `defineMediaCollection()`                                                      | `@vexcms/file-storage-convex` | Helper to define media collections with required + adapter fields |
| `UploadFieldInput`                                                             | `@vexcms/react`               | React input component                                             |
| `UploadFieldCell`                                                              | `@vexcms/react`               | React cell component (thumbnail)                                  |
| `MediaLibraryPage`                                                             | `@vexcms/react`               | Media library collection view                                     |
| `MediaPicker`                                                                  | `@vexcms/react`               | Media picker popover                                              |
| `MediaUploadDropzone`                                                          | `@vexcms/react`               | File upload dropzone                                              |
| `StorageRegistry`                                                              | `@vexcms/react`               | Type for multi-adapter function registry                          |

## Status / Progress Checklist

- [ ] Core storage types (`VexStorageAdapter`, `VexStorageConfigError`, `mediaCollections` in `VexConfig`)
- [ ] Core storage validators (`generateUploadUrlArgs`, `uploadCompleteArgs`, `deleteMediaArgs`, `getUrlArgs`)
- [ ] Upload field type (config, types, validator, inputSchema) with `to` parameter
- [ ] Core `ADMIN_FIELDS` and `AdminField` union updated
- [ ] Storage adapter config integration (`VexConfigInput.storageAdapters`, `defineConfig` merge)
- [ ] Storage validation in `media/config.ts` (slug collision, upload field `to` validation, adapter merging)
- [ ] File storage convex adapter (`defineMediaCollection`, `convexFileStorage`, Convex functions)
- [ ] Storage registry context in React (optional, for multi-adapter)
- [ ] React upload field input component (dropzone + picker)
- [ ] React upload field cell component (thumbnail)
- [ ] React media library page (grid view)
- [ ] React media picker popover
- [ ] Field component registry updated
- [ ] Admin panel media collection routes
- [ ] Tests for upload field type
- [ ] Tests for storage adapter merge logic
- [ ] Tests for media collection validation
- [ ] Tests for React upload components

## Design Decisions

| #   | Decision (one line)                                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Storage adapter mimics `VexAuthAdapter` pattern — adapter receives media collections, processes them, returns them to core.                                                                                                                                                               |
| D2  | Core enforces 6 base fields on every media collection: `alt`, `filename`, `mimeType`, `size`, `storageId`, `deleted`. Adapter adds adapter-specific fields.                                                                                                                               |
| D3  | `storageAdapters` is an **optional array** in `VexConfigInput` — no default adapter, no auto-application. Admin panel works without any adapter configured. `upload()` fields are impossible without a configured adapter.                                                                |
| D4  | `upload()` field stores media document ID (`v.id("<to-slug>")`) — `to` parameter references the media collection slug.                                                                                                                                                                    |
| D5  | Media collections are stored in `VexConfig.mediaCollections` (separate from `collections`) — admin panel renders them in a dedicated "Media" section.                                                                                                                                     |
| D6  | `deleted` boolean field is always present on media collections — soft delete behavior enabled by adapter `softDelete` option.                                                                                                                                                             |
| D7  | Admin UI supports media picker + direct upload — picker shows grid of target media collection, dropzone uploads directly.                                                                                                                                                                 |
| D8  | Cascade delete is default — `softDelete: true` opts into setting `deleted: true` instead of physical deletion.                                                                                                                                                                            |
| D9  | Upload is a distinct field type (not a relationship variant) — custom UI (dropzone, picker, thumbnail) justifies separate type.                                                                                                                                                           |
| D10 | Adapter exports `defineMediaCollection()` — wraps core collection creation, adds required + adapter-specific fields.                                                                                                                                                                      |
| D11 | `to` parameter on `upload()` is **required** — no default. User must explicitly reference the media collection.                                                                                                                                                                           |
| D12 | Adapter exports **Convex functions directly** (like `@vexcms/better-auth`) — `generateUploadUrl`, `uploadComplete`, `deleteMedia`, `getUrl`. The user imports them into their `convex/` directory. React components call them via `useMutation`/`useAction`. No callback/wrapper pattern. |
| D13 | Multi-adapter support via **optional storage registry** — user provides a registry mapping adapter names to Convex function references. Single-adapter setups use default function paths without a registry.                                                                              |
| D14 | Core exports **validator factories** for adapter function signatures — every adapter must use these validators in its Convex function definitions. TypeScript and Convex runtime enforce compliance.                                                                                      |
| D15 | `generateUploadUrl` returns a **polymorphic upload instruction object** (`{ uploadUrl: string, storageId: string, method?, headers? }`) — enables future support for direct upload, chunked upload, and third-party SDK upload without changing the interface.                            |
| D16 | Adapter functions are **all required** — `generateUploadUrl`, `uploadComplete`, `deleteMedia`, `getUrl`. Every storage adapter must implement all four. There are no optional adapter functions.                                                                                          |
| D17 | Batch upload is handled by **Promise.all on `uploadComplete`** — the adapter never exports `uploadMany`. The React component calls `uploadComplete` once per file.                                                                                                                        |
| D18 | `listMedia` and `searchMedia` are **generic Convex queries implemented by core** — not adapter-specific. They query the media collection tables directly.                                                                                                                                 |

## Out of Scope

| Feature                                                                  | Cross-reference        | Why deferred                                                                                                                         |
| ------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| User-defined fields on media collection beyond `defineMediaCollection()` | Future spec            | The adapter's `defineMediaCollection()` is the only way to create media collections. User can add fields via the `fields` parameter. |
| Form builder integration (upload in forms)                               | Spec 24 (Form Builder) | Separate feature — forms use `upload()` in block configs, not form submissions.                                                      |
| Media transformations (resize, crop, rotate)                             | Future spec            | Complex image processing, not needed for v1.                                                                                         |
| CDN URL generation                                                       | Future spec            | Convex storage URLs are sufficient for now.                                                                                          |
| Image optimization (WebP, responsive srcset)                             | Future spec            | Can be added via Next.js Image component later.                                                                                      |
| Bulk upload / drag-and-drop multiple files                               | Future spec            | Single-file upload is sufficient for v1. Batch is handled by `Promise.all` on single-file calls.                                     |
| File type restrictions per upload field                                  | Future spec            | MIME type validation can be added later.                                                                                             |
| Max file size per upload field                                           | Future spec            | Global limits via Convex storage are sufficient.                                                                                     |
| Video/audio file handling                                                | Future spec            | Image-focused for maprios v1.                                                                                                        |

| Upload field in array items (gallery) | Spec 34 (Marketing Blocks) | Array field already supports nested fields; `upload()` works inside `array()`. |
| Chunked upload / resumable upload | Future spec | `generateUploadUrl` return type is polymorphic to accommodate this later. |
| Third-party SDK upload (Cloudinary widget, UploadThing) | Future spec | Adapter can return `type: "sdkUpload"` from `generateUploadUrl` later. |
| Direct upload to server (multipart/form-data) | Future spec | Adapter can return `type: "directUpload"` from `generateUploadUrl` later. |

## Target Directory Structure

```
packages/core/src/
  media/
    types.ts                    🟡 MODIFY — VexStorageAdapter, VexStorageConfigError (replace existing copy-paste)
    validators.ts               🟡 NEW — Convex validator factories for adapter functions
    config.ts                   🟡 NEW — Storage adapter validation (slug collision, upload refs)
    index.ts                    🟡 NEW — barrel
  types/
    generated.ts                🟡 MODIFY — add MediaCollectionSlug, MediaDocumentBySlug
  index.ts                      🟡 MODIFY — export media types
  fields/
    upload/
      types.ts                  🟡 NEW — UploadFieldInput, UploadField
      config.ts                 🟡 NEW — upload() function with `to` parameter
      validator.ts              🟡 NEW — uploadFieldToValidator (v.id("<to>"))
      inputSchema.ts            🟡 NEW — uploadFieldToInputSchema (z.string())
      index.ts                  🟡 NEW — barrel
    constants.ts                🟡 MODIFY — add upload to ADMIN_FIELDS
    types.ts                    🟡 MODIFY — add UploadField to AdminField union
    index.ts                    🟡 MODIFY — export upload
    validators/index.ts         🟡 MODIFY — add upload case
    inputSchemas/index.ts       🟡 MODIFY — add upload case
  config/
    types.ts                    🟡 MODIFY — add storageAdapters, mediaCollections to VexConfig
    config.ts                   🟡 MODIFY — merge media collections, call media/config.ts
    sanitizeConfig.ts           🟡 MODIFY — strip storage adapter functions

packages/file-storage-convex/src/
  index.ts                      🟡 MODIFY — implement VexStorageAdapter, defineMediaCollection, convexFileStorage
  convex/
    generateUploadUrl.ts        🟡 NEW — Convex action for generating upload URL
    uploadComplete.ts           🟡 NEW — Convex mutation for creating media doc after upload
    deleteMedia.ts              🟡 NEW — Convex mutation for deleting media
    getUrl.ts                   🟡 NEW — Convex query for getting file URL
    schema.ts                   🟡 NEW — Convex schema for adapter functions
  test/
    convex/schema.ts            🟡 NEW — Test fixture schema

packages/react/src/
  fields/
    upload/
      Input.tsx                 🟡 NEW — UploadFieldInput (dropzone + picker)
      Cell.tsx                  🟡 NEW — UploadFieldCell (thumbnail)
      index.ts                  🟡 NEW — barrel
    index.tsx                   🟡 MODIFY — register upload field
  adapter.ts                    🟡 MODIFY — register upload in reactAdapter
  components/
    media/
      MediaUploadDropzone.tsx   🟡 NEW — File upload dropzone
      MediaPicker.tsx           🟡 NEW — Media picker popover
      MediaLibrary.tsx          🟡 NEW — Media library grid view
      index.ts                  🟡 NEW — barrel
  context/
    StorageRegistryContext.tsx  🟡 NEW — Optional context for multi-adapter function registry

apps/www/
  app/(admin)/media/            🟡 NEW — Media library page route
  lib/storageRegistry.ts        🟡 NEW — Optional: user-provided multi-adapter registry
```

## Implementation Order

### Step 1 — Core storage types, validators, and interfaces [agent]

Create the `VexStorageAdapter` interface, `VexStorageConfigError` class, Convex validator factories for adapter function signatures, and update `VexConfig` types. Every media collection is tagged with `meta.storageAdapterName`.

**Files:**

- `packages/core/src/media/types.ts` (MODIFY)
- `packages/core/src/media/validators.ts` (NEW)
- `packages/core/src/media/config.ts` (NEW)
- `packages/core/src/media/index.ts` (NEW)
- `packages/core/src/types/generated.ts` (MODIFY)
- `packages/core/src/index.ts` (MODIFY)
- `packages/core/src/config/types.ts` (MODIFY)

**Edge cases:**

> **Edge: User defines a media collection with missing required fields.** The adapter's `defineMediaCollection()` adds them automatically. If the user bypasses `defineMediaCollection()` and passes a raw collection, the adapter validates and throws `VexStorageConfigError` if required fields are missing.

> **Edge: User defines a regular collection with the same slug as a media collection.** The merge logic in `media/config.ts` checks for slug collisions between `collections` and `mediaCollections`. If a collision exists, throw `VexStorageConfigError` with a descriptive message.

> **Edge: No storage adapter configured and no upload fields.** Admin panel works normally, no media section. No error.

> **Edge: No storage adapter configured but upload fields exist.** `defineConfig()` throws `VexStorageConfigError` — `upload()` requires a configured adapter.

> **Edge: Upload field `to` references non-existent media collection.** `media/config.ts` validates that every `upload().to` value matches a media collection slug. If not, throw `VexStorageConfigError` listing the missing collections.

> **Edge: Multiple storage adapters define media collections with the same slug.** `media/config.ts` detects duplicate slugs across all adapters and throws `VexStorageConfigError`.

---

#### `packages/core/src/media/types.ts` (MODIFY)

````ts
import type { CollectionConfig } from "../collections";

/**
 * A storage adapter for VexCMS — defines media collections, file storage
 * backend, and deletion behavior.
 *
 * Adapters receive user-defined media collections via `defineMediaCollection()`,
 * validate them, add required fields and adapter-specific fields, tag them with
 * `meta.storageAdapterName`, and return the processed collections to core. Core
 * stores them in `VexConfig.mediaCollections` for schema generation and admin
 * panel rendering.
 *
 * @example
 * ```ts
 * import { convexFileStorage, defineMediaCollection } from "@vexcms/file-storage-convex";
 *
 * const images = defineMediaCollection({
 *   slug: "images",
 *   fields: { alt: text({ required: true }) },
 * });
 *
 * export default defineConfig({
 *   storageAdapters: [convexFileStorage({ mediaCollections: [images] })],
 *   collections: [posts],
 * });
 */
export interface VexStorageAdapter {
  /** Provider identifier for debugging, telemetry, and registry lookup. */
  readonly name: string;

  /**
   * Processed media collections ready for schema generation and admin panel.
   *
   * The adapter validates, augments, and returns these collections. Each
   * collection is tagged with `meta.storageAdapterName` equal to this adapter's
   * `name`. Core merges all collections from all adapters into
   * `VexConfig.mediaCollections` — separate from user-defined `collections`.
   */
  readonly mediaCollections: CollectionConfig[];

  /**
   * When `true`, delete operations set `deleted: true` on the media document
   * instead of physically removing the file. The file remains in storage until
   * a scheduled cleanup job purges it.
   *
   * @default false
   */
  readonly softDelete?: boolean;
}

/**
 * Error thrown when storage configuration is invalid.
 *
 * Covers: missing required fields on media collections, slug collisions
 * (between collections and media collections, or across adapters), upload
 * fields referencing non-existent media collections, or `upload()` used
 * without a configured storage adapter.
 */
export class VexStorageConfigError extends Error {
  /**
   * @param message — Human-readable description of the configuration error.
   */
  constructor(message: string) {
    super(message);
    this.name = "VexStorageConfigError";
  }
}
````

---

#### `packages/core/src/media/validators.ts` (NEW)

```ts
import { v } from "convex/values";

/**
 * Convex validator for `generateUploadUrl` arguments.
 * Every storage adapter must use this in its `generateUploadUrl` action.
 */
export const generateUploadUrlArgs = v.object({
  fileName: v.string(),
  mimeType: v.string(),
  size: v.number(),
});

/**
 * Convex validator for `generateUploadUrl` return value.
 * Returns a polymorphic upload instruction object that the client interprets.
 *
 * For v1, only `uploadUrl` + `storageId` are used (presigned URL pattern).
 * `method` and `headers` enable future upload methods (direct upload, chunked).
 */
export const generateUploadUrlReturn = v.object({
  uploadUrl: v.string(),
  storageId: v.string(),
  method: v.optional(v.union(v.literal("PUT"), v.literal("POST"))),
  headers: v.optional(v.record(v.string(), v.string())),
});

/**
 * Convex validator for `uploadComplete` arguments.
 * Every storage adapter must use this in its `uploadComplete` mutation.
 */
export const uploadCompleteArgs = v.object({
  collectionSlug: v.string(),
  storageId: v.string(),
  fileName: v.string(),
  mimeType: v.string(),
  size: v.number(),
  alt: v.optional(v.string()),
  adapterFields: v.optional(v.record(v.string(), v.any())),
});

/**
 * Convex validator for `uploadComplete` return value.
 */
export const uploadCompleteReturn = v.string();

/**
 * Convex validator for `deleteMedia` arguments.
 * Every storage adapter must use this in its `deleteMedia` mutation.
 */
export const deleteMediaArgs = v.object({
  collectionSlug: v.string(),
  mediaId: v.string(),
});

/**
 * Convex validator for `deleteMedia` return value.
 */
export const deleteMediaReturn = v.boolean();

/**
 * Convex validator for `getUrl` arguments.
 * Every storage adapter must use this in its `getUrl` query.
 */
export const getUrlArgs = v.object({
  collectionSlug: v.string(),
  mediaId: v.string(),
});

/**
 * Convex validator for `getUrl` return value.
 * `expiresAt` is a timestamp (ms) for signed URLs that expire.
 */
export const getUrlReturn = v.object({
  url: v.string(),
  expiresAt: v.optional(v.number()),
});
```

---

#### `packages/core/src/media/index.ts` (NEW)

```ts
export * from "./types";
export * from "./validators";
export * from "./config";
```

---

#### `packages/core/src/config/types.ts` (MODIFY)

Add `storageAdapters` and `mediaCollections` to `VexConfigInput` and `VexConfig`:

```ts
import type { VexStorageAdapter } from "../storage";

// In VexConfigInput:
export interface VexConfigInput {
  // ... existing fields ...

  /**
   * Storage adapters for file uploads and media collections.
   *
   * When omitted, no media support is available. The admin panel works
   * completely without any storage adapter. `upload()` fields are
   * impossible without a configured adapter — `defineConfig()` throws
   * `VexStorageConfigError` if `upload()` is used without adapters.
   *
   * For multiple adapters, provide a storage registry in the React app
   * so the admin panel knows which adapter functions to call for each
   * media collection.
   *
   * @see {@link VexStorageAdapter} for the adapter interface
   * @see {@link convexFileStorage} from `@vexcms/file-storage-convex` for the first adapter
   */
  storageAdapters?: VexStorageAdapter[];

  // ... other fields ...
}

// In VexConfig:
export interface VexConfig {
  // ... existing fields ...

  /**
   * Storage adapters registered with this config. Processed media collections
   * from all adapters are available via `mediaCollections`.
   */
  storageAdapters?: VexStorageAdapter[];

  /**
   * Media collections — processed by storage adapters and stored separately
   * from user-defined `collections`. These appear in the admin panel under a
   * dedicated "Media" section. Each collection is tagged with
   * `meta.storageAdapterName` indicating which adapter owns it.
   */
  mediaCollections: CollectionConfig[];

  // ... other fields ...
}
```

---

#### `packages/core/src/media/types.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { VexStorageConfigError } from "./types";

describe("VexStorageConfigError", () => {
  it("has the correct name", () => {
    const error = new VexStorageConfigError("test");
    expect(error.name).toBe("VexStorageConfigError");
  });

  it("carries the message", () => {
    const error = new VexStorageConfigError("missing field");
    expect(error.message).toBe("missing field");
  });
});
```

---

#### `packages/core/src/types/generated.ts` (MODIFY)

Add `MediaCollectionSlug` and `MediaDocumentBySlug` to the generated types file, following the same pattern as `CollectionSlug` and `DocumentBySlug`:

```ts
// Existing content — add these two types below DocumentBySlug

/**
 * Union of all media collection slugs registered by storage adapters.
 *
 * - **Before `vex generate`:** resolves to `string` — any string is accepted.
 * - **After `vex generate`:** resolves to a specific union, e.g. `"images" | "videos"`.
 *
 * Used by `upload({ to: ... })` so that invalid media collection slugs are
 * caught at compile time after generation.
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 */
export type MediaCollectionSlug = GeneratedVexTypes extends {
  MediaCollectionSlug: infer S extends string;
}
  ? S
  : string;

/**
 * Maps each media collection slug to its generated document interface.
 *
 * - **Before `vex generate`:** resolves to `Record<string, unknown>`.
 * - **After `vex generate`:** resolves to a typed map, e.g.
 *   `{ images: ImagesDocument; videos: VideosDocument }`.
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 */
export type MediaDocumentBySlug = GeneratedVexTypes extends {
  MediaDocumentBySlug: infer D extends Record<string, unknown>;
}
  ? D
  : Record<string, unknown>;
```

The generated `vex.types.ts` also includes `MediaCollectionSlug` and `MediaDocumentBySlug` in the `declare module` augmentation block:

```ts
declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    CollectionSlug: "posts" | "authors"
    MediaCollectionSlug: "images" | "videos"
    DocumentBySlug: { posts: PostsDocument; authors: AuthorsDocument }
    MediaDocumentBySlug: { images: ImagesDocument; videos: VideosDocument }
    CollectionsFieldTypeMap: { ... }
  }
}
```

---

#### `packages/core/src/index.ts` (MODIFY)

Add media types to the core package exports:

```ts
// ============================================================================
// MEDIA / STORAGE ADAPTER
// ============================================================================

export { type VexStorageAdapter, VexStorageConfigError } from "./media/types";
export { validateAndMergeStorageConfig } from "./media/config";
export {
  generateUploadUrlArgs,
  generateUploadUrlReturn,
  uploadCompleteArgs,
  uploadCompleteReturn,
  deleteMediaArgs,
  deleteMediaReturn,
  getUrlArgs,
  getUrlReturn,
} from "./media/validators";
```

### Run tests

```bash
pnpm --filter @vexcms/core test
```

---

### Step 2 — Upload field type in core [agent]

Add the `upload()` field type with a `to` parameter referencing the media collection slug. Register it in `ADMIN_FIELDS`, `AdminField` union, validators, and inputSchemas.

**Files:**

- `packages/core/src/fields/upload/types.ts` (NEW)
- `packages/core/src/fields/upload/config.ts` (NEW)
- `packages/core/src/fields/upload/validator.ts` (NEW)
- `packages/core/src/fields/upload/inputSchema.ts` (NEW)
- `packages/core/src/fields/upload/index.ts` (NEW)
- `packages/core/src/fields/constants.ts` (MODIFY)
- `packages/core/src/fields/types.ts` (MODIFY)
- `packages/core/src/fields/index.ts` (MODIFY)
- `packages/core/src/fields/validators/index.ts` (MODIFY)
- `packages/core/src/fields/inputSchemas/index.ts` (MODIFY)

**Edge cases:**

> **Edge: `to` is empty string or invalid slug.** `upload()` throws at config time if `to` is empty or doesn't match the collection slug regex (`/^[a-zA-Z][a-zA-Z0-9_-]*$/`).

> **Edge: Media collection with `to` slug doesn't exist.** Validation happens in `media/config.ts` at config time — not at `upload()` call time. All `upload()` fields are validated against `mediaCollections` slugs.

> **Edge: Upload field without storage adapter.** If `upload()` is used but `storageAdapters` is undefined or empty, `defineConfig()` throws `VexStorageConfigError`.

---

#### `packages/core/src/fields/upload/types.ts` (NEW)

````ts
import type { BaseField, BaseFieldInput } from "../baseTypes";
import type { MediaCollectionSlug } from "../../types/generated";

/**
 * Input configuration for an `upload()` field — the `to` parameter is required
 * and references the target media collection slug.
 */
export interface UploadFieldInput<
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TFieldMeta> {
  /**
   * The slug of the media collection that stores uploaded files for this field.
   *
   * Must match a media collection defined via a storage adapter's
   * `defineMediaCollection()`. After running `vex generate`, this is typed as
   * `MediaCollectionSlug` — a union of all media collection slugs in the project.
   * Before generation, it falls back to `string`.
   *
   * Config validation (in `media/config.ts`) also checks at runtime that the
   * slug exists in `VexConfig.mediaCollections`.
   *
   * @example
   * ```ts
   * upload({ to: "images", label: "Featured Image" })
   */
  to: MediaCollectionSlug;
}

/**
 * Resolved upload field definition after defaults are applied.
 */
export interface UploadField<
  TFieldMeta extends {} = {},
> extends BaseField<TFieldMeta> {
  readonly type: "upload";
  readonly to: MediaCollectionSlug;
  readonly interfaceType: "string";
}
````

---

#### `packages/core/src/fields/upload/config.ts` (NEW)

````ts
import { ADMIN_FIELDS } from "../constants";
import type { UploadFieldInput, UploadField } from "./types";

/**
 * Creates an upload field that stores a reference to a media document.
 *
 * The `to` parameter specifies which media collection receives uploaded files.
 * At config validation time, the `to` slug is checked against the media
 * collections returned by all configured storage adapters.
 *
 * @param options — Upload field configuration. `to` is required.
 * @returns Resolved upload field definition.
 *
 * @throws {Error} If `to` is empty or not a valid slug (`/^[a-zA-Z][a-zA-Z0-9_-]*$/`).
 *
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     featuredImage: upload({ to: "images", label: "Featured Image" }),
 *   },
 * });
 */
export function upload<TFieldMeta extends {} = {}>(
  options: UploadFieldInput<TFieldMeta>,
): UploadField<TFieldMeta> {
  if (!options.to || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.to)) {
    throw new Error(
      `upload(): "to" must be a valid collection slug. Got "${options.to}".`,
    );
  }

  return {
    type: ADMIN_FIELDS.upload.type,
    to: options.to,
    interfaceType: ADMIN_FIELDS.upload.interfaceType,
    label: options.label ?? "",
    required: options.required ?? false,
    defaultValue: options.defaultValue,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options.admin,
    },
    description: options.description,
    interfaceDescription: options.interfaceDescription,
    index: options.index,
    meta: options.meta,
  };
}
````

---

#### `packages/core/src/fields/upload/validator.ts` (NEW)

```ts
import { applyBaseValidators } from "../validators/utils";
import type { UploadField } from "./types";

/**
 * Generates the Convex schema validator for an upload field.
 *
 * Stores a media document ID: `v.id("<to-slug>")`. The `to` slug is the
 * media collection name — schema generation validates that the collection exists.
 *
 * @param props — Validator generation options.
 * @param props.field — The resolved upload field definition.
 * @returns Convex validator string, e.g. `"v.id(\"images\")"` or
 *   `"v.optional(v.id(\"images\"))"`.
 */
export function uploadFieldToValidator(props: { field: UploadField }): string {
  const validator = `v.id("${props.field.to}")`;
  return applyBaseValidators({ field: props.field, validator });
}
```

---

#### `packages/core/src/fields/upload/inputSchema.ts` (NEW)

```ts
import { z } from "zod";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { UploadField } from "./types";

/**
 * Generates the Zod input schema for an upload field.
 *
 * The form stores a media document ID string. The upload component validates
 * that the ID points to an existing media document at the UI level (by querying
 * the media collection), but the Zod schema is a simple string check.
 *
 * @param props — Input schema generation options.
 * @param props.field — The resolved upload field definition.
 * @returns Zod schema for the form field value.
 */
export function uploadFieldToInputSchema(props: {
  field: UploadField;
}): z.ZodType<string | undefined> {
  const schema = z.string();
  return applyBaseInputSchemaMeta({ field: props.field, schema });
}
```

---

#### `packages/core/src/fields/upload/index.ts` (NEW)

```ts
export * from "./types";
export * from "./config";
export * from "./validator";
export * from "./inputSchema";
```

---

#### `packages/core/src/fields/constants.ts` (MODIFY)

Add `upload` to `ADMIN_FIELDS`:

```ts
export const ADMIN_FIELDS = {
  // ... existing fields ...
  upload: {
    type: "upload",
    interfaceType: "string",
    validator: 'v.id("media")', // placeholder — actual validator uses the `to` slug
    defaultValue: undefined,
  },
} as const;
```

---

#### `packages/core/src/fields/types.ts` (MODIFY)

Add `UploadField` to `AdminField` union:

```ts
import type { UploadField } from "./upload";

export type AdminField<TFieldMeta extends {} = {}> =
  | TextField<TFieldMeta>
  | NumberField<TFieldMeta>
  // ... existing fields ...
  | UploadField<TFieldMeta>
  | RelationshipField<TFieldMeta>;
// ...;
```

---

#### `packages/core/src/fields/index.ts` (MODIFY)

Add `export * from "./upload"`;

---

#### `packages/core/src/fields/validators/index.ts` (MODIFY)

Add `upload` case in `adminFieldToValidator`:

```ts
import { uploadFieldToValidator } from "../upload";

// In the switch:
case ADMIN_FIELDS.upload.type:
  return uploadFieldToValidator({ field: props.field as UploadField });
```

---

#### `packages/core/src/fields/inputSchemas/index.ts` (MODIFY)

Add `upload` case in `adminFieldToInputSchema`:

```ts
import { uploadFieldToInputSchema } from "../upload";

// In the switch:
case ADMIN_FIELDS.upload.type:
  return uploadFieldToInputSchema({ field: props.field as UploadField });
```

---

#### `packages/core/src/fields/upload/config.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { upload } from "./config";

describe("upload()", () => {
  it("creates an upload field with defaults", () => {
    const field = upload({ to: "images" });
    expect(field.type).toBe("upload");
    expect(field.to).toBe("images");
    expect(field.label).toBe("");
    expect(field.required).toBe(false);
    expect(field.interfaceType).toBe("string");
    expect(field.admin.hidden).toBe(false);
    expect(field.admin.readOnly).toBe(false);
    expect(field.admin.position).toBe("main");
    expect(field.admin.width).toBe("full");
  });

  it("applies custom options", () => {
    const field = upload({
      to: "images",
      label: "Featured Image",
      required: true,
      admin: { position: "sidebar" },
    });
    expect(field.label).toBe("Featured Image");
    expect(field.required).toBe(true);
    expect(field.admin.position).toBe("sidebar");
  });

  it("throws for empty to", () => {
    expect(() => upload({ to: "" })).toThrow(
      'upload(): "to" must be a valid collection slug',
    );
  });

  it("throws for invalid to slug", () => {
    expect(() => upload({ to: "123-invalid" })).toThrow(
      'upload(): "to" must be a valid collection slug',
    );
  });

  it("allows valid to slugs", () => {
    expect(() => upload({ to: "images" })).not.toThrow();
    expect(() => upload({ to: "media-files" })).not.toThrow();
    expect(() => upload({ to: "media_files" })).not.toThrow();
  });
});
```

---

#### `packages/core/src/fields/upload/validator.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { upload } from "./config";
import { uploadFieldToValidator } from "./validator";

describe("uploadFieldToValidator", () => {
  it("returns v.id for the target collection", () => {
    const field = upload({ to: "images" });
    expect(uploadFieldToValidator({ field })).toBe('v.id("images")');
  });

  it("wraps in v.optional when not required", () => {
    const field = upload({ to: "images", required: false });
    expect(uploadFieldToValidator({ field })).toBe(
      'v.optional(v.id("images"))',
    );
  });

  it("does not wrap when required", () => {
    const field = upload({ to: "images", required: true });
    expect(uploadFieldToValidator({ field })).toBe('v.id("images")');
  });
});
```

---

#### `packages/core/src/fields/upload/inputSchema.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { upload } from "./config";
import { uploadFieldToInputSchema } from "./inputSchema";

describe("uploadFieldToInputSchema", () => {
  it("returns z.string for required field", () => {
    const field = upload({ to: "images", required: true });
    const schema = uploadFieldToInputSchema({ field });
    expect(() => schema.parse("doc_123")).not.toThrow();
    expect(() => schema.parse(undefined)).toThrow();
  });

  it("returns z.string().optional for optional field", () => {
    const field = upload({ to: "images", required: false });
    const schema = uploadFieldToInputSchema({ field });
    expect(() => schema.parse("doc_123")).not.toThrow();
    expect(() => schema.parse(undefined)).not.toThrow();
  });
});
```

### Run tests

```bash
pnpm --filter @vexcms/core test
```

---

### Step 3 — Storage adapter validation and config integration [agent]

Create `media/config.ts` to validate storage adapter configuration: merge media collections from all adapters, detect slug collisions, validate upload field references, and ensure `upload()` fields only exist when adapters are configured. Update `defineConfig()` to call this validation module.

**Files:**

- `packages/core/src/media/config.ts` (NEW)
- `packages/core/src/config/config.ts` (MODIFY)
- `packages/core/src/config/sanitizeConfig.ts` (MODIFY)

**Edge cases:**

> **Edge: User defines a collection with slug "images" and a media collection with slug "images".** `media/config.ts` throws `VexStorageConfigError` — slugs must be unique across both `collections` and `mediaCollections`.

> **Edge: Upload field `to: "images"` but no media collection "images".** `media/config.ts` throws `VexStorageConfigError` listing the missing collections.

> **Edge: No storage adapter and no upload fields.** `defineConfig()` succeeds. Admin panel works without media. No error.

> **Edge: No storage adapter but upload fields exist.** `media/config.ts` throws `VexStorageConfigError` — `upload()` requires a configured adapter.

> **Edge: Two storage adapters both define a media collection with slug "images".** `media/config.ts` throws `VexStorageConfigError` — duplicate media collection slugs across adapters.

> **Edge: Media collection from adapter A is referenced by upload field in collection, but adapter A is the second adapter.** The registry lookup uses `meta.storageAdapterName` to find the correct adapter functions. If no registry is provided and the default function paths don't match, the upload fails at runtime. This is a user configuration error — document that the registry is required for multi-adapter.

---

#### `packages/core/src/media/config.ts` (NEW)

```ts
import type { CollectionConfig } from "../collections";
import type { UploadField } from "../fields/upload";
import { ADMIN_FIELDS } from "../fields/constants";
import { VexStorageConfigError } from "./types";
import type { VexStorageAdapter } from "./types";

interface StorageValidationInput {
  collections: CollectionConfig[];
  storageAdapters?: VexStorageAdapter[];
}

interface StorageValidationOutput {
  mediaCollections: CollectionConfig[];
}

/**
 * Validates storage adapter configuration and merges media collections.
 *
 * Checks:
 * 1. `upload()` fields only exist when storage adapters are configured.
 * 2. Every `upload().to` slug matches a media collection slug.
 * 3. No slug collisions between regular collections and media collections.
 * 4. No duplicate media collection slugs across adapters.
 *
 * @param input — Validation input containing collections and adapters.
 * @returns Merged media collections with `meta.storageAdapterName` set.
 * @throws {VexStorageConfigError} On any validation failure.
 */
export function validateAndMergeStorageConfig(
  input: StorageValidationInput,
): StorageValidationOutput {
  const { collections, storageAdapters } = input;

  // Check if any collection uses upload fields
  const uploadFields: {
    collectionSlug: string;
    fieldName: string;
    to: string;
  }[] = [];
  for (const collection of collections) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.type === ADMIN_FIELDS.upload.type) {
        uploadFields.push({
          collectionSlug: collection.slug,
          fieldName,
          to: (field as UploadField).to,
        });
      }
    }
  }

  // Edge: upload fields without storage adapters
  if (
    uploadFields.length > 0 &&
    (!storageAdapters || storageAdapters.length === 0)
  ) {
    const fieldList = uploadFields
      .map((f) => `${f.collectionSlug}.${f.fieldName}`)
      .join(", ");
    throw new VexStorageConfigError(
      `upload() fields require a configured storage adapter. Fields without adapter: ${fieldList}. ` +
        `Add a storage adapter to defineConfig({ storageAdapters: [convexFileStorage({...})] }).`,
    );
  }

  // Merge media collections from all adapters
  const mediaCollections: CollectionConfig[] = [];
  const seenMediaSlugs = new Map<string, string>(); // slug -> adapterName

  if (storageAdapters) {
    for (const adapter of storageAdapters) {
      for (const collection of adapter.mediaCollections) {
        // Check for duplicate media collection slugs across adapters
        if (seenMediaSlugs.has(collection.slug)) {
          const otherAdapter = seenMediaSlugs.get(collection.slug);
          throw new VexStorageConfigError(
            `Duplicate media collection slug "${collection.slug}" defined by both ` +
              `"${otherAdapter}" and "${adapter.name}" adapters. Media collection slugs must be unique across all adapters.`,
          );
        }
        seenMediaSlugs.set(collection.slug, adapter.name);

        // Tag with storageAdapterName
        const taggedCollection: CollectionConfig = {
          ...collection,
          meta: {
            ...collection.meta,
            storageAdapterName: adapter.name,
          },
        };
        mediaCollections.push(taggedCollection);
      }
    }
  }

  // Check for slug collisions between regular collections and media collections
  const collectionSlugs = new Set(collections.map((c) => c.slug));
  for (const mediaCollection of mediaCollections) {
    if (collectionSlugs.has(mediaCollection.slug)) {
      throw new VexStorageConfigError(
        `Slug collision: "${mediaCollection.slug}" is defined as both a collection and a media collection. ` +
          `Collection and media collection slugs must be unique.`,
      );
    }
  }

  // Validate upload field references
  if (uploadFields.length > 0) {
    const mediaSlugs = new Set(mediaCollections.map((c) => c.slug));
    const missing = new Set<string>();

    for (const uploadField of uploadFields) {
      if (!mediaSlugs.has(uploadField.to)) {
        missing.add(uploadField.to);
      }
    }

    if (missing.size > 0) {
      throw new VexStorageConfigError(
        `upload() fields reference missing media collections: ${[...missing].join(", ")}. ` +
          `Define these collections via a storage adapter's defineMediaCollection(). ` +
          `Available media collections: ${[...mediaSlugs].join(", ") || "none"}.`,
      );
    }
  }

  return { mediaCollections };
}
```

---

#### `packages/core/src/config/config.ts` (MODIFY)

Update `defineConfig()` to call `validateAndMergeStorageConfig()`:

```ts
import { validateAndMergeStorageConfig } from "../media/config";

// In defineConfig():
export function defineConfig(config?: VexConfigInput): VexConfig {
  const userCollections = config?.collections ?? [];

  // Validate storage adapters and merge media collections
  const { mediaCollections } = validateAndMergeStorageConfig({
    collections: userCollections,
    storageAdapters: config?.storageAdapters,
  });

  return {
    basePath: "/admin",
    ...config,
    auth: config?.auth,
    collections: userCollections,
    mediaCollections,
    storageAdapters: config?.storageAdapters,
    admin: {
      ...config?.admin,
      sidebar: {
        side: "left",
        collapsible: "offcanvas",
        ...config?.admin?.sidebar,
      },
    },
    schema: {
      outputPath: "/convex/vex.schema.ts",
      ...config?.schema,
    },
    types: {
      outputPath: "/src/vex.types.ts",
      ...config?.types,
    },
  };
}
```

---

#### `packages/core/src/config/config.test.ts` (MODIFY / NEW tests)

```ts
import { describe, it, expect } from "vitest";
import { defineConfig, defineCollection, text, upload } from "../";
import { VexStorageConfigError } from "../storage";
import {
  convexFileStorage,
  defineMediaCollection,
} from "@vexcms/file-storage-convex";

describe("defineConfig with storage adapters", () => {
  it("works without storage adapters and without upload fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text() },
        }),
      ],
    });
    expect(config.storageAdapters).toBeUndefined();
    expect(config.mediaCollections).toEqual([]);
  });

  it("throws when upload fields exist without storage adapters", () => {
    expect(() =>
      defineConfig({
        collections: [
          defineCollection({
            slug: "posts",
            fields: {
              image: upload({ to: "images" }),
            },
          }),
        ],
      }),
    ).toThrow(VexStorageConfigError);
  });

  it("merges media collections from storage adapters", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage({ mediaCollections: [images] });

    const config = defineConfig({
      storageAdapters: [adapter],
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            image: upload({ to: "images" }),
          },
        }),
      ],
    });

    expect(config.mediaCollections.length).toBe(1);
    expect(config.mediaCollections[0].slug).toBe("images");
    expect(config.mediaCollections[0].meta?.storageAdapterName).toBe("convex");
  });

  it("throws on slug collision between collection and media collection", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage({ mediaCollections: [images] });

    expect(() =>
      defineConfig({
        storageAdapters: [adapter],
        collections: [
          defineCollection({
            slug: "images", // collision
            fields: { name: text() },
          }),
        ],
      }),
    ).toThrow(VexStorageConfigError);
  });

  it("throws on duplicate media collection slug across adapters", () => {
    const images1 = defineMediaCollection({ slug: "images" });
    const images2 = defineMediaCollection({ slug: "images" });
    const adapter1 = convexFileStorage({ mediaCollections: [images1] });
    // Mock a second adapter with the same name for testing
    const adapter2 = {
      ...convexFileStorage({ mediaCollections: [images2] }),
      name: "s3",
    };

    expect(() =>
      defineConfig({
        storageAdapters: [adapter1, adapter2],
      }),
    ).toThrow(VexStorageConfigError);
  });
});
```

---

#### `packages/core/src/config/sanitizeConfig.ts` (MODIFY)

Ensure `storageAdapters` and `mediaCollections` are sanitized for client config:

```ts
// In sanitizeConfigForClient:
// The storage adapter objects have non-serializable runtime data
// Strip them entirely — client config only needs mediaCollections (which are serializable)
```

### Run tests

```bash
pnpm --filter @vexcms/core test
```

---

### Step 4 — File storage convex adapter [dev]

Implement `VexStorageAdapter` in `@vexcms/file-storage-convex`. Export `defineMediaCollection()` helper and `convexFileStorage()` adapter. All 4 Convex functions must use the validator factories from `@vexcms/core`. The adapter tags each collection with `meta.storageAdapterName: "convex"`.

**Files:**

- `packages/file-storage-convex/src/index.ts` (MODIFY)
- `packages/file-storage-convex/src/convex/generateUploadUrl.ts` (NEW)
- `packages/file-storage-convex/src/convex/uploadComplete.ts` (NEW)
- `packages/file-storage-convex/src/convex/deleteMedia.ts` (NEW)
- `packages/file-storage-convex/src/convex/getUrl.ts` (NEW)
- `packages/file-storage-convex/src/convex/schema.ts` (NEW)
- `packages/file-storage-convex/src/test/convex/schema.ts` (NEW)

**Edge cases:**

> **Edge: `defineMediaCollection()` called with missing `alt` field.** The adapter adds `alt: text({ required: true })` automatically if not present. Every media file should have alt text for accessibility.

> **Edge: `defineMediaCollection()` called with duplicate required fields.** If the user already defines `filename`, `mimeType`, etc., the adapter's defaults are merged with user fields. User fields take precedence for `label`, `admin`, etc., but `required: true` is enforced.

> **Edge: `convexFileStorage()` requires explicit `mediaCollections`.** No default collection is created. The user must pass at least one media collection. This is intentional — no implicit "media" collection.

> **Edge: Convex file storage not available at runtime.** The adapter functions throw descriptive errors if the Convex client is not configured. Same pattern as existing `FileStorageAdapter`.

---

#### `packages/file-storage-convex/src/index.ts` (MODIFY)

````ts
import type { CollectionConfig, VexStorageAdapter } from "@vexcms/core";
import { defineCollection, text, number, checkbox, url } from "@vexcms/core";

/**
 * Defines a media collection with required fields for file storage.
 *
 * Adds core required fields (`alt`, `filename`, `mimeType`, `size`, `storageId`,
 * `deleted`) and Convex-specific fields (`convexUrl`, `width`, `height`).
 * The user can add custom fields (e.g., `caption`, `tags`) via the `fields` parameter.
 *
 * Every collection is tagged with `meta.storageAdapterName: "convex"` when
 * processed by `convexFileStorage()`.
 *
 * @param config — Media collection configuration. `slug` is required.
 * @returns A fully-configured `CollectionConfig` ready for the storage adapter.
 *
 * @example
 * ```ts
 * const images = defineMediaCollection({
 *   slug: "images",
 *   fields: {
 *     alt: text({ required: true }),
 *     caption: text(),
 *   },
 * });
 */
export function defineMediaCollection(config: {
  slug: string;
  fields?: Record<string, unknown>;
  // Allow other CollectionConfig properties
  [key: string]: unknown;
}): CollectionConfig {
  const userFields = (config.fields ?? {}) as Record<string, unknown>;

  // Ensure alt field exists (accessibility requirement)
  const fields: Record<string, unknown> = {
    // Core required fields
    alt: text({ required: true }),
    filename: text({ required: true }),
    mimeType: text({ required: true }),
    size: number({ required: true }),
    storageId: text({ required: true }),
    deleted: checkbox({ defaultValue: false }),
    // User fields take precedence for same keys (except type enforcement)
    ...userFields,
    // Convex-specific fields (always present, user can't override type)
    convexUrl: url({ required: true }),
    width: number(),
    height: number(),
  };

  return defineCollection({
    ...config,
    fields: fields as CollectionConfig["fields"],
  });
}

export interface ConvexFileStorageOptions {
  /** Media collections to register. Required — no default collection is created. */
  mediaCollections: CollectionConfig[];
  /** When true, delete operations mark media as deleted instead of physically removing files. */
  softDelete?: boolean;
  /** Convex site URL for generating file URLs. Auto-detected from env if omitted. */
  convexUrl?: string;
}

/**
 * Creates a Convex file storage adapter for VexCMS.
 *
 * Processes media collections (adds required fields, validates), configures
 * Convex file storage backend, and returns a `VexStorageAdapter`. Every
 * collection is tagged with `meta.storageAdapterName: "convex"`.
 *
 * @param options — Adapter configuration. `mediaCollections` is required.
 * @returns A `VexStorageAdapter` ready for `defineConfig({ storageAdapters: [ ... ] })`.
 *
 * @example
 * ```ts
 * import { convexFileStorage, defineMediaCollection } from "@vexcms/file-storage-convex";
 *
 * const images = defineMediaCollection({
 *   slug: "images",
 *   fields: { alt: text({ required: true }) },
 * });
 *
 * export default defineConfig({
 *   storageAdapters: [convexFileStorage({ mediaCollections: [images] })],
 *   collections: [posts],
 * });
 */
export function convexFileStorage(
  options: ConvexFileStorageOptions,
): VexStorageAdapter {
  const mediaCollections = options.mediaCollections.map((collection) => ({
    ...collection,
    meta: {
      ...collection.meta,
      storageAdapterName: "convex",
    },
  }));

  return {
    name: "convex",
    mediaCollections,
    softDelete: options?.softDelete ?? false,
  };
}

// Re-export existing FileStorageAdapter runtime methods for backward compatibility
export interface FileStorageAdapter {
  name: string;
  storageIdValueType: string;
  getUploadUrl: () => Promise<string>;
  getUrl: (props: { storageId: string }) => Promise<string | null>;
  deleteFile: (props: { storageId: string }) => Promise<void>;
}
````

---

#### `packages/file-storage-convex/src/convex/generateUploadUrl.ts` (NEW)

```ts
import { action } from "./_generated/server";
import { generateUploadUrlArgs, generateUploadUrlReturn } from "@vexcms/core";

/**
 * Generates a signed URL for uploading a file to Convex file storage.
 *
 * Uses the validator factories from `@vexcms/core` to enforce the standard
 * adapter function signature. Returns a polymorphic upload instruction object
 * that the client interprets.
 *
 * @returns An object containing the `uploadUrl` (POST target), `storageId`
 *   (placeholder — replaced by actual ID after upload), and optional `method`/`headers`.
 */
export const generateUploadUrl = action({
  args: generateUploadUrlArgs,
  returns: generateUploadUrlReturn,
  handler: async (ctx, args) => {
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return {
      uploadUrl,
      storageId: "pending", // Will be replaced by actual storage ID after upload
    };
  },
});
```

---

#### `packages/file-storage-convex/src/convex/uploadComplete.ts` (NEW)

```ts
import { mutation } from "./_generated/server";
import { uploadCompleteArgs, uploadCompleteReturn } from "@vexcms/core";

/**
 * Creates a media document after a file has been uploaded to Convex storage.
 *
 * Called by the client after the file upload succeeds. Uses the validator
 * factories from `@vexcms/core` to enforce the standard adapter function signature.
 */
export const uploadComplete = mutation({
  args: uploadCompleteArgs,
  returns: uploadCompleteReturn,
  handler: async (ctx, args) => {
    // Insert into the target media collection
    const docId = await ctx.db.insert(args.collectionSlug as never, {
      storageId: args.storageId,
      filename: args.fileName,
      mimeType: args.mimeType,
      size: args.size,
      alt: args.alt ?? args.fileName,
      deleted: false,
      convexUrl: await ctx.storage.getUrl(args.storageId),
      // adapterFields can be used for future extensibility
      ...(args.adapterFields ?? {}),
    });
    return docId;
  },
});
```

---

#### `packages/file-storage-convex/src/convex/deleteMedia.ts` (NEW)

```ts
import { mutation } from "./_generated/server";
import { deleteMediaArgs, deleteMediaReturn } from "@vexcms/core";

/**
 * Deletes a media document and its associated file from Convex storage.
 *
 * When `softDelete` is enabled, sets `deleted: true` instead of physically
 * removing the file. Uses the validator factories from `@vexcms/core`.
 */
export const deleteMedia = mutation({
  args: deleteMediaArgs,
  returns: deleteMediaReturn,
  handler: async (ctx, args) => {
    const mediaDoc = await ctx.db.get(args.mediaId as never);
    if (!mediaDoc) return false;

    // Check if soft delete is enabled (stored in adapter config, passed by client)
    // For now, hard delete is default. Soft delete flag will be passed in a future update.
    await ctx.storage.delete(mediaDoc.storageId);
    await ctx.db.delete(args.mediaId as never);

    return true;
  },
});
```

---

#### `packages/file-storage-convex/src/convex/getUrl.ts` (NEW)

```ts
import { query } from "./_generated/server";
import { getUrlArgs, getUrlReturn } from "@vexcms/core";

/**
 * Gets a URL for a media file stored in Convex storage.
 *
 * Returns a signed URL that expires after a short time. Uses the validator
 * factories from `@vexcms/core` to enforce the standard adapter function signature.
 */
export const getUrl = query({
  args: getUrlArgs,
  returns: getUrlReturn,
  handler: async (ctx, args) => {
    const mediaDoc = await ctx.db.get(args.mediaId as never);
    if (!mediaDoc) {
      return { url: "" };
    }

    const url = await ctx.storage.getUrl(mediaDoc.storageId);
    return { url };
  },
});
```

---

#### `packages/file-storage-convex/src/convex/schema.ts` (NEW)

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Schema for the file storage adapter's internal tables (if any)
// Media collections are defined by the adapter and injected into the app's schema
export default defineSchema({});
```

---

#### `packages/file-storage-convex/src/index.test.ts` (NEW)

```ts
import { describe, it, expect } from "vitest";
import { convexFileStorage, defineMediaCollection } from "./index";

describe("defineMediaCollection", () => {
  it("creates a media collection with required fields", () => {
    const collection = defineMediaCollection({ slug: "images" });
    expect(collection.slug).toBe("images");
    expect(collection.fields).toHaveProperty("alt");
    expect(collection.fields).toHaveProperty("filename");
    expect(collection.fields).toHaveProperty("mimeType");
    expect(collection.fields).toHaveProperty("size");
    expect(collection.fields).toHaveProperty("storageId");
    expect(collection.fields).toHaveProperty("deleted");
    expect(collection.fields).toHaveProperty("convexUrl");
    expect(collection.fields).toHaveProperty("width");
    expect(collection.fields).toHaveProperty("height");
  });

  it("preserves user-defined fields", () => {
    // text() would be imported from @vexcms/core in real usage
    const collection = defineMediaCollection({
      slug: "images",
      fields: {
        caption: { type: "text", label: "Caption" },
      } as Record<string, unknown>,
    });
    expect(collection.fields).toHaveProperty("caption");
  });

  it("does not override user-provided alt field", () => {
    const collection = defineMediaCollection({
      slug: "images",
      fields: {
        alt: { type: "text", label: "Custom Alt" },
      } as Record<string, unknown>,
    });
    const altField = collection.fields.alt as { label: string };
    expect(altField.label).toBe("Custom Alt");
  });
});

describe("convexFileStorage", () => {
  it("requires explicit media collections", () => {
    // This should be a type error if mediaCollections is not provided
    // In runtime, it would throw or produce empty mediaCollections
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage({ mediaCollections: [images] });
    expect(adapter.mediaCollections.length).toBe(1);
    expect(adapter.mediaCollections[0].slug).toBe("images");
    expect(adapter.mediaCollections[0].meta?.storageAdapterName).toBe("convex");
    expect(adapter.name).toBe("convex");
    expect(adapter.softDelete).toBe(false);
  });

  it("uses provided media collections with soft delete", () => {
    const images = defineMediaCollection({ slug: "images" });
    const videos = defineMediaCollection({ slug: "videos" });
    const adapter = convexFileStorage({
      mediaCollections: [images, videos],
      softDelete: true,
    });
    expect(adapter.mediaCollections.length).toBe(2);
    expect(adapter.softDelete).toBe(true);
  });

  it("tags collections with storageAdapterName", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage({ mediaCollections: [images] });
    expect(adapter.mediaCollections[0].meta?.storageAdapterName).toBe("convex");
  });
});
```

### Run tests

```bash
pnpm --filter @vexcms/file-storage-convex test
```

---

### Step 5 — Storage registry context in React [dev]

Create an optional `StorageRegistryContext` in `@vexcms/react`. The context maps adapter names to Convex function references. Single-adapter setups don't need the context — components use default function paths (`api.media.generateUploadUrl`). Multi-adapter setups provide the registry via the `AdminPanel` component.

**Files:**

- `packages/react/src/context/StorageRegistryContext.tsx` (NEW)

---

#### `packages/react/src/context/StorageRegistryContext.tsx` (NEW)

````tsx
import { createContext, useContext } from "react";

/**
 * A single adapter's function references in the storage registry.
 *
 * All 4 functions are required for every adapter. The registry is used by
 * React components to call the correct adapter's Convex functions for a
 * given media collection (identified by `meta.storageAdapterName`).
 */
export interface StorageRegistryEntry {
  generateUploadUrl: any; // FunctionReference<"action">
  uploadComplete: any; // FunctionReference<"mutation">
  deleteMedia: any; // FunctionReference<"mutation">
  getUrl: any; // FunctionReference<"query">
}

/**
 * Storage registry mapping adapter names to their Convex function references.
 *
 * Provided by the user for multi-adapter setups. Single-adapter setups use
 * default function paths without a registry.
 *
 * @example
 * ```ts
 * export const storageRegistry = {
 *   convex: {
 *     generateUploadUrl: api.convexMedia.generateUploadUrl,
 *     uploadComplete: api.convexMedia.uploadComplete,
 *     deleteMedia: api.convexMedia.deleteMedia,
 *     getUrl: api.convexMedia.getUrl,
 *   },
 * };
 */
export type StorageRegistry = Record<string, StorageRegistryEntry>;

const StorageRegistryContext = createContext<StorageRegistry | undefined>(
  undefined,
);

export const StorageRegistryProvider = StorageRegistryContext.Provider;

/**
 * Gets the storage registry from React context.
 *
 * Returns `undefined` if no registry is provided (single-adapter setup).
 */
export function useStorageRegistry(): StorageRegistry | undefined {
  return useContext(StorageRegistryContext);
}

/**
 * Gets the function references for a specific adapter from the registry.
 *
 * @param adapterName — The adapter name (from `meta.storageAdapterName`).
 * @returns The adapter's function references, or `undefined` if no registry is provided.
 * @throws {Error} If a registry is provided but the adapter name is not found.
 */
export function useAdapterFunctions(
  adapterName: string,
): StorageRegistryEntry | undefined {
  const registry = useStorageRegistry();

  if (!registry) {
    // Single-adapter setup — no registry needed
    return undefined;
  }

  const entry = registry[adapterName];
  if (!entry) {
    throw new Error(
      `Storage adapter "${adapterName}" not found in registry. ` +
        `Available adapters: ${Object.keys(registry).join(", ")}. ` +
        `Make sure to add "${adapterName}" to your storage registry.`,
    );
  }

  return entry;
}
````

---

### Step 6 — React upload field input and cell [dev]

Build the `UploadFieldInput` component with dropzone + media picker, and `UploadFieldCell` with thumbnail preview. The upload component uses `useAdapterFunctions()` to get the correct adapter's Convex functions for the target media collection.

**Files:**

- `packages/react/src/fields/upload/Input.tsx` (NEW)
- `packages/react/src/fields/upload/Cell.tsx` (NEW)
- `packages/react/src/fields/upload/index.ts` (NEW)
- `packages/react/src/fields/index.tsx` (MODIFY)
- `packages/react/src/adapter.ts` (MODIFY)

---

#### `packages/react/src/fields/upload/Input.tsx` (NEW)

```tsx
import { useState } from "react";
import type { InputComponentProps } from "@vexcms/core";
import type { UploadField } from "@vexcms/core";
import { createFieldInput } from "../../components/form/createFieldInput";
import { MediaUploadDropzone } from "../../components/media/MediaUploadDropzone";
import { MediaPicker } from "../../components/media/MediaPicker";

/**
 * Upload field input — supports drag-and-drop upload and media library picker.
 *
 * Empty state: shows a dropzone + "Browse media library" button.
 * Filled state: shows thumbnail + "Change" button that opens the picker.
 *
 * Uses the storage registry (if provided) to call the correct adapter's
 * Convex functions for the target media collection.
 *
 * @param props — Field input component props.
 * @returns The upload field input element.
 */
export const UploadFieldInput = createFieldInput<
  string | undefined,
  UploadField
>(({ name, fieldDef, field, readOnly }) => {
  const [showPicker, setShowPicker] = useState(false);
  const value = field.state.value;

  if (readOnly) {
    return value ? (
      <div className="text-sm text-muted-foreground">{value}</div>
    ) : (
      <div className="text-sm text-muted-foreground">—</div>
    );
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3">
          <div className="bg-muted rounded-md w-16 h-16 flex items-center justify-center text-xs text-muted-foreground">
            {value.slice(0, 8)}...
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="text-sm text-primary hover:underline"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => field.handleChange(undefined)}
              className="text-sm text-destructive hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <MediaUploadDropzone
            targetCollection={fieldDef.to}
            onUploadComplete={(mediaId) => field.handleChange(mediaId)}
          />
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="text-sm text-primary hover:underline"
          >
            Browse media library
          </button>
        </div>
      )}
      {showPicker && (
        <MediaPicker
          targetCollection={fieldDef.to}
          onSelect={(mediaId) => {
            field.handleChange(mediaId);
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </div>
  );
});
```

---

#### `packages/react/src/fields/upload/Cell.tsx` (NEW)

```tsx
import type { CellComponentProps } from "@vexcms/core";
import type { UploadField } from "@vexcms/core";

/**
 * Upload field cell — renders a thumbnail or ID string in the data table.
 *
 * @param props — Cell component props.
 * @returns The cell content element.
 */
export function UploadFieldCell(props: CellComponentProps<UploadField>) {
  const { value } = props;

  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  // TODO: Fetch thumbnail URL from media document via Convex query
  // For now, render a placeholder with the ID
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted rounded w-8 h-8 flex items-center justify-center text-xs">
        📄
      </div>
      <span className="text-sm truncate max-w-[150px]">
        {value.slice(0, 12)}...
      </span>
    </div>
  );
}
```

---

#### `packages/react/src/fields/upload/index.ts` (NEW)

```ts
export * from "./Input";
export * from "./Cell";
```

---

#### `packages/react/src/fields/index.tsx` (MODIFY)

Register `UploadFieldInput` and `UploadFieldCell`:

```tsx
import { UploadFieldInput, UploadFieldCell } from "./upload";

// In fieldInputComponents:
[ADMIN_FIELDS.upload.type]: UploadFieldInput as ComponentType<
  InputComponentProps<AdminField>
>,

// In fieldCellComponents:
[ADMIN_FIELDS.upload.type]: UploadFieldCell as ComponentType<
  CellComponentProps<AdminField>
>,
```

---

#### `packages/react/src/adapter.ts` (MODIFY)

Register upload field in `reactAdapter`:

```ts
upload: {
  input: UploadFieldInput,
  cell: UploadFieldCell,
},
```

---

#### `packages/react/src/fields/upload/Input.test.tsx` (NEW)

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadFieldInput } from "./Input";

describe("UploadFieldInput", () => {
  it("renders empty state with dropzone and browse button", () => {
    const mockField = {
      state: { value: undefined },
      handleChange: vi.fn(),
    };

    render(
      <UploadFieldInput
        name="featuredImage"
        fieldDef={
          { type: "upload", to: "images", label: "Image" } as UploadField
        }
        readOnly={false}
        field={mockField as any}
      />,
    );

    expect(screen.getByText(/Browse media library/)).toBeInTheDocument();
  });

  it("renders filled state with change/remove buttons", () => {
    const mockField = {
      state: { value: "doc_123" },
      handleChange: vi.fn(),
    };

    render(
      <UploadFieldInput
        name="featuredImage"
        fieldDef={
          { type: "upload", to: "images", label: "Image" } as UploadField
        }
        readOnly={false}
        field={mockField as any}
      />,
    );

    expect(screen.getByText(/Change/)).toBeInTheDocument();
    expect(screen.getByText(/Remove/)).toBeInTheDocument();
  });

  it("calls handleChange when remove is clicked", () => {
    const handleChange = vi.fn();
    const mockField = {
      state: { value: "doc_123" },
      handleChange,
    };

    render(
      <UploadFieldInput
        name="featuredImage"
        fieldDef={
          { type: "upload", to: "images", label: "Image" } as UploadField
        }
        readOnly={false}
        field={mockField as any}
      />,
    );

    fireEvent.click(screen.getByText(/Remove/));
    expect(handleChange).toHaveBeenCalledWith(undefined);
  });
});
```

### Run tests

```bash
pnpm --filter @vexcms/react test
```

---

### Step 7 — React media components [dev]

Build `MediaUploadDropzone`, `MediaPicker`, and `MediaLibrary` components. The dropzone uses the adapter's `generateUploadUrl` and `uploadComplete` functions (via registry or default paths). Batch upload is handled by calling `uploadComplete` in `Promise.all`.

**Files:**

- `packages/react/src/components/media/MediaUploadDropzone.tsx` (NEW)
- `packages/react/src/components/media/MediaPicker.tsx` (NEW)
- `packages/react/src/components/media/MediaLibrary.tsx` (NEW)
- `packages/react/src/components/media/index.ts` (NEW)

---

#### `packages/react/src/components/media/MediaUploadDropzone.tsx` (NEW)

```tsx
import { useCallback } from "react";
import { useDropzone } from "react-dropzone"; // or custom implementation
import { useAdapterFunctions } from "../../context/StorageRegistryContext";

interface MediaUploadDropzoneProps {
  targetCollection: string;
  onUploadComplete: (mediaId: string) => void;
}

/**
 * File upload dropzone — handles drag-and-drop and click-to-upload.
 *
 * Uploads files to the target media collection via the adapter's Convex functions.
 * For single-adapter setups, uses default function paths. For multi-adapter,
 * looks up the correct functions in the storage registry.
 *
 * Batch upload: multiple files are uploaded in parallel via `Promise.all` on
 * single-file `uploadComplete` calls. The adapter never exports `uploadMany`.
 *
 * @param props — Dropzone component props.
 */
export function MediaUploadDropzone(props: MediaUploadDropzoneProps) {
  // TODO: Get the adapter name from the media collection metadata
  // For now, use default functions (single-adapter setup)
  // const adapterFunctions = useAdapterFunctions("convex");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Batch upload: Promise.all on single-file uploadComplete
      const uploadPromises = acceptedFiles.map(async (file) => {
        // TODO: Implement upload flow:
        // 1. Call generateUploadUrl (action) with file metadata
        // 2. POST file to upload URL
        // 3. Call uploadComplete (mutation) to create media doc
        // 4. Return media document ID

        console.log("Uploading to", props.targetCollection, file.name);
        return "doc_123"; // placeholder
      });

      const results = await Promise.all(uploadPromises);
      // For single-file dropzone, call onUploadComplete with the first result
      // For multi-file, this component would need to accept an array
      if (results.length > 0) {
        props.onUploadComplete(results[0]);
      }
    },
    [props.targetCollection, props.onUploadComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-sm text-muted-foreground">Drop the file here...</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          📁 Drop file here or click to upload
        </p>
      )}
    </div>
  );
}
```

---

#### `packages/react/src/components/media/MediaPicker.tsx` (NEW)

```tsx
import { useState } from "react";
import { MediaUploadDropzone } from "./MediaUploadDropzone";

interface MediaPickerProps {
  targetCollection: string;
  onSelect: (mediaId: string) => void;
  onCancel: () => void;
}

/**
 * Media picker popover — shows a grid of media files from the target collection.
 *
 * Allows selecting an existing file or uploading a new one directly.
 * Searches within one collection at a time — no cross-collection search.
 *
 * @param props — Media picker component props.
 */
export function MediaPicker(props: MediaPickerProps) {
  const [showUpload, setShowUpload] = useState(false);

  // TODO: Fetch media documents from the target collection via Convex query
  const mediaItems: { id: string; filename: string }[] = [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[600px] max-h-[500px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Select Media</h3>
          <button
            onClick={() => setShowUpload(true)}
            className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded"
          >
            Upload New
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {showUpload ? (
            <MediaUploadDropzone
              targetCollection={props.targetCollection}
              onUploadComplete={(id) => {
                props.onSelect(id);
                setShowUpload(false);
              }}
            />
          ) : mediaItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No media files yet. Click "Upload New" to add one.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {mediaItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => props.onSelect(item.id)}
                  className="border rounded-md p-2 hover:border-primary transition-colors"
                >
                  <div className="bg-muted rounded w-full h-20 flex items-center justify-center text-xs">
                    📄
                  </div>
                  <p className="text-xs truncate mt-1">{item.filename}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={props.onCancel}
            className="text-sm px-3 py-1 border rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

#### `packages/react/src/components/media/MediaLibrary.tsx` (NEW)

```tsx
import type { CollectionConfig } from "@vexcms/core";

/**
 * Media library page — grid view of all media files in a collection.
 *
 * Rendered as the collection list view for media collections. Shows thumbnails,
 * filenames, and sizes in a grid layout instead of a data table.
 *
 * @param props — Media library component props.
 * @param props.collection — The media collection config.
 */
export function MediaLibrary(props: {
  collection: CollectionConfig;
  documents: Array<Record<string, unknown>>;
}) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-5 gap-4">
        {props.documents.map((doc) => (
          <div
            key={doc._id as string}
            className="border rounded-md p-3 hover:border-primary transition-colors"
          >
            <div className="bg-muted rounded w-full h-24 flex items-center justify-center text-xs">
              📄
            </div>
            <p className="text-sm truncate mt-2">
              {(doc.filename as string) ?? "Untitled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {(doc.mimeType as string) ?? "unknown"} ·{" "}
              {(doc.size as number) ?? 0} bytes
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

#### `packages/react/src/components/media/index.ts` (NEW)

```ts
export * from "./MediaUploadDropzone";
export * from "./MediaPicker";
export * from "./MediaLibrary";
```

### Run tests

```bash
pnpm --filter @vexcms/react test
```

---

### Step 8 — Admin panel wiring [dev]

Wire the media library page into the admin panel. Media collections appear in the sidebar under a dedicated "Media" section. The collection list view for media collections uses the grid layout instead of the data table. The `AdminPanel` component accepts an optional `storageRegistry` prop.

**Files:**

- `packages/react/src/components/admin/CollectionListView.tsx` (MODIFY) — detect media collection and render grid
- `packages/react/src/components/admin/sidebar.tsx` (MODIFY) — add "Media" section
- `packages/react/src/components/admin/AdminPanel.tsx` (MODIFY) — accept storageRegistry prop

---

#### `packages/react/src/components/admin/AdminPanel.tsx` (MODIFY)

```tsx
import { StorageRegistryProvider } from "../../context/StorageRegistryContext";
import type { StorageRegistry } from "../../context/StorageRegistryContext";

interface AdminPanelProps {
  children: React.ReactNode;
  storageRegistry?: StorageRegistry; // Optional — only needed for multi-adapter
}

export function AdminPanel({ children, storageRegistry }: AdminPanelProps) {
  return (
    <StorageRegistryProvider value={storageRegistry}>
      {/* ... existing admin panel layout ... */}
      {children}
    </StorageRegistryProvider>
  );
}
```

---

#### `packages/react/src/components/admin/CollectionListView.tsx` (MODIFY)

```tsx
import { MediaLibrary } from "../media/MediaLibrary";

// In the list view component, detect if this is a media collection:
const isMediaCollection = config.mediaCollections.some(
  (mc) => mc.slug === collection.slug,
);

if (isMediaCollection) {
  return <MediaLibrary collection={collection} documents={documents} />;
}
```

---

#### `packages/react/src/components/admin/sidebar.tsx` (MODIFY)

```tsx
// In sidebar rendering:
<div>
  <h3 className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2">
    Media
  </h3>
  {config.mediaCollections.map((collection) => (
    <SidebarLink
      key={collection.slug}
      href={`${config.basePath}/${collection.slug}`}
      label={collection.labels.plural}
    />
  ))}
</div>
```

### Run tests

```bash
pnpm --filter @vexcms/react test
pnpm dev:app
```

Verify at `http://localhost:3020/admin/media`:

- Media library page renders with grid layout
- Upload button works
- Media files appear in grid after upload

---

## Verification

```bash
# 1. TypeScript across all packages
pnpm typecheck

# 2. Core tests
pnpm --filter @vexcms/core test

# 3. React tests
pnpm --filter @vexcms/react test

# 4. File storage convex tests
pnpm --filter @vexcms/file-storage-convex test

# 5. Admin panel smoke test
pnpm dev:app
# Navigate to http://localhost:3020/admin/media
# Verify media library page renders, upload works, file appears in grid
```

## Success Criteria

1. **Compile-time:** `pnpm typecheck` passes across all packages with no errors.
2. **Config-time:** `defineConfig({ storageAdapters: [convexFileStorage({ mediaCollections: [images] })] })` produces a `VexConfig` with `mediaCollections` containing the processed collection.
3. **No adapter default:** `defineConfig()` without `storageAdapters` works fine — no media section in admin panel, no errors. `upload()` without adapters throws `VexStorageConfigError`.
4. **Schema-time:** `vex dev` generates `vex.schema.ts` with media tables and `v.id("images")` validators on upload fields.
5. **Type-time:** `upload()` field is included in the `AdminField` union; TypeScript narrows correctly in `switch (field.type)`.
6. **Validation:** `upload({ to: "nonexistent" })` throws `VexStorageConfigError` at config time if no matching media collection exists.
7. **Slug collision:** Defining a regular collection and media collection with the same slug throws `VexStorageConfigError`.
8. **Duplicate media slugs:** Two adapters defining a media collection with the same slug throws `VexStorageConfigError`.
9. **Adapter name tag:** Every media collection has `meta.storageAdapterName` set to the adapter's `name`.
10. **Function signature enforcement:** Adapter's Convex functions use validator factories from `@vexcms/core`. TypeScript and Convex runtime enforce compliance.
11. **Runtime — upload:** Dropping a file on the upload field creates a media document in the target collection and stores its ID in the form field.
12. **Runtime — picker:** Clicking "Browse media library" opens a popover with a grid of the target media collection. Selecting a file stores its ID.
13. **Runtime — cell:** The upload field cell in the collection table view shows a thumbnail or document ID.
14. **Runtime — delete:** Deleting a media document from the media library deletes the file from storage (or marks it deleted if soft delete is enabled).
15. **Runtime — batch upload:** Dropping multiple files calls `uploadComplete` once per file in parallel via `Promise.all`. No `uploadMany` function needed.
16. **Multi-adapter:** The storage registry context works — components call the correct adapter functions for each media collection.
17. **Test coverage:** `upload` field type has unit tests for config, validator, and inputSchema. Storage adapter merge logic has unit tests. Media collection validation has unit tests. React upload components have unit tests.
18. **No regression:** Existing field types (text, number, relationship, etc.) continue to work in admin panel and schema generation.

## References

- `packages/core/src/auth/types.ts` — `VexAuthAdapter` pattern to mimic
- `packages/core/src/auth/mergeCollections.ts` — Auth collection merge logic
- `packages/core/src/config/config.ts` — `defineConfig()` where storage adapter is merged
- `packages/core/src/config/types.ts` — `VexConfigInput` / `VexConfig` where `storageAdapters` and `mediaCollections` are added
- `packages/core/src/fields/relationship/` — Relationship field pattern (upload field is similar but stores `v.id("<to>")`)
- `packages/core/src/fields/text/` — Canonical field type reference implementation
- `packages/core/src/fields/constants.ts` — `ADMIN_FIELDS` registry
- `packages/core/src/fields/types.ts` — `AdminField` union
- `packages/file-storage-convex/src/index.ts` — Existing `FileStorageAdapter` interface to extend
- `packages/react/src/fields/relationship/` — Relationship field UI pattern (picker, dropdown)
- `packages/react/src/fields/index.tsx` — Field component registry (`fieldInputComponents`, `fieldCellComponents`)
- `packages/react/src/adapter.ts` — `reactAdapter` field registration
- `packages/react/src/components/form/createFieldInput.ts` — `createFieldInput` HOC for TanStack Form wiring
- `packages/better-auth/src/adapter.ts` — `betterAuthAdapter()` — full adapter example with collection generation
- `packages/better-auth/src/convex/adapter.ts` — Better Auth Convex adapter functions (direct export pattern)
- `packages/better-auth/src/convex/schema.ts` — Better Auth Convex schema
- `.pi/agent-docs/product/maprios-migration-analysis.md` — Maprios site feature inventory (media is highest priority)
- `.pi/agent-docs/product/maprios-roadmap-gaps.md` — Gap analysis confirming media is the top blocker
- `.pi/agent-docs/standards/adding-a-field-type.md` — Canonical field type checklist
- `.pi/agent-docs/standards/spec-structure.md` — Spec layout rules
- `.pi/agent-docs/standards/jsdoc-conventions.md` — JSDoc rules for code samples
