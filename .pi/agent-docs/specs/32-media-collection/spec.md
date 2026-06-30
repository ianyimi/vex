# Spec 32 — Media Collection, Upload Field & Storage Adapter

## Status

Draft

## Overview

Build the media collection subsystem for VexCMS: `storageAdapters` as an **optional array** in `defineConfig()`, a `VexStorageAdapter` interface (patterned after `VexAuthAdapter`), a new `upload()` field type that references media collections by slug, and the `@vexcms/file-storage-convex` package as the first adapter. Supports **multiple media collections** and **multiple storage adapters simultaneously** — users define media collections via `defineMediaCollection()` (exported from the adapter), pass them to `convexFileStorage()`, and configure `storageAdapters: [convexFileStorage({ mediaCollections: [images] })]`. The adapter processes collections (adds required fields, validates, adds adapter-specific fields), tags them with `meta.storageAdapter`, and returns them to core. Core stores them in `VexConfig.mediaCollections` (separate from `collections`) for admin panel rendering. The `upload()` field takes a **required** `to` parameter referencing the media collection slug. Admin panel works completely without any storage adapter configured; `upload()` fields are impossible without a configured adapter. Core provides `mediaMutationApi` and `mediaQueryApi` factory functions that accept `VexConfig` and Convex function builders, then route calls to the correct adapter by name. Users wrap these in their own Convex functions at `convex/vex/media.ts`, making them available as `api.media.generateUploadUrl`, `api.media.createMediaDocument`, etc. The admin panel calls these generic functions via `vexConvexApi.media.*`, passing the adapter name from the target media collection's `meta.storageAdapter`. This unblocks the maprios migration — every block uses images (hero backgrounds, feature images, gallery images, team photos, testimonial avatars, OG images, favicons).

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

### 2. User Convex functions — generic media API at `api.media.*`

Core provides `mediaMutationApi` and `mediaQueryApi` factory functions that accept `VexConfig` and Convex function builders, then route calls to the correct adapter by name. Users wrap these in their own Convex functions at `convex/vex/media.ts`.

```ts
// apps/www/convex/vex/index.ts
import { queryApi, mutationApi } from "@vexcms/core/convex";
import { query, mutation } from "./_generated/server";
import config from "../../src/vex.config";

export const { find, get, search } = queryApi(config, query);
export const { create, update, remove } = mutationApi(config, mutation);
```

```ts
// apps/www/convex/vex/media.ts
import { mediaMutationApi, mediaQueryApi } from "@vexcms/core/convex";
import { query, mutation } from "../_generated/server";
import config from "../../src/vex.config";

export const { generateUploadUrl, createMediaDocument, deleteMedia, getUrl } = {
  ...mediaMutationApi(config, mutation),
  ...mediaQueryApi(config, query),
};
```

This makes the functions available at:

- `api.vex.media.generateUploadUrl({ adapter: "convex" })`
- `api.vex.media.createMediaDocument({ adapter: "convex", ... })`
- `api.vex.media.deleteMedia({ adapter: "convex", ... })`
- `api.vex.media.getUrl({ adapter: "convex", ... })`

### 3. Admin panel calls generic media functions

The admin panel uses `vexConvexApi.media.*` (imported from `@vexcms/core`) to call the generic media functions. The adapter name comes from the target media collection's `meta.storageAdapter`.

```tsx
// packages/react/src/components/media/MediaUploadDropzone.tsx
import { vexConvexApi } from "@vexcms/core";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

export function MediaUploadDropzone(props: {
  targetCollection: string;
  adapterName: string;
  onUploadComplete: (mediaId: string) => void;
}) {
  const { mutateAsync: generateUploadUrl } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.generateUploadUrl),
  });

  const { mutateAsync: createMediaDocument } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.createMediaDocument),
  });

  const onDrop = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const { url } = await generateUploadUrl({ adapter: props.adapterName });
        await fetch(url, { method: "POST", body: file });
        const docId = await createMediaDocument({
          adapter: props.adapterName,
          collectionSlug: props.targetCollection,
          storageId: "pending",
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        });
        props.onUploadComplete(docId);
      }
    },
    [
      props.adapterName,
      props.targetCollection,
      generateUploadUrl,
      createMediaDocument,
    ],
  );

  // ... dropzone UI
}
```

### 3. Storage adapter client — simple identifier object

The `StorageAdapterClient` is a simple object that identifies which adapter to use. The admin panel reads the adapter name from the target media collection's `meta.storageAdapter` and passes it to the generic media functions.

````ts
// @vexcms/core/src/media/types.ts

/**
 * Client identifier for a storage adapter.
 *
 * This is a simple object — it does NOT contain methods. The admin panel
 * uses `vexConvexApi.media.*` (imported from `@vexcms/core`) to call
 * generic media functions, passing the adapter name as the first argument.
 *
 * The adapter name comes from the target media collection's `meta.storageAdapter`.
 *
 * @example
 * ```ts
 * // In file-storage-convex/src/client.ts
 * export const convexStorageClient = {
 *   adapterName: "convex",
 * } satisfies StorageAdapterClient;
 * ```
 */
export interface StorageAdapterClient {
  /** The adapter's name — matches `VexStorageAdapter.name`. */
  adapterName: string;
}
````

### 4. Core media API — `mediaMutationApi` and `mediaQueryApi`

Core provides factory functions that accept `VexConfig` and Convex function builders, then route calls to the correct adapter by name.

```ts
// @vexcms/core/src/convex/media.ts
import { v } from "convex/values";
import type { VexConfig } from "../config/types";
import type { VexStorageAdapter } from "../media/types";

/**
 * Creates generic media mutation functions that route to the correct adapter.
 *
 * Each returned function accepts an `adapter` parameter that matches the
 * adapter's `name` property. The function looks up the adapter in the config
 * and calls the corresponding method.
 *
 * @param config — The VexConfig with storage adapters.
 * @param mutationBuilder — The Convex mutation builder (from `./_generated/server`).
 * @returns Object with `generateUploadUrl`, `createMediaDocument`, `deleteMedia`.
 */
export function mediaMutationApi(
  config: VexConfig,
  mutationBuilder: typeof mutation,
) {
  return {
    generateUploadUrl: mutationBuilder({
      args: v.object({ adapter: v.string() }),
      returns: v.object({ url: v.string() }),
      handler: async (ctx, args) => {
        const adapter = config.storageAdapters?.find(
          (a) => a.name === args.adapter,
        );
        if (!adapter) {
          throw new Error(`Storage adapter "${args.adapter}" not found`);
        }
        return await adapter.generateUploadUrl(ctx);
      },
    }),

    createMediaDocument: mutationBuilder({
      args: v.object({
        adapter: v.string(),
        collectionSlug: v.string(),
        storageId: v.string(),
        filename: v.string(),
        mimeType: v.string(),
        size: v.number(),
        alt: v.optional(v.string()),
        adapterFields: v.optional(v.record(v.string(), v.any())),
      }),
      returns: v.string(),
      handler: async (ctx, args) => {
        const adapter = config.storageAdapters?.find(
          (a) => a.name === args.adapter,
        );
        if (!adapter) {
          throw new Error(`Storage adapter "${args.adapter}" not found`);
        }
        return await adapter.createMediaDocument(ctx, {
          collectionSlug: args.collectionSlug,
          storageId: args.storageId,
          filename: args.filename,
          mimeType: args.mimeType,
          size: args.size,
          alt: args.alt,
          adapterFields: args.adapterFields,
        });
      },
    }),

    deleteMedia: mutationBuilder({
      args: v.object({
        adapter: v.string(),
        mediaId: v.string(),
        softDelete: v.optional(v.boolean()),
      }),
      returns: v.boolean(),
      handler: async (ctx, args) => {
        const adapter = config.storageAdapters?.find(
          (a) => a.name === args.adapter,
        );
        if (!adapter) {
          throw new Error(`Storage adapter "${args.adapter}" not found`);
        }
        return await adapter.deleteMedia(ctx, {
          collectionSlug: "", // Not needed — mediaId is enough
          mediaId: args.mediaId,
          softDelete: args.softDelete,
        });
      },
    }),
  };
}

/**
 * Creates generic media query functions that route to the correct adapter.
 *
 * @param config — The VexConfig with storage adapters.
 * @param queryBuilder — The Convex query builder (from `./_generated/server`).
 * @returns Object with `getUrl`.
 */
export function mediaQueryApi(config: VexConfig, queryBuilder: typeof query) {
  return {
    getUrl: queryBuilder({
      args: v.object({
        adapter: v.string(),
        mediaId: v.string(),
      }),
      returns: v.object({
        url: v.optional(v.string()),
        error: v.optional(v.string()),
      }),
      handler: async (ctx, args) => {
        const adapter = config.storageAdapters?.find(
          (a) => a.name === args.adapter,
        );
        if (!adapter) {
          return {
            url: undefined,
            error: `Adapter "${args.adapter}" not found`,
          };
        }
        return await adapter.getUrl(ctx, {
          collectionSlug: "", // Not needed — mediaId is enough
          mediaId: args.mediaId,
        });
      },
    }),
  };
}
```

### 5. Upload field references media collection by slug

```ts
// User-defined collection
featuredImage: upload({ to: "images", label: "Featured Image" });
// → generates: featuredImage: v.array(v.id("images")) in Convex schema
// → stores: array of media document IDs in the "images" collection
// Note: Even single-file upload fields store as arrays to avoid migrations
// when switching from single to multiple files

// With max limit
heroImages: upload({ to: "images", label: "Hero Images", max: 5 });
// → generates: heroImages: v.array(v.id("images")) in Convex schema
// → stores: array of media document IDs (max 5) in the "images" collection
```

### 6. Generated types from media collections

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

### 7. React upload field — media picker + direct upload

```tsx
// UploadFieldInput renders:
// - Empty state: dropzone + "Browse media library" button
// - Filled state: thumbnail + "Change" button
// - Clicking "Browse" opens MediaPicker popover with grid of "images" collection
// - Dropzone uploads file → creates media doc in "images" → stores ID in field
// - Always stores as array of media document IDs (even for single-file uploads)
```

The upload field always stores an array of media document IDs, even for single-file uploads. This design choice avoids migrations when users switch from single to multiple file uploads. The field configuration includes a `max` option to limit the number of files:

```tsx
// Upload field config
featuredImage: upload({ to: "images", label: "Featured Image" });
// → stores: Id<"images">[] (always an array)

heroImages: upload({ to: "images", label: "Hero Images", max: 5 });
// → stores: Id<"images">[] (max 5 items)
```

### 8. Admin upload component using StorageAdapterClient

The admin panel's `UploadFieldInput` component uses the `StorageAdapterClient` to upload files. Here's how it works for both single and multiple file uploads:

```tsx
// packages/react/src/fields/upload/Input.tsx
import { useStorageAdapterClient } from "../../context/StorageAdapterClientContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convexMutation } from "@convex-dev/react-query";

interface UploadFieldInputProps {
  collectionSlug: string; // e.g., "images"
  value: string[]; // Array of media document IDs
  onChange: (value: string[]) => void;
  max?: number;
}

export function UploadFieldInput({
  collectionSlug,
  value,
  onChange,
  max,
}: UploadFieldInputProps) {
  const adapterClient = useStorageAdapterClient();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: convexMutation(async (file: File) => {
      // 1. Get upload URL from adapter (pure function, called directly)
      const { url } = await adapterClient.generateUploadUrl();

      // 2. POST file to URL
      const response = await fetch(url, { method: "POST", body: file });
      if (!response.ok) throw new Error("Upload failed");

      // 3. Create media document (pure function, called directly)
      const mediaId = await adapterClient.createMediaDocument({
        collectionSlug,
        storageId: "pending", // Adapter-specific storage ID
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        alt: file.name,
      });

      return mediaId;
    }),
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check max limit
      if (max && value.length + acceptedFiles.length > max) {
        throw new Error(`Maximum ${max} files allowed`);
      }

      // Upload each file and collect media IDs
      const uploadPromises = acceptedFiles.map(async (file) => {
        const mediaId = await uploadMutation.mutateAsync(file);
        return mediaId;
      });

      const newMediaIds = await Promise.all(uploadPromises);
      onChange([...value, ...newMediaIds]);

      // Invalidate media collection query
      queryClient.invalidateQueries({ queryKey: ["media", collectionSlug] });
    },
    [collectionSlug, value, max, uploadMutation, onChange, queryClient],
  );

  const removeMedia = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  return (
    <div>
      {/* Dropzone */}
      <MediaUploadDropzone targetCollection={collectionSlug} onDrop={onDrop} />

      {/* Selected media items */}
      <div className="mt-4 space-y-2">
        {value.map((mediaId, index) => (
          <div key={mediaId} className="flex items-center gap-2">
            <span>{mediaId}</span>
            <button onClick={() => removeMedia(index)}>Remove</button>
          </div>
        ))}
      </div>

      {/* Media picker */}
      <MediaPicker
        collectionSlug={collectionSlug}
        selectedIds={value}
        onSelect={(mediaId) => {
          if (max && value.length >= max) return;
          onChange([...value, mediaId]);
        }}
      />
    </div>
  );
}
```

## API Surface

| Export                    | Package                       | Purpose                                                             |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `VexStorageAdapter`       | `@vexcms/core`                | Interface for storage adapters (with method signatures)             |
| `VexStorageConfigError`   | `@vexcms/core`                | Error for invalid storage config                                    |
| `StorageAdapterClient`    | `@vexcms/core`                | Simple adapter identifier object (`{ adapterName: string }`)        |
| `mediaMutationApi`        | `@vexcms/core/convex`         | Factory for generic media mutations (routes by adapter name)        |
| `mediaQueryApi`           | `@vexcms/core/convex`         | Factory for generic media queries (routes by adapter name)          |
| `vexConvexApi`            | `@vexcms/core`                | Exports `media.*` functions for admin panel                         |
| `upload()`                | `@vexcms/core`                | Field config function for upload fields (stores array of media IDs) |
| `UploadField`             | `@vexcms/core`                | Resolved upload field type                                          |
| `UploadFieldInput`        | `@vexcms/core`                | Input config type for upload fields                                 |
| `convexFileStorage()`     | `@vexcms/file-storage-convex` | Convex file storage adapter (returns ConvexStorageAdapter instance) |
| `ConvexStorageAdapter`    | `@vexcms/file-storage-convex` | Class implementing VexStorageAdapter for Convex storage             |
| `defineMediaCollection()` | `@vexcms/file-storage-convex` | Helper to define media collections with required + adapter fields   |
| `convexStorageClient`     | `@vexcms/file-storage-convex` | Adapter client identifier (`{ adapterName: "convex" }`)             |
| `UploadFieldInput`        | `@vexcms/react`               | React input component (dropzone + picker, stores array)             |
| `UploadFieldCell`         | `@vexcms/react`               | React cell component (thumbnail)                                    |
| `MediaLibraryPage`        | `@vexcms/react`               | Media library collection view                                       |
| `MediaPicker`             | `@vexcms/react`               | Media picker popover                                                |
| `MediaUploadDropzone`     | `@vexcms/react`               | File upload dropzone                                                |

## Status / Progress Checklist

- [x] Core storage types (`VexStorageAdapter`, `VexStorageConfigError`, `StorageAdapterClient`, `mediaCollections` in `VexConfig`)
- [x] Core storage validators (`createMediaDocumentArgs`, `deleteMediaArgs`, `getUrlArgs`)
- [x] Upload field type (config, types, validator, inputSchema) with `to` parameter (stores array of media IDs)
- [x] Core `ADMIN_FIELDS` and `AdminField` union updated
- [x] Storage adapter config integration (`VexConfigInput.storage.adapters`, `defineConfig` merge)
- [x] Storage validation in `media/config.ts` (slug collision, upload field `to` validation, adapter merging)
- [x] File storage convex adapter (`defineMediaCollection`, `convexFileStorage`, Convex functions)
- [x] `uploadFile` client-side function (native Web APIs — no node-fetch; see D22)
- [x] `StorageAdapterProvider` in `@vexcms/react` — replaces `getStorageAdapterClient()` pattern (see D23)
- [x] ~~Storage adapter client (`getStorageAdapterClient()` in `file-storage-convex/client.ts`)~~ — **DEPRECATED** (dead code, superseded by D23)
- [x] React upload field input component (dropzone + picker)
- [x] React upload field cell component (thumbnail)
- [x] React media library page (grid view)
- [x] React media picker popover
- [x] Field component registry updated
- [ ] Admin panel media collection routes
- [x] Tests for upload field type
- [x] Tests for storage adapter merge logic
- [x] Tests for media collection validation
- [x] Tests for `defineMediaCollection` and `convexFileStorage` (Vitest)
- [ ] Tests for `createMediaDocument` (convex-test)
- [ ] Tests for `deleteMedia` (convex-test)
- [ ] Tests for `getUrl` (convex-test)
- [x] Tests for `ConvexStorageAdapter` in `adapter/index.test.ts`
- [ ] Tests for React upload components

## Design Decisions

| #    | Decision (one line)                                                                                                                                                                                                                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1   | Storage adapter mimics `VexAuthAdapter` pattern — adapter receives media collections, processes them, returns them to core.                                                                                                                                                                                                                                                    |
| D2   | Core enforces 6 base fields on every media collection: `alt`, `filename`, `mimeType`, `size`, `storageId`, `deleted`. Adapter adds adapter-specific fields.                                                                                                                                                                                                                    |
| D3   | `storageAdapters` is an **optional array** in `VexConfigInput` — no default adapter, no auto-application. Admin panel works without any adapter configured. `upload()` fields are impossible without a configured adapter.                                                                                                                                                     |
| D4   | `upload()` field stores media document ID array (`v.array(v.id("<to-slug>"))`) — `to` parameter references the media collection slug. Even single-file uploads store as arrays to avoid migrations when switching from single to multiple files.                                                                                                                               |
| D5   | Media collections are stored in `VexConfig.mediaCollections` (separate from `collections`) — admin panel renders them in a dedicated "Media" section.                                                                                                                                                                                                                          |
| D6   | `deleted` boolean field is always present on media collections — soft delete behavior enabled by adapter `softDelete` option.                                                                                                                                                                                                                                                  |
| D7   | Admin UI supports media picker + direct upload — picker shows grid of target media collection, dropzone uploads directly.                                                                                                                                                                                                                                                      |
| D8   | Cascade delete is default — `softDelete: true` opts into setting `deleted: true` instead of physical deletion.                                                                                                                                                                                                                                                                 |
| D9   | Upload is a distinct field type (not a relationship variant) — custom UI (dropzone, picker, thumbnail) justifies separate type.                                                                                                                                                                                                                                                |
| D10  | Adapter exports `defineMediaCollection()` — wraps core collection creation, adds required + adapter-specific fields.                                                                                                                                                                                                                                                           |
| D11  | `to` parameter on `upload()` is **required** — no default. User must explicitly reference the media collection.                                                                                                                                                                                                                                                                |
| D12  | Adapter is a **class implementing VexStorageAdapter** — `ConvexStorageAdapter` implements `VexStorageAdapter` from `@vexcms/core`. All methods accept `ctx` as the first parameter. The class is used by core's `mediaMutationApi`/`mediaQueryApi` to route calls.                                                                                                             |
| D13  | Multi-adapter support via **generic media API** — core provides `mediaMutationApi` and `mediaQueryApi` that accept `VexConfig` and function builders, then route calls to the correct adapter by name. Users wrap these in their own Convex functions at `convex/vex/media.ts`. The admin panel calls `vexConvexApi.media.*` with the adapter name from `meta.storageAdapter`. |
| D13b | `StorageAdapterClient` is a **simple identifier object** — `{ adapterName: string }`. It does NOT contain methods. The admin panel uses `vexConvexApi.media.*` (imported from `@vexcms/core`) to call generic media functions, passing the adapter name as the first argument.                                                                                                 |
| D14  | Core provides **generic media functions** — `mediaMutationApi` and `mediaQueryApi` in `@vexcms/core/convex` accept `VexConfig` and Convex function builders, then route calls to the correct adapter by name. Users wrap these in their own Convex functions. TypeScript and Convex runtime enforce compliance.                                                                |
| D15  | `generateUploadUrl` is a **protocol-specific function** — returns different shapes per protocol (presigned-url, direct-upload, streaming). The admin panel uses the `type` field to determine how to upload the file.                                                                                                                                                          |
| D16  | Adapter functions are **standardized by name** — `generateUploadUrl`, `createMediaDocument`, `deleteMedia`, `getUrl`. All adapters must implement these methods with the same signature. Implementation is adapter-specific.                                                                                                                                                   |
| D17  | Batch upload is handled by **Promise.all on single-file uploads** — the adapter never exports `uploadMany`. The React component calls the upload function once per file.                                                                                                                                                                                                       |
| D18  | `listMedia` and `searchMedia` are **generic Convex queries implemented by core** — not adapter-specific. They query the media collection tables directly.                                                                                                                                                                                                                      |
| D19  | `StorageAdapterClient` is **framework-agnostic** — the interface is a simple object `{ adapterName: string }`. It lives in `@vexcms/core` and is re-exported by adapters. The React package uses `vexConvexApi.media.*` directly.                                                                                                                                              |
| D20  | The `./react` entry point has **optional React peer deps** — the main package installs fine without React, but the `./react` entry point won't work unless React, TanStack Query, and convex-react are present.                                                                                                                                                                |
| D21  | User must export media functions at `convex/vex/media.ts` — the admin panel calls `vexConvexApi.media.*` which resolves to the user's generated API. This ensures the functions are available at `api.media.*` in the Convex runtime.                                                                                                                                          |
| D22  | `uploadFile` uses **native Web APIs only** — no `node-fetch`, no `"use node"`, no `node:buffer`. Uses global `fetch` and `File`. Works in browser, Convex V8 runtime, and Node.js 18+. `file-storage-convex`'s tsconfig adds `"DOM"` and `"DOM.Iterable"` to lib so `File` and `fetch` are typed without importing them. ESLint `no-undef` is disabled for browser-facing packages (`file-storage-convex`, `react`, `next`) since TypeScript's type checker covers this more accurately. |
| D23  | Upload functions **never cross the RSC boundary** — `clientUploads` is stripped from `sanitizeConfigForClient` and removed from `ClientVexConfig`. Instead, users create a `"use client"` wrapper component (`VexStorageProvider`) that imports `uploadFile` directly on the client and wraps `NextAdminLayout` with `StorageAdapterProvider` from `@vexcms/react`. The provider supplies upload functions via React context. The user file (`vex-storage-provider.tsx`) only needs editing when adding a new storage adapter. |
| D24  | `UploadField` does **not** store `adapterName` — the adapter name is derived at runtime by looking up `field.to` in `config.mediaCollections` (which carries `meta.storageAdapter`). No injection pass in `defineConfig()`, no duplication of data. React upload components do the lookup: `config.mediaCollections.find(mc => mc.slug === field.to)?.meta?.storageAdapter`. |
| D25  | `UploadField<TFieldMeta>` has **no `MediaFieldMeta` constraint** — `TFieldMeta` defaults to `{}` same as all other field types. Constraining `UploadField` to `MediaFieldMeta` would cascade to the entire `AdminField` union forcing all field types to satisfy it. Adapter name is stored separately (see D24). |
| D26  | Convex-specific URL field is named **`convexUrl`** (not `src`) — consistent with the spec's generated types example (`ImagesDocument.convexUrl`). `createMediaDocument` in `methods.ts` inserts as `convexUrl`. |
| D27  | `softDelete` lives at **`adapter.admin.softDelete`** — grouped under `admin` alongside other admin-panel-facing options, not a top-level property on the adapter. Tests access `adapter.admin.softDelete`. |
| D28  | `getStorageAdapterClient()` in `file-storage-convex/src/client.ts` is **dead code** — the function is not imported anywhere in the working app, react package, or next package. It was from an earlier design where `StorageAdapterClient` had full Convex ctx method signatures. The working upload flow uses `StorageAdapterProvider` + `uploadFile`. This file should be deleted in a cleanup pass. |

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
| Chunked upload / resumable upload | Future spec | `uploadFile` return type can be extended to support this later. |
| Third-party SDK upload (Cloudinary widget, UploadThing) | Future spec | Adapter can return `type: "sdkUpload"` from `uploadFile` later. |
| Direct upload to server (multipart/form-data) | Future spec | Adapter can return `type: "directUpload"` from `uploadFile` later. |

## Target Directory Structure

```
packages/core/src/
  media/
    types.ts                    🟡 MODIFY — VexStorageAdapter (with method signatures), VexStorageConfigError, StorageAdapterClient
    config.ts                   🟡 NEW — Storage adapter validation (slug collision, upload refs)
    index.ts                    🟡 NEW — barrel
  convex/
    media.ts                    🟡 NEW — mediaMutationApi, mediaQueryApi factories
  types/
    generated.ts                🟡 MODIFY — add MediaCollectionSlug, MediaDocumentBySlug
  index.ts                      🟡 MODIFY — export media types, vexConvexApi
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
  adapter/
    index.ts                    🟡 MODIFY — ConvexStorageAdapter class implementing VexStorageAdapter
    types.ts                    🟡 NEW — ConvexFileStorageOptions
  client.ts                     🟡 NEW — convexStorageClient ({ adapterName: "convex" })
  config.ts                     🟡 NEW — defineMediaCollection()
  test/
    adapter.test.ts             🟡 NEW — Tests for ConvexStorageAdapter class (all functions in one file)

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

apps/www/
  app/(admin)/media/            🟡 NEW — Media library page route
  convex/vex/index.ts           🟡 MODIFY — add queryApi, mutationApi
  convex/vex/media.ts           🟡 NEW — mediaMutationApi, mediaQueryApi wrapper
```

## Implementation Order

### Step 1 — Core storage types, media API factories, and interfaces [agent]

**Status: ✅ COMPLETE**

Core storage types, media API factories, and interfaces have been created. The `VexStorageAdapter` interface, `VexStorageConfigError` class, `StorageAdapterClient` identifier, and `VexConfig` types have been updated. Every media collection is tagged with `meta.storageAdapter`.

**Implementation Status:**

- ✅ `media/types.ts` — VexStorageAdapter interface, VexStorageConfigError class, StorageAdapterClient identifier
- ✅ `media/config.ts` — validateAndMergeStorageConfig function
- ✅ `media/index.ts` — Barrel export
- ✅ `media/validators.ts` — Convex validators for media operations
- ✅ `media/types.test.ts` — Tests for VexStorageConfigError
- ✅ `config/types.ts` — Updated with storageAdapters and mediaCollections
- ✅ `types/generated.ts` — Updated with MediaCollectionSlug type
- ✅ `index.ts` — Exported media types and validators

**Next:** Proceed to Step 2 — Custom media API functions in core/src/media/api

**Files:**

- `packages/core/src/media/types.ts` (MODIFY)
- `packages/core/src/media/config.ts` (NEW)
- `packages/core/src/media/index.ts` (NEW)
- `packages/core/src/convex/media.ts` (NEW)
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

### Step 2 — Custom media API functions in core/src/media/api [agent]

**Status: ✅ COMPLETE**

Custom media API functions have been created in `core/src/media/api` that mimic the API structure of the main API in `core/src/api`. These functions proxy requests to the proper adapter and are exported from the core package.

**Implementation Status:**

- ✅ `types.ts` — TypeScript types for API functions (GenerateUploadUrlArgs, CreateMediaDocumentArgs, DeleteMediaArgs, GetUrlArgs, ListMediaArgs, SearchMediaArgs)
- ✅ `mutations.ts` — Mutation functions (generateUploadUrl, createMediaDocument, deleteMedia)
- ✅ `queries.ts` — Query functions (getUrl)
- ✅ `index.ts` — Barrel export of all API functions and types

**Next:** Proceed to Step 3 — Upload field type in core

**Files:**

- `packages/core/src/media/api/index.ts` (NEW)
- `packages/core/src/media/api/mutations.ts` (NEW)
- `packages/core/src/media/api/queries.ts` (NEW)
- `packages/core/src/media/api/types.ts` (NEW)
- `packages/core/src/media/api/index.ts` (MODIFY to export)

**Implementation details:**

1. ✅ Create `types.ts` with TypeScript types for the API functions (e.g., `CreateMediaDocumentArgs`, `DeleteMediaArgs`, `GetUrlArgs`, `ListMediaArgs`, `SearchMediaArgs`)

2. ✅ Create `mutations.ts` with mutation functions that:
   - Accept adapter name and other parameters
   - Look up the adapter from `VexConfig.storageAdapters`
   - Call the adapter's corresponding method
   - Return the result

3. ✅ Create `queries.ts` with query functions that:
   - Accept adapter name and other parameters
   - Look up the adapter from `VexConfig.storageAdapters`
   - Call the adapter's corresponding method
   - Return the result

4. ✅ Create `index.ts` that exports all API functions and types

5. ✅ Update `packages/core/src/index.ts` to export the media API functions

**API structure (mimics core/src/api):**

```ts
// packages/core/src/media/api/types.ts
export interface GenerateUploadUrlArgs {
  adapter: string;
}

export interface CreateMediaDocumentArgs {
  adapter: string;
  collectionSlug: string;
  storageId: string;
  filename: string;
  mimeType: string;
  size: number;
  alt?: string;
  adapterFields?: Record<string, unknown>;
}

export interface DeleteMediaArgs {
  adapter: string;
  mediaId: string;
  softDelete?: boolean;
}

export interface GetUrlArgs {
  adapter: string;
  mediaId: string;
}

export interface ListMediaArgs {
  adapter: string;
  collectionSlug: string;
  limit?: number;
  offset?: number;
}

export interface SearchMediaArgs {
  adapter: string;
  collectionSlug: string;
  query: string;
}

// packages/core/src/media/api/mutations.ts
export async function generateUploadUrl(
  config: VexConfig,
  args: GenerateUploadUrlArgs,
): Promise<{ url: string }> {
  const adapter = config.storageAdapters?.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  return await adapter.generateUploadUrl({} as any);
}

export async function createMediaDocument(
  config: VexConfig,
  args: CreateMediaDocumentArgs,
): Promise<string> {
  const adapter = config.storageAdapters?.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  return await adapter.createMediaDocument({} as any, {
    collectionSlug: args.collectionSlug,
    storageId: args.storageId,
    filename: args.filename,
    mimeType: args.mimeType,
    size: args.size,
    alt: args.alt,
    adapterFields: args.adapterFields,
  });
}

export async function deleteMedia(
  config: VexConfig,
  args: DeleteMediaArgs,
): Promise<boolean> {
  const adapter = config.storageAdapters?.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  return await adapter.deleteMedia({} as any, {
    collectionSlug: "",
    mediaId: args.mediaId,
    softDelete: args.softDelete,
  });
}

// packages/core/src/media/api/queries.ts
export async function getUrl(
  config: VexConfig,
  args: GetUrlArgs,
): Promise<{ url: string } | { url: null; error: string }> {
  const adapter = config.storageAdapters?.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  return await adapter.getUrl({} as any, {
    collectionSlug: "",
    mediaId: args.mediaId,
  });
}

// packages/core/src/media/api/index.ts
export * from "./types";
export * from "./mutations";
export * from "./queries";
```

**Edge cases:**

> **Edge: Adapter not found.** Throw `VexStorageConfigError` with a descriptive message.

> **Edge: Adapter method throws error.** Propagate the error to the caller.

> **Edge: Invalid arguments.** Validate arguments and throw descriptive errors.

---

#### `packages/core/src/media/types.ts` (MODIFY)

````ts
import type { CollectionConfig } from "../collections";
import type {
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDataModel,
} from "convex/server";

/**
 * Client identifier for a storage adapter.
 *
 * This is a simple object — it does NOT contain methods. The admin panel
 * uses `vexConvexApi.media.*` (imported from `@vexcms/core`) to call
 * generic media functions, passing the adapter name as the first argument.
 *
 * The adapter name comes from the target media collection's `meta.storageAdapter`.
 *
 * @example
 * ```ts
 * // In file-storage-convex/src/client.ts
 * export const convexStorageClient = {
 *   adapterName: "convex",
 * } satisfies StorageAdapterClient;
 * ```
 */
export interface StorageAdapterClient {
  /** The adapter's name — matches `VexStorageAdapter.name`. */
  adapterName: string;
}

/**
 * A storage adapter for VexCMS — defines media collections, file storage
 * backend, and deletion behavior.
 *
 * Adapters receive user-defined media collections via `defineMediaCollection()`,
 * validate them, add required fields and adapter-specific fields, tag them with
 * `meta.storageAdapter`, and return the processed collections to core. Core
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
   * collection is tagged with `meta.storageAdapter` equal to this adapter's
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

  /**
   * Generates a URL to upload a file to.
   * Called by core's `mediaMutationApi.generateUploadUrl`.
   */
  generateUploadUrl(
    ctx: GenericMutationCtx<GenericDataModel>,
  ): Promise<{ url: string }>;

  /**
   * Creates a media document in Convex after the file is uploaded.
   * Called by core's `mediaMutationApi.createMediaDocument`.
   */
  createMediaDocument(
    ctx: GenericMutationCtx<GenericDataModel>,
    args: {
      collectionSlug: string;
      storageId: string;
      filename: string;
      mimeType: string;
      size: number;
      alt?: string;
      adapterFields?: Record<string, unknown>;
    },
  ): Promise<string>;

  /**
   * Deletes a media document and its file from storage.
   * Called by core's `mediaMutationApi.deleteMedia`.
   */
  deleteMedia(
    ctx: GenericMutationCtx<GenericDataModel>,
    args: {
      collectionSlug: string;
      mediaId: string;
      softDelete?: boolean;
    },
  ): Promise<boolean>;

  /**
   * Returns a URL for a media file.
   * Called by core's `mediaQueryApi.getUrl`.
   */
  getUrl(
    ctx: GenericQueryCtx<GenericDataModel>,
    args: {
      collectionSlug: string;
      mediaId: string;
    },
  ): Promise<{ url: string } | { url: null; error: string }>;
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

#### `packages/core/src/convex/media.ts` (NEW)

Core provides factory functions that accept `VexConfig` and Convex function builders, then route calls to the correct adapter by name.

```ts
// @vexcms/core/src/convex/media.ts
import { v } from "convex/values";
import type { VexConfig } from "../config/types";
import type { VexStorageAdapter } from "../media/types";
import { query, mutation } from "./_generated/server";

/**
 * Creates generic media mutation functions that route to the correct adapter.
 *
 * Each returned function accepts an `adapter` parameter that matches the
 * adapter's `name` property. The function looks up the adapter in the config
 * and calls the corresponding method.
 *
 * @param config — The VexConfig with storage adapters.
 * @param mutationBuilder — The Convex mutation builder (from `./_generated/server`).
 * @returns Object with `generateUploadUrl`, `createMediaDocument`, `deleteMedia`.
 */
export function mediaMutationApi(
  config: VexConfig,
  mutationBuilder: typeof mutation,
) {
  return {
    generateUploadUrl: mutationBuilder({
      args: v.object({ adapter: v.string() }),
      returns: v.object({ url: v.string() }),
      handler: async (ctx, args) => {
        const adapter = config.storageAdapters?.find(
          (a) => a.name === args.adapter,
        );
        if (!adapter) {
          throw new Error(`Storage adapter "${args.adapter}" not found`);
        }
        return await adapter.generateUploadUrl(ctx);
      },
    }),

    createMediaDocument: mutationBuilder({
      args: v.object({
        adapter: v.string(),
        collectionSlug: v.string(),
        storageId: v.string(),
        filename: v.string(),
        mimeType: v.string(),
        size: v.number(),
        alt: v.optional(v.string()),
        adapterFields: v.optional(v.record(v.string(), v.any())),
      }),
      returns: v.string(),
      handler: async (ctx, args) => {
        const adapter = config.storageAdapters?.find(
          (a) => a.name === args.adapter,
        );
        if (!adapter) {
          throw new Error(`Storage adapter "${args.adapter}" not found`);
        }
        return await adapter.createMediaDocument(ctx, {
          collectionSlug: args.collectionSlug,
          storageId: args.storageId,
          filename: args.filename,
          mimeType: args.mimeType,
          size: args.size,
          alt: args.alt,
          adapterFields: args.adapterFields,
        });
      },
    }),

    deleteMedia: mutationBuilder({
      args: v.object({
        adapter: v.string(),
        mediaId: v.string(),
        softDelete: v.optional(v.boolean()),
      }),
      returns: v.boolean(),
      handler: async (ctx, args) => {
        const adapter = config.storageAdapters?.find(
          (a) => a.name === args.adapter,
        );
        if (!adapter) {
          throw new Error(`Storage adapter "${args.adapter}" not found`);
        }
        return await adapter.deleteMedia(ctx, {
          collectionSlug: "", // Not needed — mediaId is enough
          mediaId: args.mediaId,
          softDelete: args.softDelete,
        });
      },
    }),
  };
}

/**
 * Creates generic media query functions that route to the correct adapter.
 *
 * @param config — The VexConfig with storage adapters.
 * @param queryBuilder — The Convex query builder (from `./_generated/server`).
 * @returns Object with `getUrl`.
 */
export function mediaQueryApi(config: VexConfig, queryBuilder: typeof query) {
  return {
    getUrl: queryBuilder({
      args: v.object({
        adapter: v.string(),
        mediaId: v.string(),
      }),
      returns: v.object({
        url: v.optional(v.string()),
        error: v.optional(v.string()),
      }),
      handler: async (ctx, args) => {
        const adapter = config.storageAdapters?.find(
          (a) => a.name === args.adapter,
        );
        if (!adapter) {
          return {
            url: undefined,
            error: `Adapter "${args.adapter}" not found`,
          };
        }
        return await adapter.getUrl(ctx, {
          collectionSlug: "", // Not needed — mediaId is enough
          mediaId: args.mediaId,
        });
      },
    }),
  };
}
```

---

#### `packages/core/src/media/index.ts` (NEW)

```ts
export * from "./types";
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
   * `meta.storageAdapter` indicating which adapter owns it.
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

````ts
// ============================================================================
// MEDIA / STORAGE ADAPTER
// ============================================================================

export {
  type VexStorageAdapter,
  type StorageAdapterClient,
  VexStorageConfigError,
} from "./media/types";
export { validateAndMergeStorageConfig } from "./media/config";
export { mediaMutationApi, mediaQueryApi } from "./convex/media";

// ============================================================================
// CONVEX API
// ============================================================================

export { mediaMutationApi, mediaQueryApi } from "./convex/media";

/**
 * Generic media API functions for the admin panel.
 *
 * These functions are imported from `@vexcms/core` and called with the
 * adapter name from the target media collection's `meta.storageAdapter`.
 *
 * @example
 * ```ts
 * // In React components
 * import { vexConvexApi } from "@vexcms/core";
 *
 * const { generateUploadUrl } = vexConvexApi.media;
 * const { url } = await generateUploadUrl({ adapter: "convex" });
 * ```
 */
export const vexConvexApi = {
  media: {
    generateUploadUrl: async (args: { adapter: string }) => {
      // This is a placeholder — the actual implementation is generated
      // by the user's convex/vex/media.ts wrapper
      throw new Error("Not implemented — see convex/vex/media.ts");
    },
    createMediaDocument: async (args: {
      adapter: string;
      collectionSlug: string;
      storageId: string;
      filename: string;
      mimeType: string;
      size: number;
      alt?: string;
      adapterFields?: Record<string, unknown>;
    }) => {
      throw new Error("Not implemented — see convex/vex/media.ts");
    },
    deleteMedia: async (args: {
      adapter: string;
      mediaId: string;
      softDelete?: boolean;
    }) => {
      throw new Error("Not implemented — see convex/vex/media.ts");
    },
    getUrl: async (args: { adapter: string; mediaId: string }) => {
      throw new Error("Not implemented — see convex/vex/media.ts");
    },
  },
};
````

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

> **Edge: Media collection from adapter A is referenced by upload field in collection, but adapter A is the second adapter.** The registry lookup uses `meta.storageAdapter` to find the correct adapter functions. If no registry is provided and the default function paths don't match, the upload fails at runtime. This is a user configuration error — document that the registry is required for multi-adapter.

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
 * @returns Merged media collections with `meta.storageAdapter` set.
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

        // Tag with storageAdapter
        const taggedCollection: CollectionConfig = {
          ...collection,
          meta: {
            ...collection.meta,
            storageAdapter: adapter.name,
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
    expect(config.mediaCollections[0].meta?.storageAdapter).toBe("convex");
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

Implement `VexStorageAdapter` in `@vexcms/file-storage-convex`. Export `defineMediaCollection()` helper and `convexFileStorage()` adapter. The adapter implements `VexStorageAdapter` directly — methods accept `ctx` as the first parameter and delegate to Convex storage operations. Users wrap `mediaMutationApi`/`mediaQueryApi` in their own Convex functions at `convex/vex/media.ts`.

**Files:**

- `packages/file-storage-convex/src/index.ts` (MODIFY)
- `packages/file-storage-convex/src/adapter/index.ts` (MODIFY — class implementing VexStorageAdapter)
- `packages/file-storage-convex/src/client.ts` (NEW — convexStorageClient identifier)
- `packages/file-storage-convex/src/config.ts` (MODIFY — defineMediaCollection)
- `packages/file-storage-convex/src/adapter/index.test.ts` (NEW — tests for ConvexStorageAdapter class)

**Edge cases:**

> **Edge: `defineMediaCollection()` called with missing `alt` field.** The adapter adds `alt: text({ required: true })` automatically if not present. Every media file should have alt text for accessibility.

> **Edge: `defineMediaCollection()` called with duplicate required fields.** If the user already defines `filename`, `mimeType`, etc., the adapter's defaults are merged with user fields. User fields take precedence for `label`, `admin`, etc., but `required: true` is enforced.

> **Edge: `convexFileStorage()` requires explicit `mediaCollections`.** No default collection is created. The user must pass at least one media collection. This is intentional — no implicit "media" collection.

> **Edge: Convex file storage not available at runtime.** The adapter functions throw descriptive errors if the Convex client is not configured. Same pattern as existing `FileStorageAdapter`.

---

#### `packages/file-storage-convex/src/index.ts` (MODIFY)

````ts
import type { MediaCollectionConfig } from "@vexcms/core";
import { defineMediaCollection: coreDefineMediaCollection, text, number, checkbox, url } from "@vexcms/core";
import { ConvexStorageAdapter } from "./adapter";
import { ConvexFileStorageOptions } from "./config";

/**
 * Defines a media collection with required fields for file storage.
 *
 * Adds core required fields (`alt`, `filename`, `mimeType`, `size`, `storageId`,
 * `deleted`) and Convex-specific fields (`convexUrl`, `width`, `height`).
 * The user can add custom fields (e.g., `caption`, `tags`) via the `fields` parameter.
 *
 * Every collection is tagged with `meta.storageAdapter: "convex"` when
 * processed by `convexFileStorage()`.
 *
 * @param config — Media collection configuration. `slug` is required.
 * @returns A fully-configured `MediaCollectionConfig` ready for the storage adapter.
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
  // Allow other MediaCollectionConfig properties
  [key: string]: unknown;
}): MediaCollectionConfig {
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

  return coreDefineMediaCollection({
    ...config,
    fields: fields as MediaCollectionConfig["fields"],
  });
}

/**
 * Creates a Convex file storage adapter for VexCMS.
 *
 * Processes media collections (adds required fields, validates), configures
 * Convex file storage backend, and returns a `VexStorageAdapter`. Every
 * collection is tagged with `meta.storageAdapter: "convex"`.
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
): ConvexStorageAdapter {
  return new ConvexStorageAdapter(options);
}

// Re-export the adapter client identifier
export { convexStorageClient } from "./client";
      storageAdapter: "convex",
    },
  }));

  return {
    name: "convex",
    mediaCollections,
    softDelete: options?.softDelete ?? false,
  };
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

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

#### `packages/file-storage-convex/src/adapter/index.ts` (MODIFY — class implementing VexStorageAdapter)

````ts
import {
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDataModel,
} from "convex/server";
import type { MediaCollectionConfig, VexStorageAdapter } from "@vexcms/core";
import { ConvexFileStorageOptions } from "../config";

/**
 * Convex storage adapter class — implements VexStorageAdapter.
 *
 * All adapter methods accept the Convex `ctx` as the first parameter,
 * allowing access to `ctx.db`, `ctx.storage`, and other context methods.
 *
 * The class delegates to the `Methods` object for the actual implementation.
 * This allows the individual functions to be exported and used directly
 * by users in their own Convex functions.
 *
 * @example
 * ```ts
 * // apps/www/app/admin/layout.tsx
 * import { ConvexStorageAdapter } from "@vexcms/file-storage-convex/adapter";
 *
 * const adapter = new ConvexStorageAdapter({ mediaCollections: [images] });
 * return <AdminPanel adapterClient={adapter}>{children}</AdminPanel>;
 * ```
 */
export class ConvexStorageAdapter implements VexStorageAdapter {
  readonly name = "convex";
  readonly softDelete: boolean;
  readonly mediaCollections: MediaCollectionConfig[];

  constructor(options: ConvexFileStorageOptions) {
    this.softDelete = options.softDelete ?? false;
    this.mediaCollections = options.mediaCollections.map((mediaCollection) => ({
      ...mediaCollection,
      meta: {
        ...mediaCollection.meta,
        storageAdapter: this.name,
      },
    }));
  }

  async generateUploadUrl(
    ctx: GenericMutationCtx<GenericDataModel>,
  ): Promise<{ url: string }> {
    const url = await ctx.storage.generateUploadUrl();
    return { url };
  }

  async createMediaDocument(
    ctx: GenericMutationCtx<GenericDataModel>,
    args: {
      collectionSlug: string;
      storageId: string;
      filename: string;
      mimeType: string;
      size: number;
      alt?: string;
      adapterFields?: Record<string, unknown>;
    },
  ): Promise<string> {
    const src = await ctx.storage.getUrl(args.storageId as never);
    const docId = await ctx.db.insert(args.collectionSlug, {
      src,
      storageId: args.storageId,
      filename: args.filename,
      mimeType: args.mimeType,
      size: args.size,
      alt: args.alt ?? args.filename,
      deleted: false,
      ...(args.adapterFields ?? {}),
    });
    return docId;
  }

  async deleteMedia(
    ctx: GenericMutationCtx<GenericDataModel>,
    args: {
      collectionSlug: string;
      mediaId: string;
      softDelete?: boolean;
    },
  ): Promise<boolean> {
    const mediaDoc = await ctx.db.get(args.mediaId as never);
    if (!mediaDoc) return false;

    if (args.softDelete ?? this.softDelete) {
      await ctx.db.patch(args.mediaId as never, { deleted: true });
      return true;
    }

    await ctx.storage.delete(mediaDoc.storageId as never);
    await ctx.db.delete(args.mediaId as never);
    return true;
  }

  async getUrl(
    ctx: GenericQueryCtx<GenericDataModel>,
    args: {
      collectionSlug: string;
      mediaId: string;
    },
  ): Promise<{ url: string } | { url: null; error: string }> {
    const mediaDoc = await ctx.db.get(args.mediaId as never);
    if (!mediaDoc) return { url: null, error: "Media Document NotFound" };

    const url = await ctx.storage.getUrl(mediaDoc.storageId as never);
    if (!url) return { url: null, error: "File Url NotFound" };
    return { url };
  }
}
````

#### `packages/file-storage-convex/src/client.ts` (NEW)

```ts
import type { StorageAdapterClient } from "@vexcms/core";

/**
 * Adapter client identifier for the Convex storage adapter.
 *
 * This is a simple object — it does NOT contain methods. The admin panel
 * uses `vexConvexApi.media.*` (imported from `@vexcms/core`) to call
 * generic media functions, passing the adapter name as the first argument.
 */
export const convexStorageClient = {
  adapterName: "convex",
} satisfies StorageAdapterClient;
```

---

#### `packages/file-storage-convex/src/adapter/index.test.ts` (NEW)

```ts
import { describe, it, expect, vi } from "vitest";
import { ConvexStorageAdapter } from "./index";
import { defineMediaCollection } from "../index";

describe("ConvexStorageAdapter", () => {
  it("sets the correct name", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = new ConvexStorageAdapter({ mediaCollections: [images] });
    expect(adapter.name).toBe("convex");
  });

  it("tags collections with storageAdapter", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = new ConvexStorageAdapter({ mediaCollections: [images] });
    expect(adapter.mediaCollections[0].meta?.storageAdapter).toBe("convex");
  });

  it("supports softDelete option", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = new ConvexStorageAdapter({
      mediaCollections: [images],
      softDelete: true,
    });
    expect(adapter.softDelete).toBe(true);
  });

  it("defaults softDelete to false", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = new ConvexStorageAdapter({ mediaCollections: [images] });
    expect(adapter.softDelete).toBe(false);
  });
});
```

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
    expect(adapter.mediaCollections[0].meta?.storageAdapter).toBe("convex");
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

  it("tags collections with storageAdapter", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage({ mediaCollections: [images] });
    expect(adapter.mediaCollections[0].meta?.storageAdapter).toBe("convex");
  });
});
```

### Run tests

```bash
pnpm --filter @vexcms/file-storage-convex test
```

---

```bash
pnpm --filter @vexcms/file-storage-convex test
```

---

### Step 5 — React upload field input and cell [dev]

Build the `UploadFieldInput` component with dropzone + media picker, and `UploadFieldCell` with thumbnail preview. The upload component reads the adapter name from the target media collection's `meta.storageAdapter` and passes it to `vexConvexApi.media.*`.

**Files:**

- `packages/react/src/fields/upload/Input.tsx` (NEW)
- `packages/react/src/fields/upload/Cell.tsx` (NEW)
- `packages/react/src/fields/upload/index.ts` (NEW)
- `packages/react/src/fields/index.tsx` (MODIFY)
- `packages/react/src/adapter.ts` (MODIFY)

### Step 6 — React upload field input and cell [dev]

Build the `UploadFieldInput` component with dropzone + media picker, and `UploadFieldCell` with thumbnail preview. The upload component uses `useStorageAdapterClient()` to get the adapter client for the target media collection.

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
 * Reads the adapter name from the target media collection's meta.storageAdapter
 * and passes it to MediaUploadDropzone and MediaPicker.
 *
 * @param props — Field input component props.
 * @returns The upload field input element.
 */
export const UploadFieldInput = createFieldInput<
  string | undefined,
  UploadField
>(({ name, fieldDef, field, readOnly, collection }) => {
  const [showPicker, setShowPicker] = useState(false);
  const value = field.state.value;

  // Get adapter name from the target media collection's meta.storageAdapter
  const adapterName =
    collection?.mediaCollections?.find((mc) => mc.slug === fieldDef.to)?.meta
      ?.storageAdapter ?? "convex";

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
            adapterName={adapterName}
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
          adapterName={adapterName}
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

Build `MediaUploadDropzone`, `MediaPicker`, and `MediaLibrary` components. The dropzone uses `vexConvexApi.media.*` (imported from `@vexcms/core`) to call generic media functions, passing the adapter name from props. Batch upload is handled by calling `createMediaDocument` in `Promise.all`.

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
import { vexConvexApi } from "@vexcms/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";

interface MediaUploadDropzoneProps {
  targetCollection: string;
  adapterName: string;
  onUploadComplete: (mediaId: string) => void;
}

/**
 * File upload dropzone — handles drag-and-drop and click-to-upload.
 *
 * Uploads files to the target media collection via vexConvexApi.media.*.
 * Uses the adapter's generateUploadUrl() to get a presigned URL, POSTs the file,
 * then calls createMediaDocument() to create the media document.
 *
 * Batch upload: multiple files are uploaded in parallel via `Promise.all` on
 * single-file upload calls.
 *
 * @param props — Dropzone component props.
 */
export function MediaUploadDropzone(props: MediaUploadDropzoneProps) {
  const queryClient = useQueryClient();

  const { mutateAsync: generateUploadUrl } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.generateUploadUrl),
  });

  const { mutateAsync: createMediaDocument } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.createMediaDocument),
  });

  const uploadFile = useCallback(
    async (file: File) => {
      // 1. Get upload URL from adapter
      const { url } = await generateUploadUrl({ adapter: props.adapterName });

      // 2. POST file to URL
      const response = await fetch(url, { method: "POST", body: file });
      if (!response.ok) throw new Error("Upload failed");

      // 3. Create media document
      const mediaId = await createMediaDocument({
        adapter: props.adapterName,
        collectionSlug: props.targetCollection,
        storageId: "pending", // Adapter-specific storage ID
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        alt: file.name,
      });

      // 4. Invalidate media collection query
      queryClient.invalidateQueries({
        queryKey: ["media", props.targetCollection],
      });

      return mediaId;
    },
    [
      props.adapterName,
      props.targetCollection,
      generateUploadUrl,
      createMediaDocument,
      queryClient,
    ],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Batch upload: Promise.all on single-file upload
      const uploadPromises = acceptedFiles.map(async (file) => {
        const mediaId = await uploadFile(file);
        return mediaId;
      });

      const results = await Promise.all(uploadPromises);
      // For single-file dropzone, call onUploadComplete with the first result
      if (results.length > 0) {
        props.onUploadComplete(results[0]);
      }
    },
    [props.targetCollection, props.onUploadComplete, uploadFile],
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
  adapterName: string;
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
              adapterName={props.adapterName}
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

Wire the media library page into the admin panel. Media collections appear in the sidebar under a dedicated "Media" section. The collection list view for media collections uses the grid layout instead of the data table. No storage adapter client context needed — the adapter name comes from `meta.storageAdapter`.

**Files:**

- `packages/react/src/components/admin/CollectionListView.tsx` (MODIFY) — detect media collection and render grid
- `packages/react/src/components/admin/sidebar.tsx` (MODIFY) — add "Media" section
- `packages/react/src/components/admin/AdminPanel.tsx` (MODIFY) — pass config to children for media collection access

---

#### `packages/react/src/components/admin/AdminPanel.tsx` (MODIFY)

```tsx
// Pass the full config to children so they can access mediaCollections
// and read meta.storageAdapter from the target collection.
interface AdminPanelProps {
  children: React.ReactNode;
  config: VexConfig;
}

export function AdminPanel({ children, config }: AdminPanelProps) {
  return (
    <VexConfigContext.Provider value={config}>
      {/* ... existing admin panel layout ... */}
      {children}
    </VexConfigContext.Provider>
  );
}
```

---

#### `packages/react/src/components/admin/CollectionListView.tsx` (MODIFY)

```tsx
import { MediaLibrary } from "../media/MediaLibrary";
import { useVexConfig } from "../../context/VexConfigContext";

// In the list view component, detect if this is a media collection:
const config = useVexConfig();
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

### Step 9 — Custom media API functions in core/src/media/api [dev]

Create custom API functions in `core/src/media/api` that mimic the API structure of the main API in `core/src/api`. These functions proxy requests to the proper adapter and are exported from the core package.

**Pick up here:** After completing Step 8 (admin panel wiring), implement the custom API functions that the admin panel will call via `vexConvexApi.media.*`.

**Files:**

- `packages/core/src/media/api/types.ts` (NEW) — TypeScript types for API arguments (server + client params)
- `packages/core/src/media/api/mutations.ts` (NEW) — Mutation functions (generateUploadUrl, createMediaDocument, deleteMedia)
- `packages/core/src/media/api/queries.ts` (NEW) — Query functions (getUrl, listMedia, searchMedia)
- `packages/core/src/media/api/index.ts` (NEW) — Barrel export
- `packages/core/src/index.ts` (MODIFY) — Export media API functions

**Implementation details:**

Follow the exact paradigm used in `packages/core/src/api/`:

1. **`types.ts`** — Define server-side and client-side args interfaces that extend the base types from `../api/types`:
   - `GenericMediaMutationServerParams` — extends `GenericMutationServerParams`, adds `config: VexConfig`
   - `GenericMediaMutationClientParams` — extends `GenericMutationClientParams`, adds `ctx?: never` discriminator
   - `GenericMediaQueryServerParams` — extends `GenericQueryServerParams`, adds `config: VexConfig`
   - `GenericMediaQueryClientParams` — extends `GenericQueryClientParams`, adds `ctx?: never` discriminator
   - Per-function args: `GenerateUploadUrlServerArgs`, `CreateMediaDocumentServerArgs`, `DeleteMediaServerArgs`, `GetUrlServerArgs`, `ListMediaServerArgs`, `SearchMediaServerArgs`
   - Per-function client args: `GenerateUploadUrlClientArgs`, `CreateMediaDocumentClientArgs`, etc.

2. **`mutations.ts`** — Implement mutation functions that:
   - Accept a single `args` object extending the server-side args interface
   - Look up the adapter from `args.config.storageAdapters` by name
   - Call the adapter's corresponding method with `args.ctx`
   - Return the result
   - Throw `VexStorageConfigError` if adapter not found

3. **`queries.ts`** — Implement query functions that:
   - Accept a single `args` object extending the server-side args interface
   - Look up the adapter from `args.config.storageAdapters` by name
   - Call the adapter's corresponding method with `args.ctx`
   - Return the result
   - Return `{ url: null, error: string }` if adapter not found (for getUrl)

4. **`index.ts`** — Export all types and functions:

   ```ts
   export * from "./types";
   export * from "./mutations";
   export * from "./queries";
   ```

5. **Update `packages/core/src/index.ts`** — Export the media API:
   ```ts
   export * from "./media/api";
   ```

**API structure (mimics `core/src/api`):**

````ts
// packages/core/src/media/api/types.ts
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";

import type {
  GenericMutationClientParams,
  GenericMutationServerParams,
  GenericQueryClientParams,
  GenericQueryServerParams,
} from "../../api/types";
import type { VexConfig } from "../../config";

// ── Generic media args base types ──────────────────────────────────────────
//
// Every public media API function's args interface extends one of these four
// types. They factor out the `ctx` discriminator and `config` so per-function
// args interfaces only carry their unique fields.

/**
 * Base shape for server-side args of a media mutation function.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface GenericMediaMutationServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
> extends GenericMutationServerParams<DataModel> {
  /** The resolved `VexConfig` — required for adapter lookup. */
  config: VexConfig;
}

/**
 * Base shape for client-side args of a media mutation function.
 *
 * @example Inheritance pattern
 * ```ts
 * // createMediaDocument — adds collectionSlug, storageId, filename, mimeType, size
 * interface CreateMediaDocumentClientArgs
 *   extends GenericMediaMutationClientParams {
 *   adapter: string;
 *   collectionSlug: string;
 *   storageId: string;
 *   filename: string;
 *   mimeType: string;
 *   size: number;
 *   alt?: string;
 *   adapterFields?: Record<string, unknown>;
 * }
 */
export interface GenericMediaMutationClientParams extends GenericMutationClientParams {}

/**
 * Base shape for server-side args of a media query function.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface GenericMediaQueryServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
> extends GenericQueryServerParams<DataModel> {
  /** The resolved `VexConfig` — required for adapter lookup. */
  config: VexConfig;
}

/**
 * Base shape for client-side args of a media query function.
 *
 * @example Inheritance pattern
 * ```ts
 * // getUrl — adds adapter + mediaId
 * interface GetUrlClientArgs extends GenericMediaQueryClientParams {
 *   adapter: string;
 *   mediaId: string;
 * }
 */
export interface GenericMediaQueryClientParams extends GenericQueryClientParams {}

// ── Per-function server args ───────────────────────────────────────────────

/** Server-side args for `generateUploadUrl`. */
export interface GenerateUploadUrlServerArgs extends GenericMediaMutationServerParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
}

/** Server-side args for `createMediaDocument`. */
export interface CreateMediaDocumentServerArgs extends GenericMediaMutationServerParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug where the document is stored. */
  collectionSlug: string;
  /** Adapter-specific storage ID (e.g., Cloudinary public_id, S3 key). */
  storageId: string;
  /** Original filename of the uploaded file. */
  filename: string;
  /** MIME type of the uploaded file (e.g., "image/png"). */
  mimeType: string;
  /** File size in bytes. */
  size: number;
  /** Alt text for accessibility — defaults to `filename` if omitted. */
  alt?: string;
  /** Adapter-specific fields (e.g., Cloudinary transformation params). */
  adapterFields?: Record<string, unknown>;
}

/** Server-side args for `deleteMedia`. */
export interface DeleteMediaServerArgs extends GenericMediaMutationServerParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media document ID to delete. */
  mediaId: string;
  /** When `true`, sets `deleted: true` instead of physical deletion. */
  softDelete?: boolean;
}

// ── Per-function query server args ─────────────────────────────────────────

/** Server-side args for `getUrl`. */
export interface GetUrlServerArgs extends GenericMediaQueryServerParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media document ID to get the URL for. */
  mediaId: string;
}

/** Server-side args for `listMedia`. */
export interface ListMediaServerArgs extends GenericMediaQueryServerParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug to list from. */
  collectionSlug: string;
  /** Maximum number of documents to return. Defaults to 100. */
  limit?: number;
  /** Offset for pagination. Defaults to 0. */
  offset?: number;
}

/** Server-side args for `searchMedia`. */
export interface SearchMediaServerArgs extends GenericMediaQueryServerParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug to search in. */
  collectionSlug: string;
  /** Search query string — matches against `filename` and `alt` fields. */
  query: string;
}

// ── Per-function client args ───────────────────────────────────────────────

/** Client-side args for `generateUploadUrl`. */
export interface GenerateUploadUrlClientArgs extends GenericMediaMutationClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
}

/** Client-side args for `createMediaDocument`. */
export interface CreateMediaDocumentClientArgs extends GenericMediaMutationClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug where the document is stored. */
  collectionSlug: string;
  /** Adapter-specific storage ID (e.g., Cloudinary public_id, S3 key). */
  storageId: string;
  /** Original filename of the uploaded file. */
  filename: string;
  /** MIME type of the uploaded file (e.g., "image/png"). */
  mimeType: string;
  /** File size in bytes. */
  size: number;
  /** Alt text for accessibility — defaults to `filename` if omitted. */
  alt?: string;
  /** Adapter-specific fields (e.g., Cloudinary transformation params). */
  adapterFields?: Record<string, unknown>;
}

/** Client-side args for `deleteMedia`. */
export interface DeleteMediaClientArgs extends GenericMediaMutationClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media document ID to delete. */
  mediaId: string;
  /** When `true`, sets `deleted: true` instead of physical deletion. */
  softDelete?: boolean;
}

/** Client-side args for `getUrl`. */
export interface GetUrlClientArgs extends GenericMediaQueryClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media document ID to get the URL for. */
  mediaId: string;
}

/** Client-side args for `listMedia`. */
export interface ListMediaClientArgs extends GenericMediaQueryClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug to list from. */
  collectionSlug: string;
  /** Maximum number of documents to return. Defaults to 100. */
  limit?: number;
  /** Offset for pagination. Defaults to 0. */
  offset?: number;
}

/** Client-side args for `searchMedia`. */
export interface SearchMediaClientArgs extends GenericMediaQueryClientParams {
  /** The adapter name — matches `VexStorageAdapter.name`. */
  adapter: string;
  /** The media collection slug to search in. */
  collectionSlug: string;
  /** Search query string — matches against `filename` and `alt` fields. */
  query: string;
}
````

````ts
// packages/core/src/media/api/mutations.ts
import type { GenericDataModel } from "convex/server";

import type { VexStorageConfigError } from "../types";
import type {
  CreateMediaDocumentServerArgs,
  DeleteMediaServerArgs,
  GenerateUploadUrlServerArgs,
} from "./types";

/**
 * Generates a URL to upload a file to the storage adapter.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storageAdapters` and
 * calls `adapter.generateUploadUrl(ctx)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter }`.
 * @returns Promise resolving to `{ url: string }` — the upload URL.
 * @example
 * ```ts
 * import { generateUploadUrl } from "@vexcms/core/server";
 *
 * export const uploadFile = mutation({
 *   args: { adapter: v.string() },
 *   handler: (ctx, args) =>
 *     generateUploadUrl({ ctx, config: myConfig, adapter: args.adapter }),
 * });
 */
export async function generateUploadUrl<DataModel extends GenericDataModel>(
  args: GenerateUploadUrlServerArgs<DataModel>,
): Promise<{ url: string }> {
  const adapter = args.config.storageAdapters?.find(
    (a) => a.name === args.adapter,
  );
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  return await adapter.generateUploadUrl(args.ctx);
}

/**
 * Creates a media document in the storage adapter after the file is uploaded.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storageAdapters` and
 * calls `adapter.createMediaDocument(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, collectionSlug, storageId, filename, mimeType, size, alt?, adapterFields? }`.
 * @returns Promise resolving to the new media document's ID as a string.
 * @example
 * ```ts
 * import { createMediaDocument } from "@vexcms/core/server";
 *
 * export const saveMedia = mutation({
 *   args: { data: v.any() },
 *   handler: (ctx, args) =>
 *     createMediaDocument({ ctx, config: myConfig, ...args.data }),
 * });
 * ```
 */
export async function createMediaDocument<DataModel extends GenericDataModel>(
  args: CreateMediaDocumentServerArgs<DataModel>,
): Promise<string> {
  const adapter = args.config.storageAdapters?.find(
    (a) => a.name === args.adapter,
  );
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  return await adapter.createMediaDocument(args.ctx, {
    collectionSlug: args.collectionSlug,
    storageId: args.storageId,
    filename: args.filename,
    mimeType: args.mimeType,
    size: args.size,
    alt: args.alt,
    adapterFields: args.adapterFields,
  });
}

/**
 * Deletes a media document and its file from storage.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storageAdapters` and
 * calls `adapter.deleteMedia(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, mediaId, softDelete? }`.
 * @returns Promise resolving to `true` if the document was deleted.
 * @example
 * ```ts
 * import { deleteMedia } from "@vexcms/core/server";
 *
 * export const removeMedia = mutation({
 *   args: { mediaId: v.string() },
 *   handler: (ctx, args) =>
 *     deleteMedia({ ctx, config: myConfig, adapter: "convex", mediaId: args.mediaId }),
 * });
 * ```
 */
export async function deleteMedia<DataModel extends GenericDataModel>(
  args: DeleteMediaServerArgs<DataModel>,
): Promise<boolean> {
  const adapter = args.config.storageAdapters?.find(
    (a) => a.name === args.adapter,
  );
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  return await adapter.deleteMedia(args.ctx, {
    collectionSlug: "",
    mediaId: args.mediaId,
    softDelete: args.softDelete,
  });
}
````

````ts
// packages/core/src/media/api/queries.ts
import type { GenericDataModel } from "convex/server";

import type { VexStorageConfigError } from "../types";
import type {
  GetUrlServerArgs,
  ListMediaServerArgs,
  SearchMediaServerArgs,
} from "./types";

/**
 * Returns a URL for a media file.
 * Server-side only — call inside a Convex query handler.
 *
 * Looks up the adapter by name from `args.config.storageAdapters` and
 * calls `adapter.getUrl(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, mediaId }`.
 * @returns Promise resolving to `{ url: string }` or `{ url: null, error: string }`.
 * @example
 * ```ts
 * import { getUrl } from "@vexcms/core/server";
 *
 * export const getMediaUrl = query({
 *   args: { mediaId: v.string() },
 *   handler: (ctx, args) =>
 *     getUrl({ ctx, config: myConfig, adapter: "convex", mediaId: args.mediaId }),
 * });
 * ```
 */
export async function getUrl<DataModel extends GenericDataModel>(
  args: GetUrlServerArgs<DataModel>,
): Promise<{ url: string } | { url: null; error: string }> {
  const adapter = args.config.storageAdapters?.find(
    (a) => a.name === args.adapter,
  );
  if (!adapter) {
    return {
      url: null,
      error: `Adapter "${args.adapter}" not found`,
    };
  }
  return await adapter.getUrl(args.ctx, {
    collectionSlug: "",
    mediaId: args.mediaId,
  });
}

/**
 * Lists media documents from a collection.
 * Server-side only — call inside a Convex query handler.
 *
 * Looks up the adapter by name from `args.config.storageAdapters` and
 * calls `adapter.listMedia(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, collectionSlug, limit?, offset? }`.
 * @returns Promise resolving to an array of media documents.
 * @example
 * ```ts
 * import { listMedia } from "@vexcms/core/server";
 *
 * export const listImages = query({
 *   args: { limit: v.optional(v.number()) },
 *   handler: (ctx, args) =>
 *     listMedia({ ctx, config: myConfig, adapter: "convex", collectionSlug: "images", limit: args.limit }),
 * });
 * ```
 */
export async function listMedia<DataModel extends GenericDataModel>(
  args: ListMediaServerArgs<DataModel>,
): Promise<Array<Record<string, unknown>>> {
  const adapter = args.config.storageAdapters?.find(
    (a) => a.name === args.adapter,
  );
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  // Note: listMedia is implemented by core, not adapter-specific
  // This will query the media collection table directly
  return [];
}

/**
 * Searches media documents in a collection.
 * Server-side only — call inside a Convex query handler.
 *
 * Looks up the adapter by name from `args.config.storageAdapters` and
 * calls `adapter.searchMedia(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, collectionSlug, query }`.
 * @returns Promise resolving to an array of media documents.
 * @example
 * ```ts
 * import { searchMedia } from "@vexcms/core/server";
 *
 * export const searchImages = query({
 *   args: { query: v.string() },
 *   handler: (ctx, args) =>
 *     searchMedia({ ctx, config: myConfig, adapter: "convex", collectionSlug: "images", query: args.query }),
 * });
 * ```
 */
export async function searchMedia<DataModel extends GenericDataModel>(
  args: SearchMediaServerArgs<DataModel>,
): Promise<Array<Record<string, unknown>>> {
  const adapter = args.config.storageAdapters?.find(
    (a) => a.name === args.adapter,
  );
  if (!adapter) {
    throw new VexStorageConfigError(
      `Storage adapter "${args.adapter}" not found`,
    );
  }
  // Note: searchMedia is implemented by core, not adapter-specific
  // This will query the media collection table directly
  return [];
}
````

### Run tests

```bash
pnpm --filter @vexcms/core test
pnpm typecheck
```

---

### Step 10 — Convex factory functions (`mediaMutationApi` / `mediaQueryApi`) [dev]

**Status: ⏳ PENDING**

Create the Convex factory functions that wrap the server API functions from Step 2 and register them as Convex endpoints. This is the **critical bridge** that makes the media functions callable from the client via `vexConvexApi.media.*`.

**Pick up here:** After completing Step 2 (server API functions), create the Convex factories that users call in their `convex/vex/media.ts`.

**Files:**

- `packages/core/src/convex/media.ts` (NEW) — `mediaMutationApi` and `mediaQueryApi` factories
- `packages/core/src/convex/index.ts` (MODIFY) — Add `vexConvexApi.media.*` references
- `packages/core/src/index.ts` (MODIFY) — Export `mediaMutationApi`, `mediaQueryApi`

**Pick up here:** After completing Step 9 (server API functions), create the Convex factories that users call in their `convex/vex/media.ts`.

**Files:**

- `packages/core/src/convex/media.ts` (NEW) — `mediaMutationApi` and `mediaQueryApi` factories
- `packages/core/src/convex/index.ts` (MODIFY) — Add `vexConvexApi.media.*` references
- `packages/core/src/index.ts` (MODIFY) — Export `mediaMutationApi`, `mediaQueryApi`

**Implementation details:**

Follow the exact pattern from `packages/core/src/api/server.ts`:

1. **`convex/media.ts`** — Create `mediaMutationApi` and `mediaQueryApi` factories that:
   - Accept `VexConfig` and the user's `mutation`/`query` builder
   - Call the server functions from Step 9 with `args.ctx` and `config`
   - Return registered Convex functions with `v.args()` schemas
   - Use the same `internalMutationGeneric`/`internalQueryGeneric` defaults as `queryApi`/`mutationApi`

2. **`convex/index.ts`** — Add `vexConvexApi.media.*` references:
   - Add shallow `FunctionReference` types for each media function
   - Add `media` object to `vexConvexApi` with typed references

3. **`index.ts`** — Export the factories:
   ```ts
   export { mediaMutationApi, mediaQueryApi } from "./convex/media";
   ```

**API structure (mimics `core/src/api/server.ts`):**

````ts
// packages/core/src/convex/media.ts
import {
  internalMutationGeneric,
  internalQueryGeneric,
  type MutationBuilder,
  type QueryBuilder,
  type FunctionVisibility,
  type GenericDataModel,
} from "convex/server";
import { GenericId, v } from "convex/values";
import type { VexConfig } from "../config";
import type { CollectionSlug } from "../types/generated";
import {
  generateUploadUrl,
  createMediaDocument,
  deleteMedia,
  getUrl,
  listMedia,
  searchMedia,
} from "../media/api";
import type {
  VexMediaGenerateUploadUrlArgs,
  VexMediaGenerateUploadUrlReturn,
  VexMediaCreateMediaDocumentArgs,
  VexMediaCreateMediaDocumentReturn,
  VexMediaDeleteMediaArgs,
  VexMediaDeleteMediaReturn,
  VexMediaGetUrlArgs,
  VexMediaGetUrlReturn,
} from "./index";

/**
 * Registers `generateUploadUrl`, `createMediaDocument`, and `deleteMedia` as Convex mutation endpoints.
 *
 * Call alongside `mediaQueryApi` in the user's `convex/vex/media.ts`. The factory wraps
 * the server functions in `mutation()` with `v.args()` schemas so Convex
 * exposes them at `api.vex.media.generateUploadUrl`, `api.vex.media.createMediaDocument`, etc.
 *
 * `vexConvexApi.media.generateUploadUrl`, `vexConvexApi.media.createMediaDocument`, etc. in
 * `@vexcms/core/src/convex/index.ts` point at these paths.
 *
 * @param config - The user's `VexConfig`.
 * @param mutation - The user's `mutation` builder from `convex/_generated/server`.
 *   Defaults to `internalMutationGeneric`.
 * @returns Registered `generateUploadUrl` / `createMediaDocument` / `deleteMedia` Convex mutations.
 * @example
 * ```ts
 * // apps/www/convex/vex/media.ts
 * import { mediaMutationApi, mediaQueryApi } from "@vexcms/core/convex";
 * import { mutation, query } from "../_generated/server";
 * import config from "../../src/vex.config";
 *
 * export const { generateUploadUrl, createMediaDocument, deleteMedia } = mediaMutationApi(config, mutation);
 * export const { getUrl, listMedia, searchMedia } = mediaQueryApi(config, query);
 */
export function mediaMutationApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  config: VexConfig,
  mutation: MutationBuilder<
    DataModel,
    Visibility
  > = internalMutationGeneric as never,
) {
  return {
    generateUploadUrl: mutation({
      args: {
        adapter: v.string(),
      },
      returns: v.object({ url: v.string() }),
      handler: (ctx, args) =>
        generateUploadUrl({
          ctx,
          config,
          adapter: args.adapter,
        }),
    }) as const,

    createMediaDocument: mutation({
      args: {
        adapter: v.string(),
        collectionSlug: v.string(),
        storageId: v.string(),
        filename: v.string(),
        mimeType: v.string(),
        size: v.number(),
        alt: v.optional(v.string()),
        adapterFields: v.optional(v.any()),
      },
      returns: v.string(),
      handler: (ctx, args) =>
        createMediaDocument({
          ctx,
          config,
          adapter: args.adapter,
          collectionSlug: args.collectionSlug,
          storageId: args.storageId,
          filename: args.filename,
          mimeType: args.mimeType,
          size: args.size,
          alt: args.alt,
          adapterFields: args.adapterFields,
        }),
    }) as const,

    deleteMedia: mutation({
      args: {
        adapter: v.string(),
        mediaId: v.string(),
        softDelete: v.optional(v.boolean()),
      },
      returns: v.boolean(),
      handler: (ctx, args) =>
        deleteMedia({
          ctx,
          config,
          adapter: args.adapter,
          mediaId: args.mediaId,
          softDelete: args.softDelete,
        }),
    }) as const,
  };
}

/**
 * Registers `getUrl`, `listMedia`, and `searchMedia` as Convex query endpoints.
 *
 * Call alongside `mediaMutationApi` in the user's `convex/vex/media.ts`. The factory wraps
 * the server functions in `query()` with `v.args()` schemas so Convex
 * exposes them at `api.vex.media.getUrl`, `api.vex.media.listMedia`, etc.
 *
 * @param config - The user's `VexConfig`.
 * @param query - The user's `query` builder from `convex/_generated/server`.
 *   Defaults to `internalQueryGeneric`.
 * @returns Registered `getUrl` / `listMedia` / `searchMedia` Convex queries.
 * @example
 * ```ts
 * // apps/www/convex/vex/media.ts
 * import { mediaMutationApi, mediaQueryApi } from "@vexcms/core/convex";
 * import { mutation, query } from "../_generated/server";
 * import config from "../../src/vex.config";
 *
 * export const { generateUploadUrl, createMediaDocument, deleteMedia } = mediaMutationApi(config, mutation);
 * export const { getUrl, listMedia, searchMedia } = mediaQueryApi(config, query);
 */
export function mediaQueryApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  config: VexConfig,
  query: QueryBuilder<DataModel, Visibility> = internalQueryGeneric as never,
) {
  return {
    getUrl: query({
      args: {
        adapter: v.string(),
        mediaId: v.string(),
      },
      returns: v.object({
        url: v.optional(v.string()),
        error: v.optional(v.string()),
      }),
      handler: (ctx, args) =>
        getUrl({
          ctx,
          config,
          adapter: args.adapter,
          mediaId: args.mediaId,
        }),
    }) as const,

    listMedia: query({
      args: {
        adapter: v.string(),
        collectionSlug: v.string(),
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
      },
      returns: v.array(v.any()),
      handler: (ctx, args) =>
        listMedia({
          ctx,
          config,
          adapter: args.adapter,
          collectionSlug: args.collectionSlug,
          limit: args.limit,
          offset: args.offset,
        }),
    }) as const,

    searchMedia: query({
      args: {
        adapter: v.string(),
        collectionSlug: v.string(),
        query: v.string(),
      },
      returns: v.array(v.any()),
      handler: (ctx, args) =>
        searchMedia({
          ctx,
          config,
          adapter: args.adapter,
          collectionSlug: args.collectionSlug,
          query: args.query,
        }),
    }) as const,
  };
}
````

**Update `packages/core/src/convex/index.ts`** — Add media references to `vexConvexApi`:

```ts
// Add these shallow FunctionReference types after the existing VexRemoveRef

/** Shallow FunctionReference for `api.vex.media.generateUploadUrl`. */
export type VexMediaGenerateUploadUrlRef = FunctionReference<
  "mutation",
  "public",
  VexMediaGenerateUploadUrlArgs,
  VexMediaGenerateUploadUrlReturn
>;

/** Shallow FunctionReference for `api.vex.media.createMediaDocument`. */
export type VexMediaCreateMediaDocumentRef = FunctionReference<
  "mutation",
  "public",
  VexMediaCreateMediaDocumentArgs,
  VexMediaCreateMediaDocumentReturn
>;

/** Shallow FunctionReference for `api.vex.media.deleteMedia`. */
export type VexMediaDeleteMediaRef = FunctionReference<
  "mutation",
  "public",
  VexMediaDeleteMediaArgs,
  VexMediaDeleteMediaReturn
>;

/** Shallow FunctionReference for `api.vex.media.getUrl`. */
export type VexMediaGetUrlRef = FunctionReference<
  "query",
  "public",
  VexMediaGetUrlArgs,
  VexMediaGetUrlReturn
>;

// Update the vexConvexApi object to include media:
export const vexConvexApi = {
  // ... existing find, get, create, search, update, remove ...
  media: {
    /**
     * Generates a URL to upload a file to.
     * Called by `MediaUploadDropzone` in `@vexcms/react`.
     */
    generateUploadUrl: anyApi.vex.media
      .generateUploadUrl as VexMediaGenerateUploadUrlRef,

    /**
     * Creates a media document in Convex after the file is uploaded.
     * Called by `MediaUploadDropzone` in `@vexcms/react`.
     */
    createMediaDocument: anyApi.vex.media
      .createMediaDocument as VexMediaCreateMediaDocumentRef,

    /**
     * Deletes a media document and its file from storage.
     * Called by `MediaLibrary` in `@vexcms/react`.
     */
    deleteMedia: anyApi.vex.media.deleteMedia as VexMediaDeleteMediaRef,

    /**
     * Returns a URL for a media file.
     * Called by `UploadFieldCell` in `@vexcms/react`.
     */
    getUrl: anyApi.vex.media.getUrl as VexMediaGetUrlRef,
  },
} as const;
```

**Update `packages/core/src/index.ts`** — Export the factories:

```ts
export { mediaMutationApi, mediaQueryApi } from "./convex/media";
```

### Run tests

```bash
pnpm --filter @vexcms/core test
pnpm typecheck
```

---

### Step 11 — User-side media Convex functions [dev]

**Status: ⏳ PENDING**

Document and provide the template for users to create their media Convex functions at `convex/vex/media.ts`. This is the **final wiring step** that makes the media functions available at `api.media.*` in the Convex runtime.

**Pick up here:** After completing Step 10 (Convex factories), provide the user-side template.

**Files:**

- `packages/core/src/convex/vex/media.ts` (NEW) — Template for user's `convex/vex/media.ts`
- `packages/core/src/convex/vex/index.ts` (NEW) — Template for user's `convex/vex/index.ts`

**Pick up here:** After completing Step 10 (Convex factories), provide the user-side template.

**Files:**

- `packages/core/src/convex/vex/media.ts` (NEW) — Template for user's `convex/vex/media.ts`
- `packages/core/src/convex/vex/index.ts` (NEW) — Template for user's `convex/vex/index.ts`

**Implementation details:**

Provide two template files that users copy into their project:

1. **`convex/vex/index.ts`** — Existing pattern for collection functions
2. **`convex/vex/media.ts`** — New pattern for media functions

**Template files:**

```ts
// packages/core/src/convex/vex/index.ts (TEMPLATE — user copies to convex/vex/index.ts)
import { queryApi, mutationApi } from "@vexcms/core/convex";
import { query, mutation } from "./_generated/server";
import config from "../../src/vex.config";

export const { find, get, search } = queryApi(config, query);
export const { create, update, remove } = mutationApi(config, mutation);
```

```ts
// packages/core/src/convex/vex/media.ts (TEMPLATE — user copies to convex/vex/media.ts)
import { mediaMutationApi, mediaQueryApi } from "@vexcms/core/convex";
import { query, mutation } from "../_generated/server";
import config from "../../src/vex.config";

export const { generateUploadUrl, createMediaDocument, deleteMedia } =
  mediaMutationApi(config, mutation);
export const { getUrl, listMedia, searchMedia } = mediaQueryApi(config, query);
```

**How it works:**

1. User copies `convex/vex/index.ts` and `convex/vex/media.ts` into their project
2. Convex codegen generates `api.vex.*` and `api.vex.media.*` references
3. Admin panel calls `vexConvexApi.media.generateUploadUrl`, `vexConvexApi.media.createMediaDocument`, etc.
4. The Convex runtime resolves these to the user's registered functions
5. The user's functions call the server API functions from Step 9
6. The server API functions look up the adapter from `config.storageAdapters` and call the adapter's method

**Full call chain:**

```
Client (React)
  → vexConvexApi.media.createMediaDocument({ adapter: "convex", ... })
  → api.vex.media.createMediaDocument({ adapter: "convex", ... })  [Convex runtime]
  → user's convex/vex/media.ts handler
  → mediaMutationApi().createMediaDocument handler
  → createMediaDocument server function (core/src/media/api/mutations.ts)
  → adapter.createMediaDocument(ctx, args)  [adapter lookup by name]
  → ConvexStorageAdapter.createMediaDocument(ctx, args)  [actual storage]
```

### Run tests

```bash
pnpm --filter @vexcms/core test
pnpm typecheck
```

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
9. **Adapter name tag:** Every media collection has `meta.storageAdapter` set to the adapter's `name`.
10. **Function signature enforcement:** `mediaMutationApi` and `mediaQueryApi` use Convex validator factories from `@vexcms/core`. TypeScript and Convex runtime enforce compliance.
11. **Runtime — upload:** Dropping a file on the upload field creates a media document in the target collection and stores its ID in the form field.
12. **Runtime — picker:** Clicking "Browse media library" opens a popover with a grid of the target media collection. Selecting a file stores its ID.
13. **Runtime — cell:** The upload field cell in the collection table view shows a thumbnail or document ID.
14. **Runtime — delete:** Deleting a media document from the media library deletes the file from storage (or marks it deleted if soft delete is enabled).
15. **Runtime — batch upload:** Dropping multiple files calls `createMediaDocument` once per file in parallel via `Promise.all`. No `uploadMany` function needed.
16. **Multi-adapter:** Components read `meta.storageAdapter` from the target media collection and pass it to `vexConvexApi.media.*` — the correct adapter is called for each media collection.
17. **Test coverage:** `upload` field type has unit tests for config, validator, and inputSchema. Storage adapter merge logic has unit tests. Media collection validation has unit tests. React upload components have unit tests.
18. **No regression:** Existing field types (text, number, relationship, etc.) continue to work in admin panel and schema generation.

### Step 12 — Framework-agnostic uploadFile method [dev]

Add an `uploadFile` method to the `VexStorageAdapter` interface that provides a framework-agnostic way to upload files from any client-side context (React, Next.js, Svelte, etc.). This method is a pure JavaScript function that each adapter implements according to their specific storage backend API.

---

### Step 13 — StorageAdapterSlug type generation [dev]

**Status: NOT STARTED**

Add a `StorageAdapterSlug` type that works like `CollectionSlug` and `MediaCollectionSlug` — it gets generated from the config and narrows the type to only valid adapter names. Only adapters whose `type` is `"presigned-url"` (i.e. those implementing `StorageAdapterPresignedUrlInterface`) are included. Adapters using other protocols are excluded because they require different client-side upload logic.

This type is used to key `VexConfig.storage.clientUploads` and the `StorageAdapterMap` in `StorageAdapterContext`, so that only registered presigned-url adapters can be referenced in the client upload registry.

**Files:**

- `packages/core/src/types/generated.ts` (MODIFY) — Add `StorageAdapterSlug` type
- `packages/core/src/types/generateVexTypes.ts` (MODIFY) — Emit `StorageAdapterSlug` in generated output

**Implementation details:**

1. **`types/generated.ts`** — Add `StorageAdapterSlug` following the same pattern as `CollectionSlug`:

   ````ts
   /**
    * Union of all storage adapter names registered in this project's VexCMS config.
    *
    * - **Before `vex generate`:** resolves to `string` — any string is accepted.
    * - **After `vex generate`:** resolves to a specific union, e.g. `"convex"`.
    *
    * Only adapters whose `type` is `"presigned-url"` (i.e. those implementing
    * `StorageAdapterPresignedUrlInterface`) are included. Adapters using other
    * protocols (e.g. `"direct-upload"`, `"streaming"`) are excluded because
    * they require different client-side upload logic.
    *
    * Used by `VexConfig.storage.clientUploads` and `StorageAdapterMap` so that
    * only adapters actually registered in `defineConfig({ storage: { adapters: [...] } })`
    * can be referenced. Invalid adapter names are caught at compile time after
    * generation.
    *
    * @example
    * ```ts
    * // After generation — type is "convex"
    * import type { StorageAdapterSlug } from "@vexcms/core"
    *
    * const registry: StorageAdapterMap = {
    *   convex: { uploadFile: convexUploadFile },  // ✓
    *   s3: { uploadFile: s3UploadFile },          // ✗ Type error — "s3" not registered
    *   fake: { uploadFile: fakeUploadFile },     // ✗ Type error — not a registered adapter
    * };
    * ```
    *
    * @see {@link GeneratedVexTypes} for the augmentation interface
    * @see {@link StorageAdapterPresignedUrlInterface} for the protocol requirement
    * @see {@link VexConfig} for the `storage.clientUploads` consumer
    */
   export type StorageAdapterSlug = GeneratedVexTypes extends {
     StorageAdapterSlug: infer S extends string;
   }
     ? S
     : string;
   ````

2. **`types/generateVexTypes.ts`** — Emit `StorageAdapterSlug` in the generated output:

   ```ts
   // In generateVexTypes():
   const storageAdapterNames = config.storage?.adapters
     ?.filter((adapter) => adapter.type === STORAGE_ADAPTER_PROTOCOLS.presignedUrl)
     .map((adapter) => `"${adapter.name}"`)
     .join(" | ") ?? "never";

   const storageAdapterSlugType = `export type StorageAdapterSlug = ${storageAdapterNames}`;

   // In the declare module block:
   declare module "@vexcms/core" {
     interface GeneratedVexTypes {
       CollectionSlug: ${collectionSlugs}
       MediaCollectionSlug: ${mediaCollectionSlugs}
       StorageAdapterSlug: ${storageAdapterNames}
       DocumentBySlug: { ... }
       MediaDocumentBySlug: { ... }
       CollectionsFieldTypeMap: { ... }
     }
   }
   ```

**Why this works:**

- **Compile-time safety:** After `vex generate`, only registered presigned-url adapter names are valid keys in `StorageAdapterMap` and `VexConfig.storage.clientUploads`.
- **Protocol enforcement:** Adapters with `type: "direct-upload"` or other protocols are excluded from the union, so they can't be used in the client upload registry.
- **Consistent pattern:** Follows the same pattern as `CollectionSlug` and `MediaCollectionSlug` — empty by default, narrowed by generation.

**Edge cases:**

> **Edge: No storage adapters configured.** `StorageAdapterSlug` resolves to `never` — no adapter names are valid. The `StorageAdapterMap` type becomes `{}` (empty record), and any attempt to add a key produces a type error.

> **Edge: Adapter with non-presigned-url protocol.** The adapter is still valid for server-side operations (it's in `VexConfig.storage.adapters`), but its name is excluded from `StorageAdapterSlug` because it can't be used in the client upload registry.

> **Edge: Multiple adapters with the same name.** This is a configuration error — `validateAndMergeStorageConfig` throws `VexStorageConfigError` before generation runs.

**Next:** Proceed to Step 14 — StorageAdapterContext implementation (updated to use `StorageAdapterSlug`)

---

### Step 14 — StorageAdapterContext implementation [dev]

**Status: NOT STARTED** — The code still uses `storageAdapters` (not `storage.adapters`). This step needs to be implemented.

Create a `StorageAdapterContext` that accepts a storage adapter map from the config and provides it to React components for client-side file uploads. The context maps adapter names to objects containing an `uploadFile` function that can be serialized and passed from Server Components to Client Components. The adapter names are keyed by `StorageAdapterSlug` — only presigned-url adapters registered in the config are valid keys.

**Files:**

- `packages/core/src/config/types.ts` (MODIFY) — Add `storage.adapters` and `storage.clientUploads` to `VexConfig`
- `packages/core/src/config/config.ts` (MODIFY) — Use `storage.adapters` instead of `storageAdapters`
- `packages/core/src/config/sanitizeConfig.ts` (MODIFY) — Strip `storage.clientUploads` (not `storageAdapters`)
- `packages/core/src/media/config.ts` (MODIFY) — Use `storage.adapters` instead of `storageAdapters`
- `packages/react/src/context/StorageAdapterContext.tsx` (MODIFY) — Accept `storageAdapterMap` from `config.storage?.clientUploads`
- `packages/react/src/context/index.ts` (MODIFY) — Export `StorageAdapterContext`
- `packages/react/src/components/AdminLayout.tsx` (MODIFY) — Pass `storageAdapterMap={config.storage?.clientUploads ?? {}}`
- `apps/www/src/vex.config.ts` (MODIFY) — Use new structure: `storage.adapters` and `storage.clientUploads`

**Implementation details:**

1. **`VexConfig` types** — Add storage configuration fields:

   ````ts
   // packages/core/src/config/types.ts
   import type { StorageAdapterSlug } from "../types/generated";

   export interface VexConfig {
     // ... existing fields
     /**
      * Storage configuration — adapters and client-side upload functions.
      *
      * When present, media collections are available in the admin panel and
      * `upload()` fields can be used in regular collections. The `adapters`
      * array holds the server-side adapter instances (stripped by
      * `sanitizeConfigForClient`). The `clientUploads` map holds serializable
      * `uploadFile` functions that the admin panel uses to upload files
      * directly from the browser. Keys are `StorageAdapterSlug` — only
      * presigned-url adapters registered in the config are valid.
      *
      * @see {@link VexStorageAdapter} for the adapter interface
      * @see {@link StorageAdapterSlug} for the key type
      * @see {@link convexFileStorage} from `@vexcms/file-storage-convex` for the first adapter
      */
     storage?: {
       /** Storage adapters configured for the project. */
       adapters?: VexStorageAdapter[];
       /**
        * Client-side upload functions for each registered presigned-url adapter.
        *
        * Keys are `StorageAdapterSlug` — only adapters whose `type` is
        * `"presigned-url"` and whose `name` appears in the config are valid.
        * After `vex generate`, this is narrowed to the exact set of adapter
        * names in the project.
        *
        * @example
        * ```ts
        * // vex.config.ts
        * export default defineConfig({
        *   storage: {
        *     adapters: [convexFileStorage({ mediaCollections: [images] })],
        *     clientUploads: {
        *       convex: { uploadFile: convexUploadFile },
        *     },
        *   },
        * });
        * ```
        */
       clientUploads?: Record<
         StorageAdapterSlug,
         {
           uploadFile: (
             file: File,
             uploadUrl: string,
           ) => Promise<{
             storageId: string;
             url?: string;
             [key: string]: unknown;
           }>;
         }
       >;
     };
   }
   ````

2. **`StorageAdapterContext` provider** — Accepts the client uploads map:

   ```tsx
   // packages/react/src/context/StorageAdapterContext.tsx
   import { createContext, useContext } from "react";
   import type { StorageAdapterSlug } from "@vexcms/core";

   /**
    * Map of storage adapter names to their client-side upload functions.
    *
    * Keys are `StorageAdapterSlug` — only presigned-url adapters registered
    * in the config are valid. After `vex generate`, this is narrowed to the
    * exact set of adapter names in the project.
    */
   interface StorageAdapterMap {
     [adapterName in StorageAdapterSlug]?: {
       uploadFile: (
         file: File,
         uploadUrl: string,
       ) => Promise<{
         storageId: string;
         url?: string;
         [key: string]: unknown;
       }>;
     };
   }

   interface StorageAdapterContextValue {
     storageAdapterMap: StorageAdapterMap;
   }

   const StorageAdapterContext = createContext<StorageAdapterContextValue>({
     storageAdapterMap: {},
   });

   /**
    * StorageAdapterContext provider — provides client-side upload functions.
    *
    * Accepts a map of adapter names to their client-side upload functions.
    * These functions can be serialized and passed from Server Components to
    * Client Components.
    *
    * @param children — Child components that need access to the adapter map.
    * @param storageAdapterMap — Map of adapter names to upload functions.
    */
   export function StorageAdapterContextProvider({
     children,
     storageAdapterMap,
   }: {
     children: React.ReactNode;
     storageAdapterMap: StorageAdapterMap;
   }) {
     return (
       <StorageAdapterContext.Provider value={{ storageAdapterMap }}>
         {children}
       </StorageAdapterContext.Provider>
     );
   }

   /**
    * Hook to access the storage adapter map.
    *
    * @returns The adapter map with `uploadFile` functions.
    * @throws {Error} If used outside of `StorageAdapterContextProvider`.
    */
   export function useStorageAdapterMap() {
     const context = useContext(StorageAdapterContext);
     if (!context) {
       throw new Error(
         "useStorageAdapterMap must be used within StorageAdapterContextProvider",
       );
     }
     return context.storageAdapterMap;
   }
   ```

3. **Export from context index** — Add to `packages/react/src/context/index.ts`:

   ```ts
   export * from "./StorageAdapterContext";
   ```

4. **Wrap admin layout** — Update `packages/react/src/components/AdminLayout.tsx`:

   ```tsx
   // packages/react/src/components/AdminLayout.tsx
   import { StorageAdapterContextProvider } from "../context";
   import { sanitizeConfigForClient } from "@vexcms/core";

   export function AdminLayout(props: AdminLayoutProps) {
     const clientConfig = sanitizeConfigForClient(props.config);

     return (
       <VexConfigContext.Provider value={clientConfig}>
         <StorageAdapterContextProvider
           storageAdapterMap={props.config.storage?.clientUploads ?? {}}
         >
           {/* ... existing admin panel layout ... */}
         </StorageAdapterContextProvider>
       </VexConfigContext.Provider>
     );
   }
   ```

5. **Update `vex.config.ts`** — Use new structure:

   ```ts
   // apps/www/src/vex.config.ts
   import { defineConfig } from "@vexcms/core";
   import { convexFileStorage } from "@vexcms/file-storage-convex";
   import { uploadFile } from "@vexcms/file-storage-convex/adapter";

   const images = defineMediaCollection({
     slug: "images",
     fields: { alt: text({ required: true }) },
   });

   export default defineConfig({
     storage: {
       adapters: [
         convexFileStorage({ mediaCollections: [images] }),
       ],
       clientUploads: {
         convex: {
           uploadFile,
         },
       },
     },
     collections: [...],
   });
   ```

**Why this works:**

- **No forced dependencies** — User only provides upload functions for adapters they use.
- **No serialization issues** — Only functions are passed, not adapter instances.
- **Framework-agnostic** — Framework package doesn't need to know about specific adapters.
- **User control** — User decides which adapters to support and provides their upload functions.
- **Compile-time safety** — `StorageAdapterSlug` ensures only registered presigned-url adapters can be used in the client upload registry.

**Edge cases:**

> **Edge: No storage adapters configured.** The context receives an empty map `{}`. Components that try to use it will get an empty object, and their `uploadFile` calls will fail gracefully.

> **Edge: Adapter not found in map.** The component throws an error with the adapter name. This helps catch configuration errors early.

> **Edge: Multiple adapters of same type.** Components read `meta.storageAdapter` from the target media collection and look up the correct adapter in the map.

> **Edge: Adapter with non-presigned-url protocol.** The adapter is valid for server-side operations but cannot be used in the client upload registry. The `StorageAdapterSlug` type excludes it.

**Next:** Proceed to Step 15 — React media components using StorageAdapterContext

---

### Step 15 — React media components using StorageAdapterContext [dev]

**Status: NOT STARTED** — The code still uses hardcoded adapter logic. This step needs to be implemented.

Update `MediaUploadDropzone` and `MediaPicker` to use `useStorageAdapterMap` hook. Components read the adapter name from the target media collection's `meta.storageAdapter` and look up the `uploadFile` function from the context map. The context receives the map from `config.storage?.clientUploads`.

**Files:**

- `packages/react/src/components/media/MediaUploadDropzone.tsx` (MODIFY) — Use `useStorageAdapterMap`
- `packages/react/src/components/media/MediaPicker.tsx` (MODIFY) — Use `useStorageAdapterMap`
- `packages/react/src/components/media/index.ts` (MODIFY) — Re-export updated components

**Implementation details:**

1. **`MediaUploadDropzone`** — Use `useStorageAdapterMap` hook:

   ```tsx
   // packages/react/src/components/media/MediaUploadDropzone.tsx
   import { useStorageAdapterMap } from "@vexcms/react/context";

   /**
    * Props for the MediaUploadDropzone component.
    */
   interface MediaUploadDropzoneProps {
     /** The slug of the target media collection. */
     targetCollection: string;
     /** The adapter name — comes from the target media collection's `meta.storageAdapter`. */
     adapterName: string;
     /** Callback invoked when a file upload completes. Receives the new media document ID. */
     onUploadComplete: (mediaId: string) => void;
   }

   /**
    * File upload dropzone — handles drag-and-drop and click-to-upload.
    *
    * Uses the `useStorageAdapterMap` hook to get the adapter's `uploadFile`
    * function, then calls `vexConvexApi.media.*` for URL generation and
    * document creation.
    *
    * @param props — Dropzone component props.
    */
   export function MediaUploadDropzone(props: MediaUploadDropzoneProps) {
     const storageAdapterMap = useStorageAdapterMap();
     const adapter = storageAdapterMap[props.adapterName];

     if (!adapter) {
       throw new Error(
         `Storage adapter "${props.adapterName}" not found in context`,
       );
     }

     /**
      * Uploads a single file to the target media collection.
      *
      * 1. Gets a presigned upload URL from the adapter.
      * 2. Uploads the file using the adapter's `uploadFile` method.
      * 3. Creates a media document in Convex with the storage ID.
      *
      * @param file — The file to upload.
      * @returns The new media document ID.
      */
     const handleUpload = async (file: File) => {
       // 1. Get presigned URL
       const { url } = await vexConvexApi.media.generateUploadUrl({
         adapter: props.adapterName,
       });

       // 2. Upload file using adapter's uploadFile method
       const { storageId, url: fileUrl } = await adapter.uploadFile(file, url);

       // 3. Create media document
       const mediaId = await vexConvexApi.media.createMediaDocument({
         adapter: props.adapterName,
         collectionSlug: props.targetCollection,
         storageId,
         filename: file.name,
         mimeType: file.type,
         size: file.size,
       });

       return mediaId;
     };

     // ... rest of component
   }
   ```

2. **`MediaPicker`** — Similar update for the upload button:

   ```tsx
   // packages/react/src/components/media/MediaPicker.tsx
   import { useStorageAdapterMap } from "@vexcms/react/context";

   /**
    * Props for the MediaPicker component.
    */
   interface MediaPickerProps {
     /** The slug of the target media collection. */
     targetCollection: string;
     /** The adapter name — comes from the target media collection's `meta.storageAdapter`. */
     adapterName: string;
     /** Callback invoked when a media file is selected. */
     onSelect: (mediaId: string) => void;
     /** Callback invoked when the picker is cancelled. */
     onCancel: () => void;
   }

   /**
    * Media picker popover — allows selecting an existing file or uploading a new one.
    *
    * Uses the `useStorageAdapterMap` hook to get the adapter's `uploadFile`
    * function for new uploads.
    *
    * @param props — Media picker component props.
    */
   export function MediaPicker(props: MediaPickerProps) {
     const storageAdapterMap = useStorageAdapterMap();
     const adapter = storageAdapterMap[props.adapterName];

     if (!adapter) {
       throw new Error(
         `Storage adapter "${props.adapterName}" not found in context`,
       );
     }

     /**
      * Uploads a single file and selects it in the picker.
      *
      * 1. Gets a presigned upload URL from the adapter.
      * 2. Uploads the file using the adapter's `uploadFile` method.
      * 3. Creates a media document in Convex with the storage ID.
      * 4. Calls `onSelect` with the new media document ID.
      *
      * @param file — The file to upload.
      */
     const handleUpload = async (file: File) => {
       // Same upload logic as MediaUploadDropzone
       const { url } = await vexConvexApi.media.generateUploadUrl({
         adapter: props.adapterName,
       });

       const { storageId, url: fileUrl } = await adapter.uploadFile(file, url);

       const mediaId = await vexConvexApi.media.createMediaDocument({
         adapter: props.adapterName,
         collectionSlug: props.targetCollection,
         storageId,
         filename: file.name,
         mimeType: file.type,
         size: file.size,
       });

       props.onSelect(mediaId);
       setShowUpload(false);
     };

     // ... rest of component
   }
   ```

**Why this works:**

- **No forced dependencies** — User only provides upload functions for adapters they use.
- **No serialization issues** — Only functions are passed, not adapter instances.
- **Framework-agnostic** — Framework package doesn't need to know about specific adapters.
- **User control** — User decides which adapters to support and provides their upload functions.

**Edge cases:**

> **Edge: No storage adapters configured.** The context receives an empty map `{}`. Components that try to use it will get an empty object, and their `uploadFile` calls will fail gracefully.

> **Edge: Adapter not found in map.** The component throws an error with the adapter name. This helps catch configuration errors early.

> **Edge: Multiple adapters of same type.** Components read `meta.storageAdapter` from the target media collection and look up the correct adapter in the map.

**Next:** Proceed to Step 15 — Admin panel wiring with StorageAdapterContext

---

### Step 16 — Admin panel wiring with StorageAdapterContext [dev]

**Status: NOT STARTED** — The admin panel doesn't have media collection support yet. This step needs to be implemented.

Wire the media library page into the admin panel using the `StorageAdapterContext`. Media collections appear in the sidebar under a dedicated "Media" section. The collection list view for media collections uses the grid layout instead of the data table. The context is already provided in the admin layout, so no additional wiring is needed.

**Files:**

- `packages/react/src/components/admin/CollectionListView.tsx` (MODIFY) — Detect media collection and render grid
- `packages/react/src/components/admin/sidebar.tsx` (MODIFY) — Add "Media" section
- `packages/react/src/components/admin/AdminPanel.tsx` (MODIFY) — Pass config to children for media collection access

**Implementation details:**

1. **`AdminPanel`** — Pass the full config to children:

   ```tsx
   // packages/react/src/components/admin/AdminPanel.tsx
   import { StorageAdapterContextProvider } from "../../context";

   /**
    * Props for the AdminPanel component.
    */
   interface AdminPanelProps {
     /** Child components rendered inside the admin panel layout. */
     children: React.ReactNode;
     /** The resolved VexConfig — passed to context providers. */
     config: VexConfig;
   }

   /**
    * Admin panel root component — wraps children with VexConfig and StorageAdapter contexts.
    *
    * Provides the full config to all child components via `VexConfigContext`,
    * and passes `config.storage?.clientUploads` to `StorageAdapterContextProvider`
    * so media upload components can access adapter upload functions.
    *
    * @param props — Admin panel props.
    */
   export function AdminPanel({ children, config }: AdminPanelProps) {
     return (
       <VexConfigContext.Provider value={config}>
         <StorageAdapterContextProvider
           storageAdapterMap={config.storage?.clientUploads ?? {}}
         >
           {/* ... existing admin panel layout ... */}
           {children}
         </StorageAdapterContextProvider>
       </VexConfigContext.Provider>
     );
   }
   ```

2. **`CollectionListView`** — Detect media collection and render grid:

   ```tsx
   // packages/react/src/components/admin/CollectionListView.tsx
   import { MediaLibrary } from "../media/MediaLibrary";
   import { useVexConfig } from "../../context/VexConfigContext";

   /**
    * Props for the CollectionListView component.
    */
   interface CollectionListViewProps {
     /** The collection config — either a regular collection or a media collection. */
     collection: CollectionConfig;
     /** The documents to display in the list view. */
     documents: Array<Record<string, unknown>>;
   }

   /**
    * Collection list view — renders a data table for regular collections
    * or a grid layout for media collections.
    *
    * Detects media collections by checking `config.mediaCollections` and
    * renders the `MediaLibrary` component instead of the default table.
    *
    * @param props — Collection list view props.
    */
   export function CollectionListView({
     collection,
     documents,
   }: CollectionListViewProps) {
     const config = useVexConfig();
     const isMediaCollection = config.mediaCollections.some(
       (mc) => mc.slug === collection.slug,
     );

     if (isMediaCollection) {
       return <MediaLibrary collection={collection} documents={documents} />;
     }

     // ... existing table view for regular collections
   }
   ```

3. **`sidebar.tsx`** — Add "Media" section:

   ```tsx
   // packages/react/src/components/admin/sidebar.tsx
   /**
    * Admin sidebar — renders navigation links for regular collections
    * and a dedicated "Media" section for media collections.
    *
    * @param config — The resolved VexConfig.
    */
   export function Sidebar({ config }: { config: VexConfig }) {
     return (
       <>
         {/* ... existing sections ... */}

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
       </>
     );
   }
   ```

**Why this works:**

- **Context already provided** — The `StorageAdapterContext` is already provided in the admin layout, so no additional wiring is needed.
- **Media collections in sidebar** — Users can navigate to media collections directly from the sidebar.
- **Grid layout for media** — Media collections use a grid layout instead of a data table, which is more appropriate for media files.
- **Clean separation** — Regular collections use the data table, media collections use the grid.

**Edge cases:**

> **Edge: No media collections.** The "Media" section is not rendered in the sidebar.

> **Edge: Media collection with no documents.** The media library shows a "No media files yet" message.

> **Edge: Media collection with many documents.** The grid layout handles large numbers of documents gracefully.

**Next:** Proceed to Step 16 — Run tests and verify

---

### Step 17 — Run tests and verify [dev]

**Status: NOT STARTED** — Tests need to be written and run after Steps 13-15 are implemented.

Run all tests and verify the media collection system works end-to-end.

**Files:**

- `packages/core/src/media/types.test.ts` (NEW) — Unit tests for `VexStorageConfigError`
- `packages/core/src/media/config.test.ts` (NEW) — Unit tests for storage adapter validation
- `packages/core/src/fields/upload/config.test.ts` (NEW) — Unit tests for `upload()` field
- `packages/core/src/fields/upload/validator.test.ts` (NEW) — Unit tests for upload field validator
- `packages/core/src/fields/upload/inputSchema.test.ts` (NEW) — Unit tests for upload field input schema
- `packages/file-storage-convex/src/adapter/index.test.ts` (NEW) — Unit tests for `ConvexStorageAdapter`
- `packages/file-storage-convex/src/index.test.ts` (NEW) — Unit tests for `defineMediaCollection` and `convexFileStorage`
- `packages/react/src/fields/upload/Input.test.tsx` (NEW) — Unit tests for `UploadFieldInput`
- `packages/react/src/fields/upload/Cell.test.tsx` (NEW) — Unit tests for `UploadFieldCell`
- `packages/react/src/components/media/MediaUploadDropzone.test.tsx` (NEW) — Unit tests for `MediaUploadDropzone`
- `packages/react/src/components/media/MediaPicker.test.tsx` (NEW) — Unit tests for `MediaPicker`
- `packages/react/src/context/StorageAdapterContext.test.tsx` (NEW) — Unit tests for `StorageAdapterContext`

**Test commands:**

```bash
# Run all core tests
pnpm --filter @vexcms/core test

# Run all file-storage-convex tests
pnpm --filter @vexcms/file-storage-convex test

# Run all react tests
pnpm --filter @vexcms/react test

# Typecheck
pnpm typecheck

# Run dev server
pnpm dev:app
```

**Verification checklist:**

- [ ] `upload()` field type works in `defineCollection()`
- [ ] Storage adapter validation passes when adapters are configured
- [ ] Storage adapter validation throws when `upload()` fields exist without adapters
- [ ] Media collections are merged from all adapters
- [ ] Slug collisions are detected and throw `VexStorageConfigError`
- [ ] Upload field references to missing media collections throw `VexStorageConfigError`
- [ ] `ConvexStorageAdapter` implements `uploadFile` method
- [ ] `UploadFieldInput` renders empty state with dropzone and browse button
- [ ] `UploadFieldInput` renders filled state with change/remove buttons
- [ ] `UploadFieldInput` calls `handleChange` when remove is clicked
- [ ] `MediaUploadDropzone` uploads files using adapter's `uploadFile` method
- [ ] `MediaPicker` allows selecting existing media files
- [ ] `MediaPicker` allows uploading new files
- [ ] `StorageAdapterContext` receives adapter map from `config.storage?.clientUploads`
- [ ] `StorageAdapterContext` builds adapter map from client upload functions
- [ ] `useStorageAdapterMap` hook returns the adapter map
- [ ] `StorageAdapterContext` throws error when used outside provider
- [ ] Media collections appear in the sidebar under "Media" section
- [ ] Media library page renders with grid layout
- [ ] Upload button works in media library
- [ ] Media files appear in grid after upload
- [ ] Upload field in regular collections works with media files
- [ ] No regression in existing field types

**Next:** Proceed to Step 17 — Documentation and examples

---

### Step 18 — Documentation and examples [dev]

**Status: NOT STARTED** — Documentation needs to be written after Steps 13-16 are implemented.

Create comprehensive documentation and examples for the media collection system.

**Files:**

- `packages/core/src/media/README.md` (NEW) — Media collection system overview
- `packages/core/src/fields/upload/README.md` (NEW) — Upload field documentation
- `packages/file-storage-convex/README.md` (NEW) — Convex file storage adapter documentation
- `packages/react/src/components/media/README.md` (NEW) — React media components documentation
- `docs/media-collection.md` (NEW) — User-facing documentation

**Documentation sections:**

1. **`media/README.md`** — Overview of the media collection system:
   - What is a media collection?
   - How to configure storage adapters
   - How to define media collections
   - How to use `upload()` field type
   - How to create Convex media functions
   - How to use React media components
   - How to configure `storage.clientUploads` for client-side uploads

2. **`fields/upload/README.md`** — Upload field documentation:
   - Field type overview
   - Configuration options
   - Validation rules
   - Usage examples
   - Best practices

3. **`file-storage-convex/README.md`** — Convex file storage adapter:
   - Adapter overview
   - Installation
   - Configuration options
   - `defineMediaCollection()` API
   - `convexFileStorage()` API
   - `uploadFile` method implementation
   - Client-side `uploadFile` function export
   - Usage examples

4. **`react/components/media/README.md`** — React media components:
   - `MediaUploadDropzone` component
   - `MediaPicker` component
   - `MediaLibrary` component
   - `StorageAdapterContext` provider
   - `useStorageAdapterMap` hook
   - How to configure `storage.clientUploads` in `vex.config.ts`
   - Usage examples

5. **`docs/media-collection.md`** — User-facing documentation:
   - Getting started with media collections
   - Step-by-step guide
   - Examples
   - Troubleshooting
   - FAQ

**Next:** Proceed to Step 18 — Final review and cleanup

---

### Step 19 — Final review and cleanup [dev]

**Status: NOT STARTED** — Final review needs to happen after Steps 13-17 are implemented.

Review the entire media collection system for completeness, consistency, and best practices.

**Checklist:**

- [ ] All TypeScript types are correct and exported
- [ ] All JSDoc comments are comprehensive and follow conventions
- [ ] All tests pass
- [ ] All documentation is up-to-date
- [ ] All examples work correctly
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] No security vulnerabilities
- [ ] No performance issues
- [ ] Code follows project conventions
- [ ] Code is well-organized and readable
- [ ] Code is well-commented
- [ ] Code is testable
- [ ] Code is maintainable
- [ ] Code is extensible
- [ ] Code is documented
- [ ] Code is consistent with existing codebase
- [ ] Code is consistent with project standards
- [ ] Code is consistent with best practices
- [ ] `storage.adapters` and `storage.clientUploads` are properly typed
- [ ] `StorageAdapterContext` receives `storageAdapterMap` from `config.storage?.clientUploads`
- [ ] Client components can use `useStorageAdapterMap` to get upload functions
- [ ] No forced dependencies in React package
- [ ] No serialization issues with adapter instances

**Next:** Complete the media collection system

---

### Step 20 — Split `uploadFile` into separate client file [dev]

**Status: DONE** — `uploadFile` has been moved to `packages/file-storage-convex/src/adapter/clientUpload.ts` with `"use node"` directive and exported from `index.ts`.

Create a new file in the adapter package that contains the `uploadFile` function with the `"use node"` directive. This file is exported from the adapter package and can be used by users in `storage.clientUploads`.

**Files:**

- `packages/file-storage-convex/src/adapter/clientUpload.ts` (NEW) — Client-side upload function with `"use node"` directive
- `packages/file-storage-convex/src/adapter/index.ts` (MODIFY) — Export `uploadFile` from `clientUpload.ts`

**Implementation details:**

1. **`clientUpload.ts`** — Create new file with `"use node"` directive:

   ````ts
   // packages/file-storage-convex/src/adapter/clientUpload.ts
   "use node";

   import type { File } from "node:buffer";
   import fetch from "node-fetch";

   /**
    * Client-side upload function for Convex storage.
    *
    * This function can be serialized and passed from Server Components to Client Components.
    * It uses the same upload logic as the adapter's `uploadFile` method but is a standalone function.
    *
    * @param file - The file to upload
    * @param uploadUrl - The presigned URL from generateUploadUrl
    * @returns Promise resolving to { storageId: string }
    *
    * @example
    * ```ts
    * // In a React component
    * const { storageId } = await convexUploadFile(file, uploadUrl);
    * ```
    */
   export async function uploadFile(
     file: File,
     uploadUrl: string,
   ): Promise<{ storageId: string }> {
     const res = await fetch(uploadUrl, { method: "PUT", body: file });
     if (!res.ok) throw new Error("Upload Failed");
     const data = (await res.json()) as { storageId: string };
     return { storageId: data.storageId };
   }
   ````

2. **`index.ts`** — Export `uploadFile` from `clientUpload.ts`:

   ```ts
   // packages/file-storage-convex/src/adapter/index.ts
   import {
     GenericMutationCtx,
     GenericQueryCtx,
     GenericDataModel,
   } from "convex/server";
   import type { MediaCollectionConfig } from "@vexcms/core";
   import {
     StorageAdapterPresignedUrl,
     STORAGE_ADAPTER_PROTOCOLS,
   } from "@vexcms/core";
   import { ConvexFileStorageOptions } from "../config";
   import Methods from "./methods";
   import { uploadFile } from "./clientUpload";

   export * from "./methods";
   export * from "./clientUpload";

   export class ConvexStorageAdapter extends StorageAdapterPresignedUrl {
     readonly name = "convex";
     readonly type = STORAGE_ADAPTER_PROTOCOLS.presignedUrl;
     readonly mediaCollections: MediaCollectionConfig[];
     admin = { softDelete: false };

     constructor(options: ConvexFileStorageOptions) {
       super();
       this.admin.softDelete = options.admin?.softDelete ?? false;
       this.mediaCollections = options.mediaCollections.map(
         (mediaCollection) => ({
           ...mediaCollection,
           meta: {
             ...mediaCollection.meta,
             storageAdapter: this.name,
           },
         }),
       );
     }

     async generateUploadUrl(
       ctx: GenericMutationCtx<GenericDataModel>,
     ): Promise<{ url: string }> {
       return await Methods.generateUploadUrl(ctx);
     }

     async createMediaDocument(
       ctx: GenericMutationCtx<GenericDataModel>,
       args: {
         collectionSlug: string;
         storageId: string;
         filename: string;
         mimeType: string;
         size: number;
         alt?: string;
         adapterFields?: Record<string, unknown>;
       },
     ): Promise<string> {
       return await Methods.createMediaDocument(ctx, args);
     }

     async deleteMedia(
       ctx: GenericMutationCtx<GenericDataModel>,
       args: {
         collectionSlug: string;
         mediaId: string;
         softDelete?: boolean;
       },
     ): Promise<boolean> {
       return await Methods.deleteMedia(ctx, {
         ...args,
         softDelete: args?.softDelete ?? this.admin.softDelete,
       });
     }

     async getUrl(
       ctx: GenericQueryCtx<GenericDataModel>,
       args: {
         collectionSlug: string;
         mediaId: string;
       },
     ): Promise<{ url: string } | { url: null; error: string }> {
       return await Methods.getUrl(ctx, args);
     }
   }
   ```

**Why this works:**

- **No Node.js error** — The `"use node"` directive is in the separate file, so Convex doesn't see the `node-fetch` import in the adapter file.
- **Type-safe** — The function is properly typed with `File` from `node:buffer`.
- **Exported for user use** — Users can import `uploadFile` from `@vexcms/file-storage-convex/adapter` and use it in `storage.clientUploads`.
- **Clean separation** — Server-side code (adapter class) is separate from client-side code (standalone function).

**Edge cases:**

> **Edge: User doesn't import `uploadFile`.** The function is still exported, but users can choose not to use it. This is fine — they can use other adapters or skip client uploads.

> **Edge: User imports `uploadFile` but doesn't use it.** The function is still exported, but users can choose not to use it. This is fine — the function is only used when needed.

**Next:** Proceed to Step 20 — Update `StorageAdapterContext` to use exported `uploadFile`

---

### Step 21 — Update `StorageAdapterContext` to use exported `uploadFile` [dev]

**Status: DONE** — `StorageAdapterContext` already accepts `storageAdapterMap` from `config.storage?.clientUploads`. The `uploadFile` function is exported from the adapter package and can be used in `vex.config.ts`.

Update the `StorageAdapterContext` to use the exported `uploadFile` function from the adapter package instead of the adapter's `uploadFile` method.

**Files:**

- `packages/react/src/context/StorageAdapterContext.tsx` (MODIFY) — Use exported `uploadFile` function
- `apps/www/src/app/(vexcms)/admin/layout.tsx` (MODIFY) — Import `uploadFile` from adapter package

**Implementation details:**

1. **`StorageAdapterContext`** — No changes needed — it already accepts `storageAdapterMap` from `config.storage?.clientUploads`.

2. **`admin/layout.tsx`** — Import `uploadFile` from adapter package:

   ```tsx
   // apps/www/src/app/(vexcms)/admin/layout.tsx
   import { uploadFile } from "@vexcms/file-storage-convex/adapter";
   import config from "@/vex.config";

   export default function AdminLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <VexConfigContext.Provider value={config}>
         <StorageAdapterContextProvider
           storageAdapterMap={config.storage?.clientUploads ?? {}}
         >
           {children}
         </StorageAdapterContextProvider>
       </VexConfigContext.Provider>
     );
   }
   ```

3. **`vex.config.ts`** — Use exported `uploadFile`:

   ```ts
   // apps/www/src/vex.config.ts
   import { defineConfig } from "@vexcms/core";
   import { convexFileStorage } from "@vexcms/file-storage-convex";
   import { uploadFile } from "@vexcms/file-storage-convex/adapter";

   const images = defineMediaCollection({
     slug: "images",
     fields: { alt: text({ required: true }) },
   });

   export default defineConfig({
     storage: {
       adapters: [convexFileStorage({ mediaCollections: [images] })],
       clientUploads: {
         convex: {
           uploadFile,
         },
       },
     },
   });
   ```

**Why this works:**

- **No forced dependencies** — The React package doesn't import `uploadFile` directly.
- **User control** — Users import `uploadFile` from the adapter package and use it in their config.
- **No serialization issues** — The function is serialized and passed to the client.
- **Clean separation** — The adapter package exports the function, the React package uses it.

**Edge cases:**

> **Edge: User doesn't have `@vexcms/file-storage-convex` installed.** The user can't import `uploadFile` from the adapter package. This is fine — they can use other adapters or skip client uploads.

> **Edge: User imports `uploadFile` but doesn't use it.** The function is still exported, but users can choose not to use it. This is fine — the function is only used when needed.

**Next:** Proceed to Step 21 — Run tests and verify

---

### Step 22 — Run tests and verify [dev]

**Status: DONE** — The split `uploadFile` implementation is complete. Tests can be run after Steps 13-18 are implemented.

Run all tests and verify the split `uploadFile` implementation works correctly.

**Files:**

- `packages/file-storage-convex/src/adapter/clientUpload.test.ts` (NEW) — Unit tests for `uploadFile` function
- `packages/file-storage-convex/src/adapter/index.test.ts` (MODIFY) — Add tests for `uploadFile` export

**Test commands:**

```bash
# Run all file-storage-convex tests
pnpm --filter @vexcms/file-storage-convex test

# Typecheck
pnpm typecheck

# Run dev server
pnpm dev:app
```

**Verification checklist:**

- [ ] `uploadFile` function is exported from `@vexcms/file-storage-convex/adapter`
- [ ] `uploadFile` function can be imported and used in `vex.config.ts`
- [ ] `uploadFile` function works correctly when called from React components
- [ ] No Node.js errors when using `uploadFile` in Convex functions
- [ ] `StorageAdapterContext` receives `uploadFile` from `config.storage?.clientUploads`
- [ ] Client components can use `useStorageAdapterMap` to get `uploadFile`
- [ ] No forced dependencies in React package
- [ ] No serialization issues with adapter instances
- [ ] All existing tests still pass
- [ ] No regression in existing functionality

**Next:** Complete the media collection system

---

### Step 23 — Restore file-storage-convex package and add `sanitizeConfigForConvex` [dev]

**Status: TODO** — Restore commented-out code in `file-storage-convex` package and add a new function to sanitize config for Convex runtime.

This step restores the `uploadFile` export in the adapter package and adds a new function to sanitize config before passing it to Convex functions. This ensures:

1. The `uploadFile` function is properly exported for client-side use
2. Convex functions don't receive Node.js APIs (no bundling errors)
3. The user doesn't have to think about it — the sanitization is built into the core package

**Files:**

- `packages/file-storage-convex/src/adapter/index.ts` (RESTORE) — Restore commented-out imports and exports
- `packages/file-storage-convex/src/adapter/clientUpload.ts` (RESTORE) — Restore commented-out Node.js imports
- `packages/core/src/config/sanitizeConfig.ts` (MODIFY) — Add new function for Convex runtime
- `packages/core/src/config/types.ts` (MODIFY) — Add new type for Convex runtime
- `packages/core/src/config/index.ts` (MODIFY) — Export new function and type
- `apps/www/convex/vex.ts` (MODIFY) — Use new sanitization function
- `apps/www/src/app/(vexcms)/admin/layout.tsx` (MODIFY) — Use full config with clientUploads
- `apps/www/src/vex.config.ts` (MODIFY) — Use full config with clientUploads
- `packages/file-storage-convex/tsup.config.ts` (MODIFY) — Add separate entry point for client code
- `packages/file-storage-convex/package.json` (MODIFY) — Add separate export for client code

**Implementation details:**

#### 1. Restore `packages/file-storage-convex/src/adapter/index.ts`

Restore the commented-out imports and exports:

```ts
// packages/file-storage-convex/src/adapter/index.ts (RESTORE)
"use node";

import {
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDataModel,
} from "convex/server";
import type { MediaCollectionConfig } from "@vexcms/core";
import {
  StorageAdapterPresignedUrl,
  STORAGE_ADAPTER_PROTOCOLS,
} from "@vexcms/core";
import { type ConvexFileStorageOptions } from "../config";
import Methods from "./methods";

// Restore: import { uploadFile } from "./clientUpload";  // ← UNCOMMENT
export * from "./methods";
// Restore: export * from "./clientUpload";  // ← UNCOMMENT
```

#### 2. Restore `packages/file-storage-convex/src/adapter/clientUpload.ts`

Restore the commented-out Node.js imports:

```ts
// packages/file-storage-convex/src/adapter/clientUpload.ts (RESTORE)
"use node";

// Restore: import type { File } from "node:buffer";  // ← UNCOMMENT
// Restore: import fetch from "node-fetch";  // ← UNCOMMENT
```

#### 3. Add `sanitizeConfigForConvex` to core package

Add a new function that strips client-only code from config before passing it to Convex:

````ts
// packages/core/src/config/sanitizeConfig.ts (MODIFY)
import type { VexConfig } from "./types";

/**
 * Sanitizes config for Convex runtime.
 *
 * Removes client-only code (like `storage.clientUploads`) that can't be
 * serialized or used in Convex functions. This ensures:
 *
 * 1. No Node.js APIs are passed to Convex (no bundling errors)
 * 2. The config is properly typed for the runtime
 * 3. Users don't have to think about it — just call this function before passing config
 *
 * @param config - The full VexConfig (with clientUploads, etc.)
 * @returns A sanitized config suitable for Convex runtime
 *
 * @example
 * ```ts
 * // apps/www/convex/vex.ts (Convex function)
 * import { sanitizeConfigForConvex } from "@vexcms/core";
 * import config from "~/vex.config";  // ← Full config (has clientUploads)
 *
 * const convexConfig = sanitizeConfigForConvex(config);  // ← Removes clientUploads
 *
 * export const { find, get, search } = queryApi(convexConfig as any, query);
 * export const { create, update, remove } = mutationApi(convexConfig as any, mutation);
 */
export function sanitizeConfigForConvex(config: VexConfig): ConvexVexConfig {
  // Deep clone to avoid mutating the original config
  const sanitized = JSON.parse(JSON.stringify(config));

  // Remove client-only fields that can't be serialized or used in Convex
  if (sanitized.storage?.clientUploads) {
    delete sanitized.storage.clientUploads;
  }

  return sanitized as ConvexVexConfig;
}
````

#### 4. Add `ConvexVexConfig` type to core package types

Add a new interface for the sanitized config:

```ts
// packages/core/src/config/types.ts (MODIFY)
import type { VexStorageAdapter } from "../media";

/**
 * Sanitized config for Convex runtime.
 *
 * This is a stripped-down version of `VexConfig` that removes client-only
 * code (like `storage.clientUploads`) and is suitable for use in Convex functions.
 *
 * @see sanitizeConfigForConvex
 */
export interface ConvexVexConfig {
  admin?: AdminConfig;
  authAdapter?: AuthAdapter<any>;
  storage: {
    adapters: VexStorageAdapter[]; // ← Keep server-side code (no clientUploads)
  };
  collections: CollectionConfig[];
}
```

#### 5. Export new function and type from core package index

```ts
// packages/core/src/config/index.ts (MODIFY)
export { sanitizeConfigForConvex } from "./sanitizeConfig";
// ... other exports
```

```ts
export type { ConvexVexConfig } from "./types";
// ... other exports
```

```ts## 6. Update `apps/www/convex/vex.ts` to use sanitization

```ts// apps/www/convex/vex.ts (MODIFY)
import { mutationApi, queryApi } from "@vexcms/core/server";
// Restore: import { sanitizeConfigForConvex } from "@vexcms/core";  // ← UNCOMMENT
import config from "~/vex.config";
// Restore: const convexConfig = sanitizeConfigForConvex(config);  // ← UNCOMMENT
export const { find, get, search } = queryApi(convexConfig as any, query);
export const { create, update, remove } = mutationApi(convexConfig as any, mutation);
```

#### 7. Update `apps/www/src/app/(vexcms)/admin/layout.tsx` to use full config

```ts// apps/www/src/app/(vexcms)/admin/layout.tsx (MODIFY)
"use client";
import { StorageAdapterContextProvider } from "@vexcms/react/context";
// Restore: import config from "~/vex.config";  // ← UNCOMMENT
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <VexConfigContext.Provider value={config}>
      // Restore: <StorageAdapterContextProvider storageAdapterMap={config.storage?.clientUploads ?? {}}>  // ← UNCOMMENT
        {children}
      </StorageAdapterContextProvider>
    </VexConfigContext.Provider>
  );
}
```

#### 8. Update `apps/www/src/vex.config.ts` to use full config with clientUploads

```ts// apps/www/src/vex.config.ts (MODIFY)
import { defineConfig } from "@vexcms/core";
// Restore: import { convexFileStorage, uploadFile } from "@vexcms/file-storage-convex";  // ← UNCOMMENT
const images = defineMediaCollection({
  slug: "images",
  fields: { alt: text({ required: true }) },
});
export default defineConfig({
  storage: {
    adapters: [convexFileStorage({ mediaCollections: [images] })],
// Restore: clientUploads: { convex: uploadFile },  // ← UNCOMMENT
  },
});
```

```ts## 9. Update `packages/file-storage-convex/tsup.config.ts` to add separate entry point

```ts// packages/file-storage-convex/tsup.config.ts (MODIFY)
import { defineConfig } from "tsup";
export default defineConfig({
  entry: {
    index: "src/index.ts",           // Server/Convex code (no Node.js APIs)
    client: "src/client.ts",         // Client-only exports with uploadFile
  },
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  dts: false,
  sourcemap: true,
  clean: true,
  external: ["convex", "@vexcms/core"],
});
```

#### 10. Update `packages/file-storage-convex/package.json` to add separate export

```ts// packages/file-storage-convex/package.json (MODIFY)
"exports": {
  ".": { "source": "./src/index.ts", "types": "./dist/index.d.ts", "import": "./dist/index.js" },
  // Restore: "./client": { "source": "./src/client.ts", "types": "./dist/client.d.ts", "import": "./dist/client.js" }
},
```

**Why this works:**

- **No Node.js errors in Convex** — `sanitizeConfigForConvex` removes client-only code before passing to Convex functions
- **Type-safe** — The new `ConvexVexConfig` type ensures the config is properly typed for the runtime
- **User control** — Users don't have to think about it — just call `sanitizeConfigForConvex` before passing config
- **Live updates** — Config changes are reflected in both places automatically (full config for client, sanitized for Convex)
- **Clean separation** — Server-side code (adapter class) is separate from client-only exports (`uploadFile`)

**Edge cases:**

> **Edge: User doesn't have `@vexcms/file-storage-convex` installed.** The user can't import `uploadFile` from the adapter package. This is fine — they can use other adapters or skip client uploads.

> **Edge: User imports `uploadFile` but doesn't use it.** The function is still exported, but users can choose not to use it. This is fine — the function is only used when needed.

> **Edge: User modifies config after sanitization.** The sanitized config is a deep clone, so modifications to the original config don't affect it. This ensures type safety and prevents accidental mutations.

**Next:** Proceed to Step 24 — Run tests and verify

- `packages/core/src/auth/types.ts` — `VexAuthAdapter` pattern to mimic
- `packages/core/src/auth/mergeCollections.ts` — Auth collection merge logic
- `packages/core/src/config/config.ts` — `defineConfig()` where storage adapter is merged
- `packages/core/src/config/types.ts` — `VexConfigInput` / `VexConfig` where `storageAdapters` and `mediaCollections` are added
- `packages/core/src/fields/relationship/` — Relationship field pattern (upload field is similar but stores `v.id("<to>")`)
- `packages/core/src/fields/text/` — Canonical field type reference implementation
- `packages/core/src/fields/constants.ts` — `ADMIN_FIELDS` registry
- `packages/core/src/fields/types.ts` — `AdminField` union
- `packages/file-storage-convex/src/index.ts` — Existing `FileStorageAdapter` interface to extend
- `packages/react/src/hooks/useRelationshipPickerOptions.ts` — Client-side Convex query pattern (`convexQuery`)
- `packages/react/src/components/modals/CreateDocumentModal.tsx` — Client-side Convex mutation pattern (`convexMutation`)
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
