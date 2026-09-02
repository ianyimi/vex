# Spec 16 — Media Collection Admin Views

## Overview

The admin panel currently renders media collections with the same generic `CollectionsView` used for regular collections. This spec adds media-specific views: a `MediaCollectionsView` with a thumbnail/icon grid table, a `CreateMediaDialog` with file upload + URL import, and a `MediaCollectionEditView` with inline file replacement. It also adds an `isMediaCollection()` utility in core, a `FilePreview` UI component for mime-type-aware rendering, a Convex HTTP action for server-side URL-to-file proxying, and refactors existing media Convex functions into dedicated `media.ts` files.

## Design Decisions

1. **No `_vex_` metadata fields on documents.** Media collections are identified client-side via `config.media?.collections` — the config already tracks which slugs are media collections. No extra DB fields needed.
2. **`isMediaCollection()` lives in `@vexcms/core`** so it's reusable by CLI, SDKs, and admin.
3. **Server-side URL proxy via Convex HTTP action.** Avoids CORS issues that would plague client-side fetches. Always routes through the server. Returns `{ storageId, filename, mimeType, size }` — the client then calls `createMediaDocument` separately (matches existing upload flow pattern).
4. **`maxSize` defaults to 25MB** on media collections when not explicitly configured.
5. **FilePreview renders real thumbnails for images only.** Videos, PDFs, audio, and other files get mime-type-appropriate Lucide icons (`FileVideo2`, `FileAudio`, `FileText`, `File`). No heavy preview libraries in V1.
6. **Thumbnail size in table is configurable** via a new `admin.thumbnailSize` option on media collections, defaulting to 40px.
7. **Upload-on-save for edit view.** When replacing a file in the edit view, the new file is staged locally. On save, the file is uploaded first, then the document is updated with new metadata + storageId. If save fails, no orphan files are created.
8. **URL auto-fetch on paste/blur** with 500ms debounce. No explicit "Fetch" button — smoother UX since the edit view always shows the current file on the left.
9. **Filename is editable** in both create and edit views. mimeType, size, and url are read-only (derived from the actual file).
10. **Edit view layout:** Left side shows the 3 read-only fields (mimeType, size, url) + FilePreview at half width. Right side shows the URL input or file upload at half width. Below that flex row: editable filename field, then alt, width, height, then any custom collection fields.

## Out of Scope

- Bulk upload / drag-drop multiple files
- Video thumbnail extraction (shows icon)
- PDF preview rendering (shows icon)
- Audio waveform preview (shows icon)
- Global-specific view routing
- Drag-and-drop reordering of media in lists
- Inline editing of media fields from the table view

## Target Directory Structure

```
packages/core/src/
  config/
    isMediaCollection.ts              # NEW — utility to detect media collections
    isMediaCollection.test.ts         # NEW — tests
  index.ts                            # MODIFY — add export

packages/ui/src/
  components/ui/
    file-preview.tsx                  # NEW — mime-aware preview component
    index.tsx                         # MODIFY — add export

packages/admin-next/src/
  views/
    MediaCollectionsView.tsx          # NEW — media list view with thumbnail table
    MediaCollectionEditView.tsx       # NEW — media edit view with file replacement
  components/
    CreateMediaDialog.tsx             # NEW — media creation dialog (file upload + URL import)
    MediaFileSection.tsx              # NEW — shared file preview + upload/replace UI
    AdminPage.tsx                     # MODIFY — route to media views
  hooks/
    useUrlToFile.ts                   # NEW — debounced URL fetch hook
  index.ts                            # MODIFY — exports if needed

apps/test-app/convex/vex/
  media.ts                            # NEW — media-specific Convex endpoints
  model/media.ts                      # NEW — media-specific model functions
  collections.ts                      # MODIFY — remove media functions (moved to media.ts)
  model/collections.ts                # MODIFY — remove media functions (moved to model/media.ts)
```

## Implementation Order

1. **Refactor: Move media Convex functions** to `media.ts` / `model/media.ts`. Add `downloadAndStoreUrl` HTTP action. Verify existing functionality still works.
2. **`isMediaCollection()` utility** in core with tests. Export from core index.
3. **`FilePreview` UI component** in `@vexcms/ui`. Renders image thumbnails or mime-type icons. Export from UI index.
4. **`AdminPage` routing update** — detect media collections, render `MediaCollectionsView` / `MediaCollectionEditView`.
5. **`MediaCollectionsView`** — media list view with thumbnail column, reuses most of `CollectionsView` logic but with media-specific columns and `CreateMediaDialog`.
6. **`useUrlToFile` hook** — debounced URL auto-fetch via Convex HTTP action.
7. **`MediaFileSection` component** — shared preview + upload/replace UI used by both create and edit views.
8. **`CreateMediaDialog`** — media creation dialog integrating `MediaFileSection` + editable fields.
9. **`MediaCollectionEditView`** — edit view with file replacement, upload-on-save.
10. **Final integration** — wire everything together, verify builds.

---

## Step 1: Refactor Convex Media Functions + Add URL Proxy

Move `generateUploadUrl`, `createMediaDocument`, and `paginatedSearchDocuments` from `collections.ts` to new `media.ts` files. Add the `downloadAndStoreUrl` HTTP action.

- [ ] Create `apps/test-app/convex/vex/model/media.ts`
- [ ] Create `apps/test-app/convex/vex/media.ts`
- [ ] Update `apps/test-app/convex/vex/collections.ts` — remove moved functions
- [ ] Update `apps/test-app/convex/vex/model/collections.ts` — remove moved functions
- [ ] Update all imports in admin-next that reference the moved endpoints (`anyApi.vex.collections.*` → `anyApi.vex.media.*`)
- [ ] Verify `pnpm convex dev` still works, existing media upload flow still functions

### File: `apps/test-app/convex/vex/model/media.ts`

Move `createMediaDocument` and `paginatedSearchDocuments` from `model/collections.ts`. These are identical — just re-homed.

```typescript
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  PaginationOptions,
  TableNamesInDataModel,
} from "convex/server"

export async function createMediaDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    fields: Record<string, unknown>
  }
}): Promise<string> {
  const id = await props.ctx.db.insert(props.args.collectionSlug as any, props.args.fields as any)
  return id as string
}

export async function paginatedSearchDocuments<DataModel extends GenericDataModel>(props: {
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    searchIndexName: string
    searchField: string
    query: string
    paginationOpts: PaginationOptions
  }
  ctx: GenericQueryCtx<DataModel>
}) {
  const { args, ctx } = props

  if (args.query === "") {
    return await ctx.db.query(args.collectionSlug).paginate(args.paginationOpts)
  }

  return await (ctx.db.query(args.collectionSlug) as any)
    .withSearchIndex(args.searchIndexName, (q: any) => q.search(args.searchField, args.query))
    .paginate(args.paginationOpts)
}

/**
 * Downloads a file from a URL and stores it in Convex file storage.
 * Returns the storageId and file metadata.
 *
 * Called by the `downloadAndStoreUrl` HTTP action endpoint.
 */
export async function downloadAndStoreFromUrl<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    url: string
    maxSize: number
  }
}): Promise<{
  storageId: string
  filename: string
  mimeType: string
  size: number
}> {
  // TODO: implement
  //
  // 1. Validate props.args.url is a valid URL (new URL() — catch and throw ConvexError)
  //    → throw ConvexError("Invalid URL") if parsing fails
  //
  // 2. Fetch the URL with a timeout (e.g., AbortController with 30s timeout)
  //    → throw ConvexError("Failed to fetch URL: <statusText>") if response not ok
  //    → throw ConvexError("URL fetch timed out") if aborted
  //
  // 3. Check Content-Type header — reject text/html
  //    → throw ConvexError("URL points to an HTML page, not a file")
  //
  // 4. Read the response as an ArrayBuffer
  //    → Check size against props.args.maxSize BEFORE storing
  //    → throw ConvexError("File size exceeds maximum allowed (<maxSize> bytes)")
  //
  // 5. Extract filename from URL pathname (last segment, decoded)
  //    → Fallback to "download" if pathname is empty or "/"
  //    → Append extension from Content-Type if filename has none
  //
  // 6. Extract mimeType from Content-Type header
  //    → Strip charset suffix (e.g., "image/png; charset=utf-8" → "image/png")
  //    → Fallback to "application/octet-stream" if missing
  //
  // 7. Upload to Convex storage:
  //    const blob = new Blob([arrayBuffer], { type: mimeType })
  //    const storageId = await props.ctx.storage.store(blob)
  //
  // 8. Return { storageId: storageId as string, filename, mimeType, size: arrayBuffer.byteLength }
  //
  // Edge cases:
  // - URL with query params in filename: strip query string before extracting filename
  // - Redirects: fetch follows redirects by default, which is correct
  // - Empty response body: size will be 0, which is valid (creates empty file)
  throw new Error("Not implemented")
}
```

### File: `apps/test-app/convex/vex/media.ts`

New endpoint file for media-specific Convex functions.

```typescript
import type { DataModel } from "@convex/_generated/dataModel"
import type { TableNamesInDataModel } from "convex/server"

import { mutation, query, action } from "@convex/_generated/server"
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { internal } from "@convex/_generated/api"

import * as Media from "./model/media"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const createMediaDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    return await Media.createMediaDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        fields: fields as Record<string, unknown>,
      },
    })
  },
})

export const paginatedSearchDocuments = query({
  args: {
    collectionSlug: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    {
      collectionSlug,
      searchIndexName,
      searchField,
      query: searchQuery,
      paginationOpts,
    },
  ) => {
    return await Media.paginatedSearchDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        searchIndexName,
        searchField,
        query: searchQuery,
        paginationOpts,
      },
      ctx,
    })
  },
})

/**
 * Downloads a file from a URL and stores it in Convex storage.
 * Returns storageId + file metadata for the client to create a media document.
 *
 * This is a Convex action (not mutation) because it makes external HTTP requests.
 * It calls an internal mutation to store the file in Convex storage.
 */
export const downloadAndStoreUrl = action({
  args: {
    url: v.string(),
    maxSize: v.number(),
  },
  handler: async (ctx, { url, maxSize }) => {
    // TODO: implement
    //
    // 1. Validate URL format (new URL(url) — catch and throw ConvexError)
    //
    // 2. Fetch the URL with AbortController (30s timeout)
    //    → throw on non-ok response
    //    → throw on timeout
    //
    // 3. Reject text/html Content-Type
    //
    // 4. Read as ArrayBuffer, check size against maxSize
    //
    // 5. Extract filename from URL pathname
    //    → decode URI component, take last path segment
    //    → strip query params
    //    → fallback to "download" if empty
    //
    // 6. Extract mimeType from Content-Type header (strip charset)
    //    → fallback to "application/octet-stream"
    //
    // 7. Store in Convex storage:
    //    const blob = new Blob([arrayBuffer], { type: mimeType })
    //    const storageId = await ctx.storage.store(blob)
    //
    // 8. Return { storageId, filename, mimeType, size: arrayBuffer.byteLength }
    //
    // Note: This is an action, not a mutation, because it fetches an external URL.
    // Convex actions can call ctx.storage.store() directly.
    //
    // Edge cases:
    // - URL with fragment (#): strip before fetching
    // - Content-Disposition header with filename: prefer over URL pathname if present
    // - No Content-Type header: default to "application/octet-stream"
    throw new Error("Not implemented")
  },
})
```

### Updates to `apps/test-app/convex/vex/collections.ts`

Remove these exports (they now live in `media.ts`):
- `generateUploadUrl`
- `createMediaDocument`
- `paginatedSearchDocuments`

### Updates to `apps/test-app/convex/vex/model/collections.ts`

Remove these exports (they now live in `model/media.ts`):
- `createMediaDocument`
- `paginatedSearchDocuments`

### Import Updates in admin-next

Update all references from `anyApi.vex.collections.*` to `anyApi.vex.media.*` for:
- `generateUploadUrl` → `anyApi.vex.media.generateUploadUrl`
- `createMediaDocument` → `anyApi.vex.media.createMediaDocument`
- `paginatedSearchDocuments` → `anyApi.vex.media.paginatedSearchDocuments`

Files to update:
- `packages/admin-next/src/views/CollectionEditView.tsx` — `generateUploadUrl`, `createMediaDocument`
- `packages/admin-next/src/hooks/useMediaPicker.ts` — `paginatedSearchDocuments`

---

## Step 2: `isMediaCollection()` Utility + Tests

- [ ] Create `packages/core/src/config/isMediaCollection.ts`
- [ ] Create `packages/core/src/config/isMediaCollection.test.ts`
- [ ] Update `packages/core/src/index.ts` — add export
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/config/isMediaCollection.ts`

```typescript
import type { AnyVexCollection } from "../types";

interface ConfigWithMedia {
  media?: {
    collections: AnyVexCollection[];
  };
}

/**
 * Check whether a collection is a media collection.
 *
 * Compares the collection's slug against the slugs in `config.media.collections`.
 * Works with both `VexConfig` and `ClientVexConfig` (both have the `media?.collections` shape).
 *
 * @param props.collection - The collection to check
 * @param props.config - The Vex config (or client config) containing media configuration
 * @returns true if the collection's slug matches a media collection slug
 */
export function isMediaCollection(props: {
  collection: AnyVexCollection;
  config: ConfigWithMedia;
}): boolean {
  if (!props.config.media?.collections) return false;
  return props.config.media.collections.some(
    (mc) => mc.slug === props.collection.slug,
  );
}
```

### File: `packages/core/src/config/isMediaCollection.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { isMediaCollection } from "./isMediaCollection";
import { defineMediaCollection } from "./defineMediaCollection";
import { defineCollection } from "./defineCollection";
import { text } from "../fields/text";

describe("isMediaCollection", () => {
  const mediaImages = defineMediaCollection("images");
  const mediaDocuments = defineMediaCollection("documents");
  const posts = defineCollection("posts", {
    fields: { title: text({ required: true, defaultValue: "" }) },
  });

  const config = {
    media: {
      collections: [mediaImages, mediaDocuments],
    },
  };

  const configNoMedia = {};

  it("returns true for a media collection", () => {
    expect(isMediaCollection({ collection: mediaImages, config })).toBe(true);
    expect(isMediaCollection({ collection: mediaDocuments, config })).toBe(true);
  });

  it("returns false for a regular collection", () => {
    expect(isMediaCollection({ collection: posts, config })).toBe(false);
  });

  it("returns false when config has no media", () => {
    expect(
      isMediaCollection({ collection: mediaImages, config: configNoMedia }),
    ).toBe(false);
  });

  it("returns false when media.collections is empty", () => {
    expect(
      isMediaCollection({
        collection: mediaImages,
        config: { media: { collections: [] } },
      }),
    ).toBe(false);
  });
});
```

### Update `packages/core/src/index.ts`

Add:
```typescript
export { isMediaCollection } from "./config/isMediaCollection";
```

---

## Step 3: `FilePreview` UI Component

- [ ] Create `packages/ui/src/components/ui/file-preview.tsx`
- [ ] Update `packages/ui/src/components/ui/index.tsx` — add export
- [ ] Run `pnpm --filter @vexcms/ui build`

### File: `packages/ui/src/components/ui/file-preview.tsx`

```typescript
"use client";

import { File, FileVideo2, FileAudio, FileText, FileSpreadsheet, FileArchive } from "lucide-react";
import { cn } from "../../styles/utils";

interface FilePreviewProps {
  /** The URL of the file (used for image src) */
  url?: string | null;
  /** The MIME type of the file */
  mimeType: string;
  /** Alt text for images */
  alt?: string;
  /** Size in pixels (width and height). Default: 40 */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Returns the appropriate Lucide icon component for a given MIME type.
 * Used for non-image files where a real preview isn't available.
 */
function getIconForMimeType(mimeType: string) {
  if (mimeType.startsWith("video/")) return FileVideo2;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("csv") ||
    mimeType.includes("excel")
  ) return FileSpreadsheet;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  ) return FileArchive;
  return File;
}

function FilePreview(props: FilePreviewProps) {
  const size = props.size ?? 40;
  const isImage = props.mimeType.startsWith("image/");

  if (isImage && props.url) {
    return (
      <img
        src={props.url}
        alt={props.alt || ""}
        className={cn("rounded object-cover", props.className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const IconComponent = getIconForMimeType(props.mimeType);
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded bg-muted",
        props.className,
      )}
      style={{ width: size, height: size }}
    >
      <IconComponent
        className="text-muted-foreground"
        style={{ width: size * 0.5, height: size * 0.5 }}
      />
    </div>
  );
}

export { FilePreview, type FilePreviewProps };
```

### Update `packages/ui/src/components/ui/index.tsx`

Add:
```typescript
export { FilePreview, type FilePreviewProps } from "./file-preview";
```

---

## Step 4: `AdminPage` Routing Update

- [ ] Update `packages/admin-next/src/components/AdminPage.tsx` — import and route to media views
- [ ] Run `pnpm --filter @vexcms/admin-next build`

### File: `packages/admin-next/src/components/AdminPage.tsx`

Update the `AdminPage` component to detect media collections and render the appropriate views.

```typescript
"use client";

import { Suspense } from "react";
import type { ClientVexConfig, AnyVexCollection } from "@vexcms/core";
import { mergeAuthCollectionWithUserCollection, isMediaCollection } from "@vexcms/core";
import { DashboardView } from "../views/DashboardView";
import { NotFoundView } from "../views/NotFoundView";
import CollectionsView from "../views/CollectionsView";
import CollectionEditView from "../views/CollectionEditView";
import MediaCollectionsView from "../views/MediaCollectionsView";
import MediaCollectionEditView from "../views/MediaCollectionEditView";

/**
 * Resolves a collection by slug, merging auth fields when the slug
 * matches both a user-defined collection and an auth collection.
 * If only an auth collection exists (no user override), returns it as-is.
 */
function resolveCollection(
  config: ClientVexConfig,
  slug: string,
): AnyVexCollection | undefined {
  const userCollection = config.collections.find((c) => c.slug === slug);
  const authCollection = config.auth?.collections.find((c) => c.slug === slug);

  if (userCollection && authCollection) {
    const merged = mergeAuthCollectionWithUserCollection({
      authCollection,
      userCollection,
    });
    return {
      slug: userCollection.slug,
      config: {
        ...userCollection.config,
        fields: merged.fields,
      },
    } as AnyVexCollection;
  }

  if (authCollection) {
    return authCollection;
  }

  // Media collection
  const mediaCollection = config.media?.collections.find((c) => c.slug === slug);
  if (mediaCollection) {
    return mediaCollection;
  }

  return userCollection;
}

interface AdminPageProps {
  config: ClientVexConfig;
  path?: string[];
}

export function AdminPage({ config, path = [] }: AdminPageProps) {
  const [collectionSlug, documentID] = path;

  if (!collectionSlug) {
    return <DashboardView config={config} />;
  }

  const collection = resolveCollection(config, collectionSlug);
  if (!collection) {
    return <NotFoundView />;
  }

  const isMedia = isMediaCollection({ collection, config });

  if (!documentID) {
    if (isMedia) {
      return (
        <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
          <MediaCollectionsView config={config} collection={collection} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
        <CollectionsView config={config} collection={collection} />
      </Suspense>
    );
  }

  if (isMedia) {
    return (
      <MediaCollectionEditView
        config={config}
        collection={collection}
        documentID={documentID}
      />
    );
  }

  return (
    <CollectionEditView
      config={config}
      collection={collection}
      documentID={documentID}
    />
  );
}
```

---

## Step 5: `MediaCollectionsView`

The media list view reuses pagination, search, row selection, and delete logic from `CollectionsView`, but replaces the column generation with media-specific columns that show a `FilePreview` thumbnail as the first column.

- [ ] Create `packages/admin-next/src/views/MediaCollectionsView.tsx`
- [ ] Run `pnpm --filter @vexcms/admin-next build`

### File: `packages/admin-next/src/views/MediaCollectionsView.tsx`

This is a guided stub. The structure mirrors `CollectionsView.tsx` closely — same pagination, search, row selection, URL-param-driven modals. The key differences:

1. First column is a `FilePreview` thumbnail using the document's `url` and `mimeType` fields
2. Creates button opens `CreateMediaDialog` instead of `CreateDocumentDialog`
3. Columns include: preview thumbnail, filename (as title link), mimeType, size (formatted), then any custom fields

```typescript
"use client";

// TODO: implement
//
// This component mirrors CollectionsView almost exactly. The differences are:
//
// 1. COLUMNS: Instead of generateColumns(), build columns manually:
//    a. Preview column (id: "preview", no header text, size: thumbnailSize + 16):
//       cell renders <FilePreview url={doc.url} mimeType={doc.mimeType} size={thumbnailSize} />
//       where thumbnailSize = collection.config.admin?.thumbnailSize ?? 40
//    b. Filename column (accessorKey: "filename", header: "Filename"):
//       meta: { isTitle: true } — makes it a clickable link to edit view
//    c. mimeType column (accessorKey: "mimeType", header: "Type")
//    d. Size column (accessorKey: "size", header: "Size"):
//       cell formats bytes: formatBytes(value) — reuse or inline the formatBytes from upload-dropzone
//    e. Any non-default fields from the collection that aren't in the locked/overridable set
//       and aren't admin.hidden — use buildColumnDef or simple accessorKey columns
//    f. Actions column — same RowActionsMenu as CollectionsView
//
// 2. CREATE MODAL: Renders <CreateMediaDialog> instead of <CreateDocumentDialog>
//    Props: open, onClose, collection, config, onCreated
//
// 3. Everything else is identical to CollectionsView:
//    - useBidirectionalPagination
//    - usePaginationLoader
//    - search via searchDocuments
//    - row selection + bulk delete
//    - DeleteDocumentDialog
//    - breadcrumbs, page size selector, etc.
//
// Copy the structure from CollectionsView and make these targeted changes.
// Import FilePreview from "@vexcms/ui".
// Import CreateMediaDialog from "../components/CreateMediaDialog".
```

---

## Step 6: `useUrlToFile` Hook

- [ ] Create `packages/admin-next/src/hooks/useUrlToFile.ts`
- [ ] Run `pnpm --filter @vexcms/admin-next build`

### File: `packages/admin-next/src/hooks/useUrlToFile.ts`

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { useAction } from "convex/react";
import { anyApi } from "convex/server";

interface UrlToFileResult {
  storageId: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface UseUrlToFileProps {
  /** Max file size in bytes. Default: 25MB */
  maxSize?: number;
}

interface UseUrlToFileReturn {
  /** The URL input value */
  url: string;
  /** Set the URL input value */
  setUrl: (url: string) => void;
  /** Whether a fetch is in progress */
  isFetching: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Result from successful fetch */
  result: UrlToFileResult | null;
  /** Clear the result and error */
  clear: () => void;
}

const DEFAULT_MAX_SIZE = 25 * 1024 * 1024; // 25MB
const DEBOUNCE_MS = 500;

/**
 * Hook that auto-fetches a URL via the Convex downloadAndStoreUrl action
 * after a debounce. Returns the storageId + file metadata on success.
 */
export function useUrlToFile(props?: UseUrlToFileProps): UseUrlToFileReturn {
  // TODO: implement
  //
  // 1. State: url (string), isFetching (boolean), error (string | null), result (UrlToFileResult | null)
  //
  // 2. Get the Convex action: useAction(anyApi.vex.media.downloadAndStoreUrl)
  //
  // 3. Debounced effect on `url`:
  //    a. If url is empty or not a valid URL (try new URL(url)), clear result/error and return
  //    b. Set a timeout of DEBOUNCE_MS
  //    c. On trigger: setIsFetching(true), setError(null)
  //    d. Call the action with { url, maxSize: props?.maxSize ?? DEFAULT_MAX_SIZE }
  //    e. On success: setResult(response), setIsFetching(false)
  //    f. On error: setError(error.message or "Failed to fetch URL"), setIsFetching(false)
  //    g. Cleanup: clearTimeout on unmount or url change
  //
  // 4. Use a ref to track the latest url to avoid stale closures
  //    (if user types a new URL while a fetch is pending, ignore the old result)
  //
  // 5. clear(): setUrl(""), setResult(null), setError(null)
  //
  // Edge cases:
  // - User clears the URL while fetch is in-flight: ignore the result (check ref)
  // - URL changes rapidly: debounce ensures only the last one fires
  // - Action throws ConvexError: extract message from error.data or error.message
  throw new Error("Not implemented");
}
```

---

## Step 7: `MediaFileSection` Component

Shared UI section used by both `CreateMediaDialog` and `MediaCollectionEditView`. Shows the file preview + metadata on the left and the URL input / file upload on the right.

- [ ] Create `packages/admin-next/src/components/MediaFileSection.tsx`
- [ ] Run `pnpm --filter @vexcms/admin-next build`

### File: `packages/admin-next/src/components/MediaFileSection.tsx`

```typescript
"use client";

import type { UseUrlToFileReturn } from "../hooks/useUrlToFile";
import { FilePreview, UploadDropzone, Input, Label } from "@vexcms/ui";
import { AlertCircle, Loader2 } from "lucide-react";

interface FileMetadata {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

interface MediaFileSectionProps {
  /** Current file metadata (existing document or newly selected file) */
  currentFile: FileMetadata | null;
  /** Whether a new file has been staged (not yet uploaded) */
  hasPendingFile: boolean;
  /** The staged File object for upload (from file input or URL download) */
  pendingFile: File | null;
  /** Set the pending file (from UploadDropzone) */
  onFileSelect: (file: File) => void;
  /** Clear the pending file */
  onClearPendingFile: () => void;
  /** URL-to-file hook return */
  urlToFile: UseUrlToFileReturn;
  /** Accepted MIME types */
  accept?: string[];
  /** Max file size in bytes */
  maxSize?: number;
  /** Whether inputs are disabled (e.g., during save) */
  disabled?: boolean;
  /** Layout mode: "stacked" for create dialog, "side-by-side" for edit view */
  layout: "stacked" | "side-by-side";
}

/**
 * Shared file section for media create/edit views.
 *
 * In "stacked" layout (create dialog):
 *   - URL input at top
 *   - OR file upload dropzone
 *   - Below: preview + read-only metadata if a file is selected
 *
 * In "side-by-side" layout (edit view):
 *   - Left (half width): FilePreview + read-only metadata (mimeType, size, url)
 *   - Right (half width): URL input + file upload dropzone for replacement
 */
export function MediaFileSection(props: MediaFileSectionProps) {
  // TODO: implement
  //
  // 1. Compute display metadata:
  //    - If props.hasPendingFile and props.pendingFile exists:
  //      Use pending file metadata (name, type, size, URL.createObjectURL for preview)
  //    - If props.urlToFile.result exists:
  //      Use URL fetch result metadata (filename, mimeType, size, url from result)
  //    - Otherwise: use props.currentFile
  //
  // 2. Format size for display: formatBytes(size) — inline helper or import from upload-dropzone
  //
  // 3. Render based on props.layout:
  //
  //    "stacked" layout:
  //    ┌──────────────────────────────┐
  //    │ URL Input  (or)  Dropzone    │
  //    │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
  //    │ [Preview] mimeType | size    │
  //    │           url (readonly)     │
  //    └──────────────────────────────┘
  //
  //    "side-by-side" layout:
  //    ┌──────────────┬───────────────┐
  //    │ [Preview]    │ URL Input     │
  //    │ mimeType     │    (or)       │
  //    │ size         │ Dropzone      │
  //    │ url          │               │
  //    └──────────────┴───────────────┘
  //
  // 4. URL input:
  //    - <Input value={props.urlToFile.url} onChange={...} placeholder="Paste a URL..." />
  //    - Show <Loader2 className="animate-spin" /> when props.urlToFile.isFetching
  //    - Show error below input when props.urlToFile.error is set
  //    - Hide dropzone when URL has content; hide URL input when file is selected
  //      OR show both with "or" divider — up to implementation judgment
  //
  // 5. UploadDropzone:
  //    - <UploadDropzone accept={props.accept} maxSize={props.maxSize}
  //        onFileSelect={props.onFileSelect} selectedFile={props.pendingFile}
  //        onClear={props.onClearPendingFile} disabled={props.disabled} />
  //
  // 6. Read-only metadata fields:
  //    - mimeType: <Input value={displayMimeType} readOnly />
  //    - size: <Input value={formatBytes(displaySize)} readOnly />
  //    - url: <Input value={displayUrl} readOnly className="font-mono text-xs" />
  //
  // Edge cases:
  // - No file selected yet: show empty state with just URL input + dropzone
  // - URL fetch in progress: show spinner, disable dropzone
  // - URL fetch succeeded: show preview from result, clear dropzone
  // - File uploaded via dropzone: show preview from File, clear URL input
  throw new Error("Not implemented");
}

export type { MediaFileSectionProps, FileMetadata };
```

---

## Step 8: `CreateMediaDialog`

- [ ] Create `packages/admin-next/src/components/CreateMediaDialog.tsx`
- [ ] Run `pnpm --filter @vexcms/admin-next build`

### File: `packages/admin-next/src/components/CreateMediaDialog.tsx`

```typescript
"use client";

import { useMemo, useState, useCallback } from "react";
import type { AnyVexCollection, ClientVexConfig, VexField } from "@vexcms/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from "@vexcms/ui";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { useUrlToFile } from "../hooks/useUrlToFile";
import { MediaFileSection } from "./MediaFileSection";
import { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "@vexcms/core";

interface CreateMediaDialogProps {
  open: boolean;
  onClose: () => void;
  collection: AnyVexCollection;
  config: ClientVexConfig;
  onCreated: (props: { documentId: string }) => void;
}

export function CreateMediaDialog(props: CreateMediaDialogProps) {
  // TODO: implement
  //
  // 1. State:
  //    - pendingFile: File | null (from dropzone or URL download)
  //    - filename: string (editable, auto-populated from file)
  //    - altText: string
  //    - width: number | undefined (auto-populated for images)
  //    - height: number | undefined (auto-populated for images)
  //    - customFieldValues: Record<string, unknown> (for any extra collection fields)
  //    - isCreating: boolean
  //    - error: string | null
  //
  // 2. Hooks:
  //    - urlToFile = useUrlToFile({ maxSize: collection maxSize config or 25MB })
  //    - generateUploadUrl = useMutation(anyApi.vex.media.generateUploadUrl)
  //    - createMediaDocument = useMutation(anyApi.vex.media.createMediaDocument)
  //
  // 3. When urlToFile.result changes (URL fetch succeeded):
  //    - Create a File-like reference for the result (storageId already in storage)
  //    - Auto-populate: filename, mimeType, size from result
  //    - Extract image dimensions if mimeType starts with "image/"
  //      (need to fetch the URL from storage to create an Image element)
  //    - Set pendingFile state or a flag indicating URL-sourced file
  //
  // 4. When pendingFile changes (file selected via dropzone):
  //    - Auto-populate filename from file.name (strip extension for display)
  //    - Extract image dimensions via extractImageDimensions() helper
  //    - Clear URL input (urlToFile.clear())
  //
  // 5. Identify custom fields:
  //    - Get all field entries from collection.config.fields
  //    - Filter out locked fields (storageId, filename, mimeType, size)
  //    - Filter out overridable fields that have dedicated inputs (url, alt, width, height)
  //    - Filter out admin.hidden fields
  //    - Remaining fields get rendered as regular form inputs
  //    - Use AppForm or manual Input components for these
  //
  // 6. Form layout:
  //    <MediaFileSection layout="stacked" ... />
  //    <Input label="Filename" value={filename} onChange={...} />
  //    <Input label="Alt Text" value={altText} onChange={...} />
  //    <Input label="Width" value={width} onChange={...} type="number" />
  //    <Input label="Height" value={height} onChange={...} type="number" />
  //    {customFields.map(...) — render each with appropriate input}
  //
  // 7. handleCreate():
  //    a. If no file (neither pendingFile nor urlToFile.result): show error
  //    b. setIsCreating(true)
  //    c. If file came from dropzone (not URL):
  //       - const uploadUrl = await generateUploadUrl()
  //       - POST file to uploadUrl
  //       - Extract storageId from response
  //    d. If file came from URL: storageId is already in urlToFile.result.storageId
  //    e. Resolve the file URL from storage (or set empty string — same as current pattern)
  //    f. Call createMediaDocument with all fields:
  //       { storageId, filename, mimeType, size, url: "", alt, width, height, ...customFieldValues }
  //    g. props.onCreated({ documentId: result })
  //    h. Reset all state, close dialog
  //
  // 8. Dialog structure matches CreateDocumentDialog:
  //    - 90vw on mobile, 70vw on md, 50vw on lg
  //    - Scrollable content area
  //    - Footer with Cancel + Create buttons
  //
  // Edge cases:
  // - Creating while URL fetch is still in progress: disable Create button
  // - File from URL has no dimensions (not an image): width/height stay undefined
  // - Custom fields with required validation: render error messages
  throw new Error("Not implemented");
}

export type { CreateMediaDialogProps };
```

---

## Step 9: `MediaCollectionEditView`

- [ ] Create `packages/admin-next/src/views/MediaCollectionEditView.tsx`
- [ ] Run `pnpm --filter @vexcms/admin-next build`

### File: `packages/admin-next/src/views/MediaCollectionEditView.tsx`

```typescript
"use client";

import { useMemo, useState, useCallback } from "react";
import type {
  AnyVexCollection,
  ClientVexConfig,
  VexField,
} from "@vexcms/core";
import {
  Button,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Input,
  Label,
} from "@vexcms/ui";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useUrlToFile } from "../hooks/useUrlToFile";
import { MediaFileSection } from "../components/MediaFileSection";
import { DeleteDocumentDialog } from "../components/DeleteDocumentDialog";
import { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "@vexcms/core";

export default function MediaCollectionEditView(props: {
  config: ClientVexConfig;
  collection: AnyVexCollection;
  documentID: string;
}) {
  // TODO: implement
  //
  // This is similar to CollectionEditView but with the media-specific layout.
  //
  // 1. Fetch document reactively (same as CollectionEditView):
  //    useQuery(convexQuery(anyApi.vex.collections.getDocument, { ... }))
  //
  // 2. State:
  //    - pendingFile: File | null (new file staged for upload)
  //    - pendingStorageId: string | null (if file came from URL, already in storage)
  //    - filename: string (initialized from document, editable)
  //    - altText: string
  //    - width: number | undefined
  //    - height: number | undefined
  //    - customFieldValues: Record<string, unknown>
  //    - isSaving: boolean
  //    - deleteOpen: boolean
  //
  // 3. Hooks:
  //    - urlToFile = useUrlToFile({ maxSize })
  //    - generateUploadUrl = useMutation(anyApi.vex.media.generateUploadUrl)
  //    - updateDocument = useMutation(anyApi.vex.collections.updateDocument)
  //
  // 4. Initialize form values from document when it loads:
  //    useEffect → set filename, altText, width, height, customFieldValues from document
  //
  // 5. Layout (top section — side-by-side):
  //    <MediaFileSection layout="side-by-side"
  //      currentFile={{ filename: doc.filename, mimeType: doc.mimeType, size: doc.size, url: doc.url }}
  //      pendingFile={pendingFile}
  //      hasPendingFile={!!pendingFile || !!pendingStorageId}
  //      urlToFile={urlToFile}
  //      ... />
  //
  // 6. Below the file section (full width):
  //    <Input label="Filename" value={filename} onChange={...} />  ← editable
  //    <Input label="Alt Text" value={altText} onChange={...} />
  //    <Input label="Width" value={width} onChange={...} type="number" />
  //    <Input label="Height" value={height} onChange={...} type="number" />
  //    {customFields.map(...) — render remaining collection fields}
  //
  // 7. handleSave():
  //    a. setIsSaving(true)
  //    b. Build changedFields by comparing current values to document values
  //    c. If pendingFile exists (from dropzone):
  //       - Upload: generateUploadUrl() → POST file → extract storageId
  //       - Add to changedFields: storageId, mimeType, size, url: ""
  //    d. If pendingStorageId exists (from URL):
  //       - Add to changedFields: storageId: pendingStorageId, mimeType, size, url: ""
  //    e. If filename changed: add to changedFields
  //    f. If altText/width/height changed: add to changedFields
  //    g. If customFieldValues changed: add to changedFields
  //    h. If no changes: return early
  //    i. await updateDocument({ collectionSlug, documentId, fields: changedFields })
  //    j. Clear pending state, setIsSaving(false)
  //
  // 8. Header with breadcrumbs + Delete + Save buttons
  //    (same pattern as CollectionEditView)
  //
  // Edge cases:
  // - Document not found: show "Document not found" message
  // - Save while URL fetch in progress: disable Save button
  // - File replaced via URL: pendingStorageId set, pendingFile stays null
  // - File replaced via dropzone: pendingFile set, pendingStorageId stays null
  // - User changes filename only (no new file): only filename in changedFields
  throw new Error("Not implemented");
}
```

---

## Step 10: Final Integration + Build Verification

- [ ] Ensure all imports are wired correctly across packages
- [ ] Update `packages/admin-next/src/index.ts` if new views need exporting
- [ ] Run `pnpm --filter @vexcms/core build`
- [ ] Run `pnpm --filter @vexcms/core test`
- [ ] Run `pnpm --filter @vexcms/ui build`
- [ ] Run `pnpm --filter @vexcms/admin-next build`
- [ ] Run test app and verify:
  - [ ] Media collection appears in sidebar
  - [ ] Clicking media collection shows `MediaCollectionsView` with thumbnail table
  - [ ] Create button opens `CreateMediaDialog`
  - [ ] File upload flow works (dropzone → upload → create document)
  - [ ] URL import flow works (paste URL → auto-fetch → preview → create document)
  - [ ] Clicking a media document opens `MediaCollectionEditView`
  - [ ] Edit view shows current file on left, replace options on right
  - [ ] Saving with a new file uploads it and updates the document
  - [ ] Delete works from both list and edit views

## Success Criteria

- [ ] `isMediaCollection()` correctly identifies media vs regular collections (core tests pass)
- [ ] `FilePreview` renders image thumbnails and appropriate icons for other file types
- [ ] `MediaCollectionsView` shows a thumbnail grid table with preview, filename, type, size columns
- [ ] `CreateMediaDialog` supports both file upload and URL import with auto-populated metadata
- [ ] URL auto-fetch works via Convex action with proper error handling
- [ ] `MediaCollectionEditView` shows current file info and allows file replacement with upload-on-save
- [ ] Filename is editable in both create and edit views; mimeType, size, url are read-only
- [ ] Custom collection fields render below the standard media fields
- [ ] All packages build without errors
- [ ] Media functions live in dedicated `media.ts` / `model/media.ts` files
