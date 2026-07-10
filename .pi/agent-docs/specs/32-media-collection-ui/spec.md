# Spec 32b — Media Collection UI: Upload Field, Picker & Library

## Status

Draft (not started)

## Overview

Build the full admin panel UI for media collections. Spec 32 completed all core types, storage adapter integration, and API factories — this spec covers the **React components** that users actually interact with: a proper upload field input (dropzone + resolved media value display), a tabbed modal picker with library grid and inline upload form, table cell rendering for media documents. The upload field stores as `string[]` (media doc IDs) — single-select fields are arrays of one. Multi-select is controlled by the `max` option on upload field config (default: 1). The existing `MediaCollectionListView` already handles list pages with upload modals.

## Code Effect Preview

### `FilePreview` — new component for fetching real image/video thumbnails

Creates a reusable preview component that fetches actual images from storage adapters based on MIME type, falling back to file-type icons for unsupported formats.

**New file:**

```tsx
// packages/react/src/components/media/FilePreview.tsx
export function FilePreview({
  mediaId,
  adapter,
  mimeType,
  size = 64,
}: FilePreviewProps) {
  const { data: url } = useQuery(
    vexConvexApi.media.getUrl({ adapter, mediaId }),
  );

  // Image types → fetch and render <img>
  if (mimeType.startsWith("image/") && mimeType !== "image/svg+xml") {
    return <img src={url} alt="" className="..." onError={showFallbackIcon} />;
  }

  // SVG → show type icon
  if (mimeType === "image/svg+xml") {
    return <Icon name="type" />;
  }

  // Video → show video icon (thumbnail fetch deferred)
  if (mimeType.startsWith("video/")) {
    return <Icon name="video" />;
  }

  // Fallback → file icon
  return <Icon name="file" />;
}
```

### `UploadFieldInput` — stub → field-local modal with direct form state access

The existing Input.tsx stores as `string | undefined` with a basic picker. This spec updates it to store as `string[]`, adds proper states (empty, filled single/multi), and conditionally renders its own MediaPicker using nuqs URL param. Each field's modal only mounts when the URL param matches that field's name.

**Before:**

```tsx
// packages/react/src/components/fields/upload/Input.tsx
export const UploadFieldInput = createFieldInput<
  string | undefined,
  UploadField
>(({ fieldDef, field, readOnly }) => {
  const [showPicker, setShowPicker] = useState(false);
  const value = field.state.value;

  return (
    <>
      {value ? <div>Change</div> : <MediaUploadDropzone />}
      {showPicker && <MediaPicker onSelect={(id) => field.handleChange(id)} />}
    </>
  );
});
```

**After:**

```tsx
// packages/react/src/components/fields/upload/Input.tsx
export const UploadFieldInput = createFieldInput<string[], UploadField>(
  ({ name, fieldDef, field, readOnly }) => {
    const [activeField, setActiveField] = useQueryState(MODALS.selectMedia.urlParam);
    const isOpen = activeField === name; // Only this field's modal opens
    const value = field.state.value || [];

    const openPicker = () => setActiveField(name); // Set URL param to THIS field
    const closePicker = () => setActiveField(null);

    if (value.length === 0) {
      return (
        <>
          <UploadEmpty onPickerOpen={openPicker} />
          {/* Modal only mounts when isOpen === true for THIS field */}
          {isOpen && (
            <MediaPicker
              onSelect={(ids) => { field.handleChange(ids); closePicker(); }}
              onCancel={closePicker}
            />
          )}
        </>
      );
    }

    return (
      <>
        <UploadFilledState mediaIds={value} onReplace={openPicker} />
        {isOpen && <MediaPicker ... />}
      </>
    );
  }
);
```

**Key benefits:**

- Zero performance overhead (React's `{isOpen && <Modal />}` only mounts when true)
- Direct form state access via closure (no localStorage/URL param serialization)
- Refresh resets form to Convex data (correct "undo" behavior)
- Supports nested fields automatically (TanStack Form's `name` prop is unique)

### `MediaLibraryGrid` — client filter → debounced server search

The current implementation uses client-side filtering. This spec updates it to use debounced search with automatic switching between `find` (all docs) and `search` (filtered) queries, matching the relationship field pattern.

**Before:**

```tsx
// packages/react/src/components/media/MediaLibraryGrid.tsx
export function MediaLibraryGrid({ targetCollection, multi, onSelect }) {
  const [search, setSearch] = useState("");
  const { data: mediaItems = [] } = useQuery(
    vexConvexApi.find({ collection: targetCollection, limit: 24 }),
  );

  // Client-side filter
  const filteredItems = search
    ? mediaItems.filter((item) =>
        item.filename.toLowerCase().includes(search.toLowerCase()),
      )
    : mediaItems;

  return <div>{/* Render filteredItems */}</div>;
}
```

**After:**

```tsx
// packages/react/src/components/media/MediaLibraryGrid.tsx
import { useDebounceValue } from "@ts-hooks-kit/core";

export function MediaLibraryGrid({ targetCollection, multi, onSelect }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 200); // 200ms debounce

  // All documents query (when no search)
  const { data: allItems = [] } = useQuery({
    ...vexConvexApi.find({ collection: targetCollection, limit: 24 }),
    enabled: debouncedSearch === "",
  });

  // Search query (when searching)
  const { data: searchItems = [], isPending } = useQuery({
    ...vexConvexApi.search({
      collection: targetCollection,
      query: debouncedSearch,
      searchIndex: `search_${targetCollectionConfig.admin.useAsTitle}`,
      limit: 24,
    }),
    enabled: debouncedSearch.length > 0,
  });

  // Switch between all vs search results
  const displayedItems = debouncedSearch.length > 0 ? searchItems : allItems;

  return (
    <Input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      loading={isPending} // Show spinner during debounce
    />
  );
}
```

**Key improvements:**

- Server-side search (not client-side filter) for large media libraries
- Debounced input (200ms) prevents query spam
- Automatic query switching based on search state
- Loading state during debounce period

### `MediaUploadForm` — uses existing form utilities

Instead of hand-rolling form inputs, use the same `useCollectionForm` + `fieldToInputComponent` pattern as `CollectionEditView`.

**New approach:**

```tsx
// packages/react/src/components/media/MediaUploadForm.tsx
export function MediaUploadForm({ collectionSlug, onComplete }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [uploadedStorageId, setUploadedStorageId] = useState<string | null>(
    null,
  );
  const config = useVexConfig();
  const collection = config.mediaCollections.find(
    (mc) => mc.slug === collectionSlug,
  );

  const form = useCollectionForm({
    collection,
    onSubmit: async ({ value }) => {
      await createMediaDoc({ ...value, storageId: uploadedStorageId });
      onComplete(newDocId);
    },
  });

  if (step === 1) {
    return (
      <MediaUploadDropzone
        onUploadComplete={(id) => {
          setUploadedStorageId(id);
          setStep(2);
        }}
      />
    );
  }

  return (
    <AppForm form={form}>
      <FilePreview mediaId={uploadedStorageId} /> {/* Left preview column */}
      <div>
        {Object.entries(collection.fields).map(([key, field]) => {
          const InputComponent = fieldToInputComponent(field.type);
          return <InputComponent key={key} name={key} fieldDef={field} />;
        })}
      </div>
    </AppForm>
  );
}
```

## API Surface

| Export                         | Package         | Purpose                                                                                            |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------------------- |
| `FilePreview` (new)            | `@vexcms/react` | Fetches and renders media previews (real images for image/\*, icons for others) based on MIME type |
| `UploadFieldInput` (rewritten) | `@vexcms/react` | Upload field input with all states + array storage, supports `max` config for multi-select UI      |
| `UploadEmpty` (new)            | `@vexcms/react` | Empty state component for upload field (dropzone + "Browse media library" button)                  |
| `UploadFilledState` (new)      | `@vexcms/react` | Filled state component (handles both single + multi with `multi` prop)                             |
| `MediaPicker` (rewritten)      | `@vexcms/react` | Tabbed modal with Library + Upload new tabs, single/multi-select support                           |
| `MediaLibraryGrid` (new)       | `@vexcms/react` | Reusable grid component for media library tab (search, MIME filter, pagination)                    |
| `MediaUploadForm` (new)        | `@vexcms/react` | Two-step upload form using `useCollectionForm` + `fieldToInputComponent` pattern                   |
| `UploadFieldCell` (verified)   | `@vexcms/react` | Table cell rendering with real thumbnails via FilePreview + `+N` badges                            |
| `MediaFieldValue` (new)        | `@vexcms/react` | Inline resolved media doc display on edit page with expanded metadata view                         |

## Status / Progress Checklist

- [x] Step 1 — FilePreview component (fetch real images based on MIME type) ✅ **COMPLETE**
- [x] Step 2 — Upload field state components (EmptyInput, FilledInput) + Input.tsx ✅ **COMPLETE**
- [x] Step 3 — MediaLibraryGrid with debounced search ✅ **COMPLETE**
- [ ] Step 4 — MediaPicker modal rewrite (tabbed UI with shadcn Tabs) ⏳ **IN PROGRESS**
- [ ] Step 5 — MediaUploadForm using form utilities (useCollectionForm + fieldToInputComponent)
- [ ] Step 6 — Upload cell component verification (real thumbnails + badges)
- [ ] Step 7 — MediaFieldValue component (inline resolved media doc display)
- [ ] Step 8 — Convert Input.tsx to use nuqs URL param (optional, can defer)

## Implementation Corrections (from current codebase)

The following corrections have been applied in the existing implementation:

1. **API calls:** `vexConvexApi.media.getMediaById()` → `vexConvexApi.get()` (media docs are regular docs)
2. **Property names:** `mediaDoc.sizeBytes` → `mediaDoc.size` (field name in schema)
3. **Icon names:** Capitalized (e.g., `Icon name="Folder"` not `icon name="folder"`)
4. **Multi-select logic:** Uses `fieldDef.hasMany` boolean instead of calculating from `fieldDef.max`
5. **Component naming:** Files named `EmptyInput.tsx` / `FilledInput.tsx`, exports remain `UploadEmpty` / `UploadFilledState`
6. **Adapter prop:** `FilledInput` receives `adapterName` prop (passed from parent)
7. **Media collection:** Uses `VexImage` component for image rendering (existing wrapper)
8. **Icon mapping:** `Grip` (not `drag`), `RefreshCw` (not `refresh`), `X`, `Plus`, `Folder`, `Type`, `Video`, `File`, `Loader`, `Search`, `ListFilter`, `CheckCheck`

## Design Decisions

| #   | Decision (one line)                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Upload field stores as `string[]` (media doc IDs array) — even single-file uploads store as arrays to avoid migrations when switching from single to multi.                                    |
| D2  | Multi-select UI controlled by `field.max` (default: 1) — when `max === 1`, picker is single-select; when `max > 1` or `undefined`, picker is multi-select.                                     |
| D3  | Upload field input is a state machine (Empty → Filled → Uploading → Error → Read-only) — `UploadFilledState` handles both single + multi via `multi` prop.                                     |
| D4  | FilePreview fetches real images for image/\* MIME types — uses `vexConvexApi.media.getUrl` to get storage URLs, falls back to file-type icons for non-images.                                  |
| D5  | Each upload field renders its own MediaPicker conditionally — no global modal needed. Zero performance overhead via React conditional rendering (`{isOpen && <MediaPicker />}`).               |
| D6  | MediaPicker open state tracked via nuqs URL param (`selectMedia=fieldName`) — each field checks if URL param matches its name. Supports nested fields (TanStack Form's `name` prop is unique). |
| D7  | MediaPicker updates form state directly via `field.handleChange()` — no localStorage or complex routing. Refresh resets form to Convex data (correct "undo" behavior).                         |
| D8  | MediaLibraryGrid uses debounced search with `useDebounceValue` — switches between `find` (all docs) and `search` (filtered) queries based on debounced input (200ms).                          |
| D9  | Upload new tab is a two-step form (choose file → document details) — step 2 uses `useCollectionForm` + `fieldToInputComponent` for all collection fields.                                      |
| D10 | MediaUploadForm auto-generates inputs from collection.fields — system fields (alt, caption) + adapter-declared fields render via `fieldToInputComponent`.                                      |
| D11 | UploadFieldCell shows real thumbnail + filename + `+N` badge for multi — uses FilePreview to render actual images, not just icons.                                                             |
| D12 | MediaFieldValue is collapsible (collapsed → expanded) — collapsed shows thumbnail + metadata line, expanded shows full metadata grid.                                                          |
| D13 | MediaCollectionListView already exists — no new list pages needed. It already has CreateMediaModal for uploads.                                                                                |

## Performance Characteristics

### Field-Local Modal Rendering

Each `UploadFieldInput` component includes a `<MediaPicker>` in its JSX:

```tsx
return (
  <>
    <UploadEmpty onPickerOpen={openPicker} />
    {isOpen && <MediaPicker ... />}  // Only renders when isOpen === true
  </>
);
```

**Q: Won't this create duplicate modals and waste compute?**

**A: No!** React's conditional rendering (`{isOpen && ...}`) means:

```tsx
// Example: 3 upload fields on same form
<UploadFieldInput name="featuredImage" />  // Has: {false && <MediaPicker />} → nothing rendered
<UploadFieldInput name="gallery" />        // Has: {true && <MediaPicker />}  → modal rendered
<UploadFieldInput name="thumbnail" />      // Has: {false && <MediaPicker />} → nothing rendered
```

- **Only the field with `isOpen === true` mounts its `MediaPicker`**
- Other fields render `{false && <MediaPicker />}` which is nothing (no DOM nodes, no event listeners, no queries)
- **Zero overhead** — React never calls the MediaPicker function for fields where `isOpen === false`

When the modal closes (URL param cleared), all fields render `{false && <MediaPicker />}` again (nothing).

### Why This is Better Than Alternatives

| Approach                    | Performance          | Complexity         | Refresh Behavior         |
| --------------------------- | -------------------- | ------------------ | ------------------------ |
| **Field-local (this spec)** | ✅ Zero overhead     | ✅ Simple          | ✅ Correct (resets form) |
| Single global modal         | ✅ One modal         | ❌ Complex routing | ✅ Correct               |
| localStorage for state      | ✅ Zero overhead     | ❌ Serialization   | ❌ Wrong (persists)      |
| URL param for data          | ❌ URL length limits | ❌ Serialization   | ❌ Wrong (persists)      |

## Out of Scope

| Feature                                      | Cross-reference | Why deferred                                                                                  |
| -------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| Pagination implementation in `find` function | Future spec     | This UI uses `find` with `limit`/`offset`. Full pagination UX deferred.                       |
| Media transformations (resize, crop, rotate) | Future spec     | Complex image processing, not needed for v1.                                                  |
| CDN URL generation                           | Future spec     | Convex storage URLs are sufficient for now.                                                   |
| Image optimization (WebP, responsive srcset) | Future spec     | Can be added via Next.js Image component later.                                               |
| Bulk upload / drag-and-drop multiple files   | Future spec     | Single-file upload is sufficient for v1. Batch handled by `Promise.all` on single-file calls. |
| File type restrictions per upload field      | Future spec     | MIME type validation can be added later.                                                      |
| Max file size per upload field               | Future spec     | Global limits via Convex storage are sufficient.                                              |
| Video/audio file handling beyond icons       | Future spec     | Image-focused for maprios v1. Video thumbnails deferred.                                      |
| Inspector panel for media detail pages       | Future spec     | MediaCollectionListView shows table. Inspector panel for inline editing deferred.             |
| Central `/admin/media` hub dashboard         | Future spec     | MediaCollectionListView per collection is sufficient. Unified hub deferred.                   |

## Target Directory Structure

```
packages/react/src/
  components/
    media/
      FilePreview.tsx                   🟡 NEW — Fetch + render media previews based on MIME type
      MediaFieldValue.tsx               🟡 NEW — Inline resolved media doc display on edit page
      MediaPicker.tsx                   🟡 MODIFY — Full rewrite: tabbed modal matching designs
      MediaLibraryGrid.tsx              🟡 NEW — Reusable grid component for library tab
      MediaUploadForm.tsx               🟡 NEW — Two-step form using useCollectionForm + fieldToInputComponent
      MediaUploadDropzone.tsx           ✅ KEEP — Functional, integrates into modal tabs
    fields/upload/
      Input.tsx                         🟡 MODIFY — Full rewrite: state machine, array storage, all states
      Cell.tsx                          🟡 VERIFY — Ensure uses FilePreview for real thumbnails + badges
      UploadEmpty.tsx                   🟡 NEW — Empty state component (dropzone + browse button)
      UploadFilledState.tsx             🟡 NEW — Filled state (single + multi via `multi` prop)
    views/
      MediaCollectionListView.tsx       ✅ KEEP — Already exists with CreateMediaModal
```

## Step 1 — FilePreview component (fetch real images based on MIME type) [dev]

Create a reusable `FilePreview` component that fetches actual images/videos from storage adapters and falls back to file-type icons for unsupported formats.

### Files to create

- [ ] `packages/react/src/components/media/FilePreview.tsx` (NEW)

### `packages/react/src/components/media/FilePreview.tsx` (NEW)

```tsx
import { useQuery } from "@tanstack/react-query";
import { vexConvexApi } from "@vexcms/core";
import { Icon } from "../ui/icon";

/**
 * Props for the FilePreview component.
 */
export interface FilePreviewProps {
  /** The media document ID. */
  mediaId: string;
  /** The storage adapter name. */
  adapter: string;
  /** The MIME type of the media file. */
  mimeType: string;
  /** The size of the preview (width/height in pixels). Default: 64. */
  size?: number;
  /** Border radius in pixels. Default: 3. */
  radius?: number;
  /** Whether to show dimension chip overlay. Default: false. */
  showDimensions?: boolean;
  /** Width/height for dimension chip (optional). */
  dimensions?: { width: number; height: number };
  /** Alt text for the image (accessibility). */
  alt?: string;
  /** Optional className for the wrapper. */
  className?: string;
}

/**
 * File preview component that fetches and renders media previews based on MIME type.
 *
 * Behavior by MIME type:
 * - `image/*` (except SVG): Fetches URL via `vexConvexApi.media.getUrl`, renders `<img>`.
 * - `image/svg+xml`: Shows type icon (SVG is vector, not raster).
 * - `video/*`: Shows video icon (thumbnail fetch deferred to future spec).
 * - Other: Shows generic file icon.
 *
 * Falls back to file icon on image load error (403, 5xx).
 *
 * @param props - Component props.
 */
export function FilePreview({
  mediaId,
  adapter,
  mimeType,
  size = 64,
  radius = 3,
  showDimensions = false,
  dimensions,
  alt = "",
  className = "",
}: FilePreviewProps) {
  const { data: url, isLoading } = useQuery(
    vexConvexApi.media.getUrl({ adapter, mediaId }),
  );

  const isSvg = mimeType === "image/svg+xml";
  const isImage = mimeType.startsWith("image/") && !isSvg;
  const isVideo = mimeType.startsWith("video/");

  const wrapperStyle = {
    width: size,
    height: size,
    borderRadius: radius,
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
        style={wrapperStyle}
      >
        <Icon
          name="loader"
          size={size * 0.3}
          className="animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  // Image types (except SVG) → fetch and render <img>
  if (isImage && url) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={wrapperStyle}
      >
        <img
          src={url}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to file icon on load error
            const wrapper = e.currentTarget.parentElement;
            if (wrapper) {
              wrapper.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"><svg width="${size * 0.3}" height="${size * 0.3}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg></div>`;
            }
          }}
        />
        {showDimensions && dimensions && (
          <div
            className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[8px] text-white"
            style={{ letterSpacing: 0.2 }}
          >
            {dimensions.width}×{dimensions.height}
          </div>
        )}
      </div>
    );
  }

  // SVG → show type icon
  if (isSvg) {
    return (
      <div
        className={`flex items-center justify-center bg-muted relative ${className}`}
        style={wrapperStyle}
      >
        <Icon name="type" size={size * 0.3} className="text-muted-foreground" />
        {showDimensions && dimensions && (
          <div className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[8px] text-white">
            {dimensions.width}×{dimensions.height}
          </div>
        )}
      </div>
    );
  }

  // Video → show video icon (thumbnail fetch deferred)
  if (isVideo) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
        style={wrapperStyle}
      >
        <Icon
          name="video"
          size={size * 0.3}
          className="text-muted-foreground"
        />
      </div>
    );
  }

  // Fallback → generic file icon
  return (
    <div
      className={`flex items-center justify-center bg-muted ${className}`}
      style={wrapperStyle}
    >
      <Icon name="file" size={size * 0.3} className="text-muted-foreground" />
    </div>
  );
}
```

### Edge-case notes

> **Edge: Media doc URL fails to load (403, 5xx).** Show fallback file icon instead of broken image (handled by `<img onError>` handler).

> **Edge: Media doc is soft-deleted.** FilePreview will still attempt to fetch URL — caller should check `mediaDoc._deleted` and render "Deleted" badge overlay.

> **Edge: Media doc is from a different storage adapter.** Caller must pass correct `adapter` prop from `mediaDoc.meta.storageAdapter`.

### Run tests

```bash
pnpm --filter @vexcms/react test
```

## Step 2 — Upload field state components + rewrite Input.tsx ✅ **COMPLETE** [dev]

Rewrite `UploadFieldInput` to support all design states. The field stores as array of media doc IDs (`string[]`). Create two sub-components: `UploadEmpty` (dropzone + browse button) and `UploadFilledState` (handles both single + multi via `fieldDef.hasMany` prop).

### Files created ✅

- [x] `packages/react/src/components/fields/upload/EmptyInput.tsx` (NEW) — Exports `UploadEmpty`
- [x] `packages/react/src/components/fields/upload/FilledInput.tsx` (NEW) — Exports `UploadFilledState`
- [x] `packages/react/src/components/fields/upload/Input.tsx` (MODIFY) — State machine with array storage

### Current implementation notes

**EmptyInput.tsx:**

- Uses `MediaUploadDropzone` for file upload
- "Browse media library" button opens picker via `onPickerOpen` callback
- Passes `targetCollection` and `adapterName` props correctly

**FilledInput.tsx:**

- `UploadItemRow` uses `vexConvexApi.get({ id: mediaId })` (NOT `media.getMediaById`)
- Uses `mediaDoc.size` property (NOT `sizeBytes`)
- Multi-select logic uses `fieldDef.hasMany` boolean
- Receives `adapterName` prop from parent
- Icons: `Grip`, `RefreshCw`, `X`, `Plus`, `Folder`

**Input.tsx:**

- Currently uses `useState` for modal open/close
- Needs conversion to nuqs URL param (Step 3)
- Correctly passes `fieldDef` prop to `UploadFilledState`
- Uses `fieldDef.hasMany` for multi-select logic

## Step 3 — MediaLibraryGrid with debounced search ✅ **COMPLETE** [dev]

Implemented with `useDebounceValue` from `@ts-hooks-kit/core`, automatic query switching between `find` (all docs) and `search` (filtered), and loading state during debounce.

### Files completed ✅

- [x] `packages/react/src/components/media/MediaLibraryGrid.tsx` (COMPLETE) — Uses debounced search, switches between find/search queries

## Step 4 — MediaPicker modal rewrite (tabbed UI with shadcn Tabs) ⏳ **IN PROGRESS** [dev]

Rewrite `MediaPicker` to use shadcn/ui Tabs component (ARIA-compliant Base UI primitives) instead of custom tab state management. Add Library + Upload new tabs matching designs.

**Important:** Per `developer-preferences.md` — **Always use shadcn/ui components for UI patterns**. All UI components are built on shadcn/ui (Base UI primitives). Never write custom tab implementations when shadcn Tabs exists.

### Files to modify

- [ ] Install shadcn Tabs component (if not present): `npx shadcn@latest add tabs`
- [ ] `packages/react/src/components/media/MediaPicker.tsx` (MODIFY) — Replace custom tab state with shadcn Tabs component

### `packages/react/src/components/fields/upload/UploadEmpty.tsx` (NEW)

```tsx
import { Button } from "../../ui/button";
import { Icon } from "../../ui/icon";
import { MediaUploadDropzone } from "../../media/MediaUploadDropzone";
import type { StorageAdapterSlug } from "@vexcms/core";

/**
 * Props for UploadEmpty component.
 */
export interface UploadEmptyProps {
  /** Callback to open the media picker modal. */
  onPickerOpen: () => void;
  /** Callback when a file is uploaded via dropzone. */
  onFileUpload: (mediaId: string) => void;
  /** The media collection slug for the upload. */
  targetCollection: string;
  /** The storage adapter name. */
  adapterName: StorageAdapterSlug;
}

/**
 * Empty state for upload field — shows dropzone and "Browse media library" button.
 *
 * Matches the `UploadEmpty` design: dropzone with drag-active state + "Browse media library" ghost button below.
 *
 * @param props - Component props.
 */
export function UploadEmpty({
  onPickerOpen,
  onFileUpload,
  targetCollection,
  adapterName,
}: UploadEmptyProps) {
  return (
    <div className="flex flex-col gap-2">
      <MediaUploadDropzone
        targetCollection={targetCollection}
        adapterName={adapterName}
        onUploadComplete={onFileUpload}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onPickerOpen}
        className="self-start"
      >
        <Icon name="folder" size={12} />
        Browse media library
      </Button>
    </div>
  );
}
```

### `packages/react/src/components/fields/upload/UploadFilledState.tsx` (NEW)

```tsx
import { Button } from "../../ui/button";
import { Icon } from "../../ui/icon";
import { useQuery } from "@tanstack/react-query";
import { vexConvexApi } from "@vexcms/core";
import { FilePreview } from "../../media/FilePreview";

/**
 * Props for UploadFilledState component.
 */
export interface UploadFilledStateProps {
  /** Array of media document IDs. */
  mediaIds: string[];
  /** Whether this is multi-select mode (shows "Add image" button + count). */
  multi: boolean;
  /** Maximum number of items allowed (optional, for multi mode). */
  max?: number;
  /** Callback to open picker in replace mode. */
  onReplace: () => void;
  /** Callback to remove a specific media ID (or all if no ID provided). */
  onRemove: (mediaId?: string) => void;
  /** Callback to open picker in add mode (multi only). */
  onAdd?: () => void;
  /** The media collection slug. */
  targetCollection: string;
}

/**
 * Filled state for upload field — handles both single and multi modes.
 *
 * Single mode (`multi === false`):
 * - Renders one item row with FilePreview thumbnail + Replace/Remove actions
 * - Matches the `UploadItemRow` design
 *
 * Multi mode (`multi === true`):
 * - Renders list of item rows + "Add image" / "Browse library" buttons + count display
 * - Matches the `UploadMulti` design
 *
 * @param props - Component props.
 */
export function UploadFilledState({
  mediaIds,
  multi,
  max,
  onReplace,
  onRemove,
  onAdd,
  targetCollection,
}: UploadFilledStateProps) {
  const atLimit = max !== undefined && mediaIds.length >= max;

  return (
    <div className="flex flex-col gap-2">
      <div className="vex-upload-list">
        {mediaIds.map((id) => (
          <UploadItemRow
            key={id}
            mediaId={id}
            onRemove={() => onRemove(id)}
            onReplace={multi ? undefined : onReplace}
            targetCollection={targetCollection}
          />
        ))}
      </div>

      {multi && onAdd && (
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={atLimit}
          >
            <Icon name="plus" size={12} />
            Add image
          </Button>
          <Button variant="ghost" size="sm" onClick={onAdd} disabled={atLimit}>
            <Icon name="folder" size={12} />
            Browse library
          </Button>
          {max && (
            <span
              className={`ml-auto font-mono text-[11px] ${
                atLimit ? "text-warning" : "text-muted-foreground"
              }`}
            >
              {mediaIds.length}/{max}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual item row in upload field.
 *
 * @param props - Component props.
 */
function UploadItemRow({
  mediaId,
  onRemove,
  onReplace,
  targetCollection,
}: {
  mediaId: string;
  onRemove: () => void;
  onReplace?: () => void;
  targetCollection: string;
}) {
  const { data: mediaDoc } = useQuery(
    vexConvexApi.media.getMediaById({ id: mediaId }),
  );

  if (!mediaDoc) {
    return (
      <div className="vex-upload-item">
        <div className="h-11 w-11 animate-pulse rounded bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const mimeShort = (mediaDoc.mimeType.split("/")[1] || mediaDoc.mimeType)
    .toUpperCase()
    .replace("SVG+XML", "SVG")
    .replace("JPEG", "JPG");
  const sizeKB = (mediaDoc.sizeBytes / 1024).toFixed(1);

  return (
    <div className="vex-upload-item">
      <span className="grip">
        <Icon name="drag" size={13} />
      </span>
      <FilePreview
        mediaId={mediaId}
        adapter={mediaDoc.meta.storageAdapter}
        mimeType={mediaDoc.mimeType}
        size={44}
        radius={3}
        alt={mediaDoc.alt || mediaDoc.filename}
      />
      <div className="meta">
        <div className="name">{mediaDoc.filename}</div>
        <div className="sub">
          {mimeShort} · {sizeKB} KB
          {mediaDoc.dimensions &&
            ` · ${mediaDoc.dimensions.width}×${mediaDoc.dimensions.height}`}
        </div>
      </div>
      <div className="alt">
        <span className="alt-lbl">ALT</span>
        <span className="alt-val">
          {mediaDoc.alt || <em className="text-destructive">Missing</em>}
        </span>
      </div>
      <div className="acts">
        {onReplace && (
          <button
            className="vex-btn ghost icon sm"
            type="button"
            title="Replace"
            onClick={onReplace}
          >
            <Icon name="refresh" size={13} />
          </button>
        )}
        <button
          className="vex-btn ghost icon sm"
          type="button"
          title="Remove"
          onClick={onRemove}
        >
          <Icon name="x" size={13} />
        </button>
      </div>
    </div>
  );
}
```

### `packages/react/src/components/modals/constants.ts` (MODIFY)

Add `selectMedia` entry to MODALS constant for tracking which upload field's picker is open.

```tsx
/**
 * Registry of all admin modal definitions.
 */
export const MODALS = {
  createDocument: {
    urlParam: "createNew",
    label: "Create",
  },
  uploadMedia: {
    urlParam: "upload",
    label: "Upload",
  },
  selectMedia: {
    /** URL param that stores the field name of the active media picker. */
    urlParam: "selectMedia",
    label: "Select",
  },
} as const;

export type ModalURLParam = (typeof MODALS)[keyof typeof MODALS]["urlParam"];
```

### `packages/react/src/components/fields/upload/Input.tsx` (MODIFY)

Full rewrite — state machine dispatcher that routes to `UploadEmpty` or `UploadFilledState` based on `value.length` and `field.max`. Each field conditionally renders its own MediaPicker using nuqs URL param. Changes storage from `string | undefined` to `string[]`.

```tsx
"use client";

import { useQueryState } from "nuqs";
import type { StorageAdapterSlug, UploadField } from "@vexcms/core";
import { createFieldInput } from "../../form";
import { MediaPicker } from "../../media";
import { useVexConfig } from "../../../context";
import { UploadEmpty } from "./UploadEmpty";
import { UploadFilledState } from "./UploadFilledState";
import { MODALS } from "../../modals/constants";

/**
 * Upload field input with all states + array storage.
 *
 * Supports:
 * - Empty state (dropzone + "Browse media library" button)
 * - Filled state (single or multi, handled by UploadFilledState component)
 * - Multi-select controlled by `field.max` (default: 1)
 * - Stores as `string[]` — single-select fields are arrays of one
 * - Each field renders its own MediaPicker conditionally (zero performance overhead)
 * - Picker open state tracked via nuqs URL param (supports nested fields via unique TanStack Form names)
 *
 * @param props — Field input component props.
 * @returns The upload field input element.
 */
export const UploadFieldInput = createFieldInput<string[], UploadField>(
  ({ name, fieldDef, field, readOnly }) => {
    const [activeField, setActiveField] = useQueryState(
      MODALS.selectMedia.urlParam,
    );
    const isOpen = activeField === name; // Only this field's modal opens when URL param matches
    const value = field.state.value || [];
    const config = useVexConfig();

    // Get adapter name from the target media collection's meta.storageAdapter
    const adapterName: StorageAdapterSlug =
      config.mediaCollections.find((mc) => mc.slug === fieldDef.to)?.meta
        ?.storageAdapter ?? "convex";

    const isSingleSelect = fieldDef.max === 1;

    const openPicker = () => setActiveField(name); // Set URL param to THIS field's name
    const closePicker = () => setActiveField(null); // Clear URL param

    const handleSelect = (mediaIds: string[]) => {
      field.handleChange(mediaIds); // Direct form state update!
      closePicker();
    };

    const handleAdd = (mediaIds: string[]) => {
      field.handleChange([...value, ...mediaIds]); // Append to existing
      closePicker();
    };

    const handleRemove = (mediaId?: string) => {
      if (mediaId) {
        field.handleChange(value.filter((id) => id !== mediaId));
      } else {
        field.handleChange([]);
      }
    };

    if (readOnly) {
      return value.length > 0 ? (
        <UploadFilledState
          mediaIds={value}
          multi={!isSingleSelect}
          max={fieldDef.max}
          onReplace={() => {}}
          onRemove={() => {}}
          targetCollection={fieldDef.to}
        />
      ) : (
        <div className="text-sm text-muted-foreground">—</div>
      );
    }

    // Empty state
    if (value.length === 0) {
      return (
        <>
          <UploadEmpty
            onPickerOpen={openPicker}
            onFileUpload={(mediaId) => field.handleChange([mediaId])}
            targetCollection={fieldDef.to}
            adapterName={adapterName}
          />
          {/* Modal only mounts when isOpen === true for THIS field */}
          {isOpen && (
            <MediaPicker
              targetCollection={fieldDef.to}
              adapterName={adapterName}
              multi={!isSingleSelect}
              onSelect={handleSelect}
              onCancel={closePicker}
            />
          )}
        </>
      );
    }

    // Filled state (single or multi)
    return (
      <>
        <UploadFilledState
          mediaIds={value}
          multi={!isSingleSelect}
          max={fieldDef.max}
          onReplace={openPicker} // Replace mode = single select
          onRemove={handleRemove}
          onAdd={openPicker} // Add mode = multi select
          targetCollection={fieldDef.to}
        />
        {/* Modal only mounts when isOpen === true for THIS field */}
        {isOpen && (
          <MediaPicker
            targetCollection={fieldDef.to}
            adapterName={adapterName}
            multi={!isSingleSelect}
            onSelect={
              value.length === 0 || !isSingleSelect ? handleAdd : handleSelect
            }
            onCancel={closePicker}
          />
        )}
      </>
    );
  },
);
```

### Edge-case notes

> **Edge: Upload field with `max === 1` but value is array of multiple IDs.** This shouldn't happen if config validation works, but defensively show only the first item in single-select mode (handled by `UploadFilledState` iteration).

> **Edge: Upload field with `max > 1` but user tries to add more than max.** Disable "Add image" button when `mediaIds.length >= max` (handled in `UploadFilledState`).

> **Edge: Upload field in read-only mode.** Show filled state with no interactive actions (handled by `readOnly` check in Input.tsx).

> **Edge: Multiple upload fields on same form, user opens multiple pickers.** Only the field whose name matches the URL param renders its modal. All others render `{false && <MediaPicker />}` (nothing). Zero DOM overhead.

> **Edge: Nested upload fields with same name at different array indices.** TanStack Form gives unique names: `gallery.0`, `gallery.1`, `blocks.2.image`. Each gets its own URL param value.

> **Edge: User refreshes page while modal is open.** URL param persists but form state resets to Convex data. Modal closes automatically (no field name matches the stale URL param). Correct "undo" behavior.

> **Edge: User clicks browser back/forward with modal open.** nuqs syncs URL param state, so modal open state follows navigation history. Form state is unaffected (still managed by TanStack Form).

### Run tests

```bash
pnpm --filter @vexcms/react test
```

## Step 3 — Media picker modal rewrite (tabbed UI matching designs) [dev]

Rewrite `MediaPicker` to match the `MediaModalShell` design with Library + Upload new tabs. The modal adapts its behavior based on `multi` prop (single-select vs multi-select).

### Files to create / modify

- [ ] `packages/react/src/components/media/MediaLibraryGrid.tsx` (NEW)
- [ ] `packages/react/src/components/media/MediaPicker.tsx` (MODIFY)

### `packages/react/src/components/media/MediaLibraryGrid.tsx` (NEW)

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "@ts-hooks-kit/core";
import { vexConvexApi } from "@vexcms/core";
import type { VexMediaDocument } from "@vexcms/core";
import { Button, Input, Icon } from "../ui";
import { FilePreview } from "./FilePreview";
import { useVexConfig } from "../../context";

/**
 * Props for the MediaLibraryGrid component.
 */
export interface MediaLibraryGridProps {
  /** The media collection slug. */
  targetCollection: string;
  /** Whether to allow multi-select (checkmarks on multiple items). */
  multi: boolean;
  /** Callback when user selects items (single or multiple IDs). */
  onSelect: (ids: string[]) => void;
  /** Currently selected media IDs (for checkmark display). */
  selectedIds?: string[];
}

/**
 * Reusable grid component for media library tab.
 *
 * Shows thumbnails with filename + MIME/size metadata. Supports single/multi-select
 * with checkmarks, debounced search (switches between `find` and `search` queries),
 * MIME type filter button (TODO), and pagination.
 *
 * Matches the `MediaPicker` / `MediaModalLibrary` design: search bar + Type filter button,
 * 4-column grid with tiles showing FilePreview + filename + metadata.
 *
 * Search behavior follows relationship field pattern:
 * - Debounces input by 200ms
 * - Uses `find` query when search is empty (all documents)
 * - Uses `search` query when search has value (filtered results)
 * - Shows loading state via `isPending` during debounce
 *
 * @param props - Component props.
 */
export function MediaLibraryGrid({
  targetCollection,
  multi,
  onSelect,
  selectedIds = [],
}: MediaLibraryGridProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 200);
  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);
  const config = useVexConfig();

  const targetCollectionConfig = config.mediaCollections.find(
    (mc) => mc.slug === targetCollection,
  );
  const searchIndex = `search_${targetCollectionConfig?.admin.useAsTitle}`;

  // All documents query (when no search)
  const { data: allItems = [] } = useQuery<VexMediaDocument[]>({
    ...vexConvexApi.find({ collection: targetCollection, limit, offset }),
    enabled: debouncedSearch === "",
  });

  // Search query (when searching)
  const { data: searchItems = [], isPending } = useQuery<VexMediaDocument[]>({
    ...vexConvexApi.search({
      collection: targetCollection,
      query: debouncedSearch,
      searchIndex,
      limit,
    }),
    enabled: debouncedSearch.length > 0 && !!targetCollectionConfig,
  });

  // Switch between all vs search results
  const displayedItems = debouncedSearch.length > 0 ? searchItems : allItems;

  const handleItemClick = (id: string) => {
    if (multi) {
      const newSelection = selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id];
      onSelect(newSelection);
    } else {
      onSelect([id]);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 px-5 pb-3 pt-3.5">
        <div className="vex-input-wrap has-leading flex-1">
          <span className="leading">
            <Icon name="Search" size={13} />
          </span>
          <Input
            className="vex-input sm"
            placeholder={`Search ${targetCollection} by filename or alt…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            loading={isPending}
          />
        </div>
        <Button variant="outline" size="sm">
          <Icon name="ListFilter" size={12} />
          Type
        </Button>
      </div>
      <div className="max-h-[320px] overflow-y-auto px-5 pb-1">
        {displayedItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {isPending
              ? "Searching…"
              : debouncedSearch
                ? "No media files match your search"
                : "No media files yet"}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {displayedItems.map((doc) => {
              const isSel = selectedIds.includes(doc._id);
              const mimeShort = (doc.mimeType.split("/")[1] || doc.mimeType)
                .toUpperCase()
                .replace("SVG+XML", "SVG")
                .replace("JPEG", "JPG");
              const sizeDisplay =
                doc.size < 1024
                  ? `${doc.size} B`
                  : doc.size < 1024 * 1024
                    ? `${(doc.size / 1024).toFixed(0)} KB`
                    : `${(doc.size / (1024 * 1024)).toFixed(1)} MB`;

              return (
                <button
                  key={doc._id}
                  type="button"
                  className={`vex-media-tile${isSel ? " selected" : ""}`}
                  onClick={() => handleItemClick(doc._id)}
                >
                  <div className="thumb">
                    <FilePreview
                      mediaId={doc._id}
                      adapter={targetCollectionConfig!.meta.storageAdapter}
                      mimeType={doc.mimeType}
                      size={120}
                      radius={4}
                      alt={doc.alt || doc.filename}
                    />
                    {isSel && (
                      <span className="check">
                        <Icon name="CheckCheck" size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="fname">{doc.filename}</div>
                  <div className="fmeta">
                    {mimeShort} · {sizeDisplay}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {displayedItems.length >= limit && (
        <div className="px-5 pb-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(offset + limit)}
          >
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
```

### `packages/react/src/components/media/MediaPicker.tsx` (MODIFY)

Full rewrite — use shadcn/ui Tabs component for ARIA-compliant tabbed interface. Matches the `MediaModalShell` design structure with Library + Upload new tabs.

**Install Tabs component first (if not present):**

```bash
npx shadcn@latest add tabs
```

```tsx
"use client";

import { useState } from "react";
import type { StorageAdapterSlug } from "@vexcms/core";
import { Dialog, DialogContent } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Icon, Button } from "../ui";
import { MediaLibraryGrid } from "./MediaLibraryGrid";

/**
 * Props for the MediaPicker component.
 */
interface MediaPickerProps {
  /** The slug of the target media collection. */
  targetCollection: string;
  /** The adapter name — comes from the target media collection's `meta.storageAdapter`. */
  adapterName: StorageAdapterSlug;
  /** Whether to allow multi-select (checkmarks on multiple items). */
  multi: boolean;
  /** Callback invoked when user selects items (single or multiple IDs). */
  onSelect: (mediaIds: string[]) => void;
  /** Callback invoked when the picker is cancelled. */
  onCancel: () => void;
}

/**
 * Media picker modal with tabbed UI (Library + Upload new).
 *
 * Uses shadcn/ui Tabs component (Base UI primitives) for ARIA-compliant tab navigation.
 *
 * Adapts behavior based on `multi`:
 * - Single-select (`multi === false`): checkmark on one item only, "Select" button.
 * - Multi-select (`multi === true`): checkmarks on multiple items, "N selected" + "Select" button.
 *
 * Matches the `MediaModalShell` design: modal header with icon + title + close, tabs, content area, footer.
 *
 * @param props — Media picker component props.
 */
export function MediaPicker({
  targetCollection,
  adapterName,
  multi,
  onSelect,
  onCancel,
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = () => {
    onSelect(selectedIds);
    setSelectedIds([]);
  };

  const handleUploadComplete = (mediaId: string) => {
    onSelect([mediaId]);
    setSelectedIds([]);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="vex-modal max-w-[760px]">
        <div className="vex-modal-head items-center pb-0">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Image" size={16} />
          </div>
          <div className="text">
            <h2>Select media</h2>
            <p className="sub">
              Relationship → <span className="mono">{targetCollection}</span>{" "}
              media collection
            </p>
          </div>
          <button className="close" onClick={onCancel}>
            <Icon name="X" size={14} />
          </button>
        </div>

        <Tabs defaultValue="library" className="mt-3">
          <TabsList className="mx-5">
            <TabsTrigger value="library">
              <Icon name="Folder" size={13} className="mr-1.5" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Icon name="Plus" size={13} className="mr-1.5" />
              Upload new
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-0">
            <MediaLibraryGrid
              targetCollection={targetCollection}
              multi={multi}
              onSelect={setSelectedIds}
              selectedIds={selectedIds}
            />
            <div className="vex-modal-foot">
              <span className="left">
                {selectedIds.length}{" "}
                {multi || selectedIds.length === 0 ? "selected" : "selected"}
              </span>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSelect}
                disabled={selectedIds.length === 0}
              >
                {multi && selectedIds.length > 1
                  ? `Select ${selectedIds.length}`
                  : "Select"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <div className="p-5">
              <p className="text-muted-foreground">
                Upload new tab will use MediaUploadForm component (Step 5)
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Edge-case notes

> **Edge: Media collection is empty.** Show "No media files yet" message in Library tab (handled by empty state in `MediaLibraryGrid`). Still allow upload via Upload new tab.

> **Edge: Search returns no results.** Show "No media files match your search" message (handled by empty state in `MediaLibraryGrid`).

> **Edge: User opens picker, switches tabs.** Preserve the `selectedIds` state so switching tabs doesn't lose progress (handled by component-level state in `MediaPicker`).

### Run tests

```bash
pnpm --filter @vexcms/react test
```

## Step 4 — MediaUploadForm using form utilities [dev]

Create `MediaUploadForm` component that uses `useCollectionForm` + `fieldToInputComponent` pattern (same as `CollectionEditView`) to auto-generate form inputs from the media collection's field config.

### Files to create

- [ ] `packages/react/src/components/media/MediaUploadForm.tsx` (NEW)

### `packages/react/src/components/media/MediaUploadForm.tsx` (NEW)

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { MediaCollectionConfig, StorageAdapterSlug } from "@vexcms/core";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { MediaUploadDropzone } from "./MediaUploadDropzone";
import { FilePreview } from "./FilePreview";
import { AppForm } from "../form/AppForm";
import { fieldToInputComponent } from "../fields";
import { useCollectionForm } from "../../hooks/useCollectionForm";

/**
 * Props for MediaUploadForm component.
 */
export interface MediaUploadFormProps {
  /** The media collection configuration. */
  collection: MediaCollectionConfig;
  /** The storage adapter name. */
  adapterName: StorageAdapterSlug;
  /** Callback when upload + create completes, receives media doc ID. */
  onComplete: (mediaId: string) => void;
  /** Callback to go back to Library tab. */
  onBack: () => void;
}

/**
 * Two-step upload form for picker's "Upload new" tab.
 *
 * Step 1: Choose file (dropzone + "Choose file" button).
 * Step 2: Document details (preview + editable fields using `useCollectionForm` + `fieldToInputComponent`).
 *
 * Matches the `MediaModalUploadEmpty` (step 1) and `MediaModalCreateForm` (step 2) designs.
 * Uses the same form pattern as `CollectionEditView` — auto-generates inputs from `collection.fields`.
 *
 * @param props - Component props.
 */
export function MediaUploadForm({
  collection,
  adapterName,
  onComplete,
  onBack,
}: MediaUploadFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [uploadedStorageId, setUploadedStorageId] = useState<string | null>(
    null,
  );
  const [uploadedMimeType, setUploadedMimeType] = useState<string>("");

  const { mutateAsync: createMediaDoc, isPending } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.createMediaDocument),
  });

  const form = useCollectionForm({
    // @ts-expect-error — MediaCollectionConfig is compatible with CollectionConfig for form purposes
    collection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: async ({ value }: { value: any }) => {
      if (!uploadedStorageId) return;
      const newDocId = await createMediaDoc({
        collectionSlug: collection.slug,
        storageId: uploadedStorageId,
        ...value,
      });
      onComplete(newDocId);
      setStep(1);
      setUploadedStorageId(null);
    },
  });

  const handleFileUpload = (storageId: string) => {
    setUploadedStorageId(storageId);
    // TODO: Extract MIME type from upload response
    setUploadedMimeType("image/jpeg");
    setStep(2);
  };

  const handleBackClick = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onBack();
    }
  };

  if (step === 1) {
    return (
      <>
        <div className="p-5">
          <div className="vex-dropzone" style={{ padding: "40px 20px" }}>
            <div className="ico">
              <Icon name="image" size={18} />
            </div>
            <div className="title">Drag a file here, or choose one</div>
            <div className="sub">
              PNG, JPG, SVG, WebP · up to 10 MB · stored via the {adapterName}{" "}
              adapter
            </div>
            <MediaUploadDropzone
              targetCollection={collection.slug}
              adapterName={adapterName}
              onUploadComplete={handleFileUpload}
            />
          </div>
        </div>
        <div className="vex-modal-foot">
          <span className="left">Step 1 of 2 · choose a file</span>
          <Button variant="ghost" onClick={onBack}>
            Cancel
          </Button>
          <Button disabled className="disabled">
            Create &amp; select
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid max-h-[420px] grid-cols-[220px_1fr] gap-5 overflow-y-auto p-5">
        {/* Preview + derived metadata (left column) */}
        <div className="flex flex-col gap-2.5">
          {uploadedStorageId && (
            <FilePreview
              mediaId={uploadedStorageId}
              adapter={adapterName}
              mimeType={uploadedMimeType}
              size={220}
              radius={4}
              alt=""
            />
          )}
          {isPending && (
            <div className="vex-progress">
              <span style={{ width: "62%" }} />
            </div>
          )}
          <div className="vex-derived">
            <div className="row">
              <span className="k">Type</span>
              <span className="v mono">{uploadedMimeType}</span>
            </div>
            <div className="row">
              <span className="k">Storage ID</span>
              <span className="v mono">{uploadedStorageId?.slice(0, 12)}…</span>
            </div>
          </div>
          <div className="text-[10.5px] leading-snug text-muted-foreground">
            Auto-detected from the file. Written to the media document on save.
          </div>
        </div>

        {/* Editable fields (right column) — auto-generated from collection.fields */}
        <AppForm form={form} className="flex flex-col gap-3.5">
          {Object.entries(collection.fields).map(([fieldKey, fieldDef]) => {
            const InputComponent = fieldToInputComponent(fieldDef.type);
            if (!InputComponent) {
              return null;
            }
            return (
              <InputComponent
                key={fieldKey}
                name={fieldKey}
                fieldDef={fieldDef}
                readOnly={fieldDef.admin.readOnly}
              />
            );
          })}

          {/* Adapter-declared fields divider (if any) */}
          {Object.keys(collection.fields).length > 0 && (
            <div className="vex-adapter-sep">
              <span>
                From the <strong>{adapterName}</strong> storage adapter
              </span>
            </div>
          )}
        </AppForm>
      </div>
      <div className="vex-modal-foot">
        <span className="left">Step 2 of 2 · document details</span>
        <Button variant="ghost" onClick={handleBackClick}>
          Back
        </Button>
        <Button
          onClick={() => form.handleSubmit()}
          disabled={isPending}
          className={isPending ? "disabled" : ""}
        >
          {isPending ? "Uploading…" : "Create & select"}
        </Button>
      </div>
    </>
  );
}
```

### Edge-case notes

> **Edge: MediaUploadForm receives MediaCollectionConfig instead of CollectionConfig.** The types are compatible for form purposes (both have `fields`), so `useCollectionForm` should work. Add `@ts-expect-error` comment if needed.

> **Edge: Adapter-declared fields are required but user leaves them empty.** Form validation from `useCollectionForm` should handle this. Disable "Create & select" button when form is invalid.

> **Edge: File upload fails (network error, unsupported type).** MediaUploadDropzone should handle this with error toast (already implemented).

### Run tests

```bash
pnpm --filter @vexcms/react test
```

## Step 5 — Upload cell component verification (real thumbnails + badges) [dev]

Verify and update `UploadFieldCell` to use `FilePreview` for real thumbnails and match design spec.

### Files to verify / modify

- [ ] `packages/react/src/components/fields/upload/Cell.tsx` (VERIFY)

### `packages/react/src/components/fields/upload/Cell.tsx` (VERIFY)

Verify the existing implementation matches this pattern:

```tsx
import { useQuery } from "@tanstack/react-query";
import { vexConvexApi } from "@vexcms/core";
import { FilePreview } from "../../media/FilePreview";

/**
 * Table cell rendering for upload field.
 *
 * Shows:
 * - Empty: "—" placeholder.
 * - Single value (array of 1): FilePreview thumbnail + filename truncated with ellipsis, no badge.
 * - Multiple values (array of 2+): FilePreview thumbnail + filename truncated with ellipsis, `+N` badge.
 *
 * Matches the `UploadCell` design: inline-flex with FilePreview (26px) + filename + badge.
 *
 * @param props - Component props.
 * @param props.value - Array of media document IDs.
 */
export function UploadFieldCell({ value }: { value: string[] }) {
  if (!value || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const firstId = value[0];
  const { data: mediaDoc } = useQuery(
    vexConvexApi.media.getMediaById({ id: firstId }),
  );

  if (!mediaDoc) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <FilePreview
        mediaId={firstId}
        adapter={mediaDoc.meta.storageAdapter}
        mimeType={mediaDoc.mimeType}
        size={26}
        radius={2}
        alt={mediaDoc.alt || mediaDoc.filename}
      />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]">
        {mediaDoc.filename}
      </span>
      {value.length > 1 && (
        <span className="vex-badge muted font-mono">+{value.length - 1}</span>
      )}
    </span>
  );
}
```

### Edge-case notes

> **Edge: Media doc URL fails to load (403, 5xx).** FilePreview shows fallback icon instead of broken image (handled by FilePreview component).

> **Edge: Media doc is deleted (soft delete).** Show "Deleted" badge on thumbnail (check `mediaDoc._deleted` field if exists — future enhancement).

> **Edge: Media doc is from a different storage adapter.** Use the correct `adapter` param (handled — reads from `mediaDoc.meta.storageAdapter`).

### Run tests

```bash
pnpm --filter @vexcms/react test
```

## Step 6 — MediaFieldValue component (inline resolved media doc display) [dev]

Create `MediaFieldValue` component that shows a resolved media doc inline on the collection edit page. Matches the `MediaFieldValue` design: collapsible card with FilePreview thumbnail + metadata + actions.

### Files to create

- [ ] `packages/react/src/components/media/MediaFieldValue.tsx` (NEW)

### `packages/react/src/components/media/MediaFieldValue.tsx` (NEW)

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { vexConvexApi } from "@vexcms/core";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { FilePreview } from "./FilePreview";

/**
 * Props for MediaFieldValue component.
 */
export interface MediaFieldValueProps {
  /** The media document ID. */
  mediaId: string;
  /** The media collection slug. */
  targetCollection: string;
  /** Callback to open picker with this item pre-selected. */
  onEdit?: () => void;
  /** Callback to clear the upload field value. */
  onRemove?: () => void;
}

/**
 * Inline resolved media doc display on collection edit page.
 *
 * Shows a resolved media doc reference in two states:
 * - Collapsed: FilePreview thumbnail + filename/MIME/size/dimensions line with "Edit" / "Remove" buttons.
 * - Expanded: collapsed state + metadata grid (storageId, MIME, size, dimensions,
 *   media collection slug, storage adapter name).
 *
 * Matches the `MediaFieldValue` design: `.vex-mediaval` with head + optional meta grid.
 *
 * @param props - Component props.
 */
export function MediaFieldValue({
  mediaId,
  targetCollection,
  onEdit,
  onRemove,
}: MediaFieldValueProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: mediaDoc } = useQuery(
    vexConvexApi.media.getMediaById({ id: mediaId }),
  );

  if (!mediaDoc) {
    return (
      <div className="vex-mediaval">
        <div className="vex-mediaval-head">
          <div className="h-14 w-14 animate-pulse rounded bg-muted" />
          <div className="body flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const mimeShort = (mediaDoc.mimeType.split("/")[1] || mediaDoc.mimeType)
    .toUpperCase()
    .replace("SVG+XML", "SVG")
    .replace("JPEG", "JPG");
  const sizeKB = (mediaDoc.sizeBytes / 1024).toFixed(1);
  const showAltWarning =
    !mediaDoc.alt && mediaDoc.mimeType.startsWith("image/");

  return (
    <div className="vex-mediaval">
      <div className="vex-mediaval-head">
        <FilePreview
          mediaId={mediaId}
          adapter={mediaDoc.meta.storageAdapter}
          mimeType={mediaDoc.mimeType}
          size={56}
          radius={3}
          alt={mediaDoc.alt || mediaDoc.filename}
        />
        <div className="body">
          <div className="name">{mediaDoc.filename}</div>
          <div className="sub">
            {mimeShort} · {sizeKB} KB
            {mediaDoc.dimensions &&
              ` · ${mediaDoc.dimensions.width}×${mediaDoc.dimensions.height}`}
          </div>
          {showAltWarning ? (
            <div className="alt-warn">
              <Icon name="alertCircle" size={11} />
              Alt text missing — add for accessibility
            </div>
          ) : mediaDoc.alt ? (
            <div className="alt-ok">
              <span className="k">ALT</span> {mediaDoc.alt}
            </div>
          ) : null}
        </div>
        <div className="acts">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Icon name="edit" size={12} />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="icon"
            title="Open in library"
          >
            <Icon name="externalLink" size={13} />
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="icon"
              title="Remove"
              onClick={onRemove}
            >
              <Icon name="x" size={13} />
            </Button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="vex-mediaval-meta">
          <div className="cell">
            <span className="k">Storage ID</span>
            <span className="v mono">{mediaDoc.storageId.slice(0, 12)}…</span>
          </div>
          <div className="cell">
            <span className="k">MIME</span>
            <span className="v mono">{mediaDoc.mimeType}</span>
          </div>
          <div className="cell">
            <span className="k">Size</span>
            <span className="v mono">{sizeKB} KB</span>
          </div>
          {mediaDoc.dimensions && (
            <div className="cell">
              <span className="k">Dimensions</span>
              <span className="v mono">
                {mediaDoc.dimensions.width}×{mediaDoc.dimensions.height}
              </span>
            </div>
          )}
          <div className="cell">
            <span className="k">Media collection</span>
            <span className="v">{targetCollection}</span>
          </div>
          <div className="cell">
            <span className="k">Storage adapter</span>
            <span className="v">{mediaDoc.meta.storageAdapter}</span>
          </div>
        </div>
      )}
      <button
        type="button"
        className="vex-btn ghost sm mt-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Collapse" : "Expand"}
      </button>
    </div>
  );
}
```

### Edge-case notes

> **Edge: Media doc URL fails to load.** FilePreview shows fallback icon instead of broken image (handled by FilePreview component).

> **Edge: Media doc is soft-deleted.** Show "Deleted" badge on thumbnail, disable actions (future enhancement).

> **Edge: Media doc is from a different storage adapter.** Use correct `adapter` prop (handled — reads from `mediaDoc.meta.storageAdapter`).

### Run tests

```bash
pnpm --filter @vexcms/react test
```

## Step 7 — Upload field columnDef for table columns ⏳ **FINAL STEP** [dev]

Create the `uploadFieldToColumnDef` function to generate TanStack Table column definitions for upload fields. This function is called by `getCollectionColumnDefs` to render upload field cells in collection list views.

**Pattern:** Follow the same structure as other field type columnDefs (text, relationship, checkbox). The columnDef.tsx file is currently empty and needs to be implemented.

### Files to create / modify

- [ ] `packages/react/src/components/fields/upload/columnDef.tsx` (CREATE)
- [ ] `packages/react/src/components/fields/upload/index.ts` (MODIFY) — Export columnDef
- [ ] `packages/react/src/components/fields/index.tsx` (MODIFY) — Import and register in switch

### `packages/react/src/components/fields/upload/columnDef.tsx` (CREATE)

````tsx
import type { ColumnDef } from "@tanstack/react-table";
import type {
  CollectionConfig,
  MediaCollectionConfig,
  TDocument,
  UploadField,
  VexMediaDocument,
} from "@vexcms/core";
import { UploadFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for an upload field.
 *
 * The column value accessor reads `string[] | undefined` from the document —
 * upload fields always store an array of media document IDs regardless of
 * `hasMany`. Rendering is delegated to `UploadFieldCell`.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - The resolved upload field definition.
 * @param props.fieldKey - The field key from `collection.fields` (e.g. `"featuredImage"`).
 * @param props.collection - The parent collection config.
 * @param props.isTitleField - Whether this field is the collection's `useAsTitle` field.
 * @returns A TanStack Table `ColumnDef` with sorting disabled and hiding enabled.
 *
 * @example
 * ```ts
 * const col = uploadFieldToColumnDef({
 *   fieldDef: featuredImageField,
 *   fieldKey: "featuredImage",
 *   collection: pagesCollection,
 *   isTitleField: false,
 * });
 */
export function uploadFieldToColumnDef<
  TData extends TDocument = TDocument,
>(props: {
  fieldDef: UploadField;
  fieldKey: string;
  collection: CollectionConfig | MediaCollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string[] | undefined;
      return (
        <UploadFieldCell<TData, VexMediaDocument, MediaCollectionConfig>
          value={value}
          row={row}
          collection={props.collection as MediaCollectionConfig}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },
    enableSorting: false, // Can't sort by file references
    enableHiding: true,
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
````

### `packages/react/src/components/fields/upload/index.ts` (MODIFY)

Add columnDef export:

```tsx
export * from "./Input";
export * from "./Cell";
export * from "./columnDef"; // ← ADD THIS
```

### `packages/react/src/components/fields/index.tsx` (MODIFY)

Add import and switch case.

**1. Add import at top** (around line 9, with other field imports):

```tsx
import {
  UploadFieldCell,
  UploadFieldInput,
  uploadFieldToColumnDef,
} from "./upload";
```

**2. Add case in `getCollectionColumnDefs` switch statement** (after blocks case, before default):

```tsx
      case ADMIN_FIELDS.blocks.type:
        columnDefs.push(
          blocksFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      // ← ADD THIS CASE
      case ADMIN_FIELDS.upload.type:
        columnDefs.push(
          uploadFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      default:
        // Unknown field type — skip column generation
        break;
```

### Edge-case notes

> **Edge: Upload field is empty (no files uploaded).** Cell shows "—" placeholder (handled in UploadFieldCell).

> **Edge: Media document is deleted.** Cell still attempts to render, shows "Loading..." then fallback (handled by query error state).

> **Edge: Upload field with multiple files.** Cell shows first thumbnail + `+N` badge (handled in UploadFieldCell).

### Run tests

```bash
pnpm typecheck
pnpm --filter @vexcms/react test
```

## Step 8 — UI Polish: File size formatting utility ⏳ **NEXT** [dev]

Create a `formatBytes` utility function to display file sizes with proper units (B, KB, MB, GB, TB) matching the design system.

**Pattern:** Matches the `fmtBytes` function from the Claude Design export.

### Files to create

- [ ] `packages/react/src/lib/utils.ts` (CREATE) — General utility functions
- [ ] `packages/react/src/lib/index.ts` (CREATE) — Export barrel

### `packages/react/src/lib/utils.ts` (CREATE)

````tsx
/**
 * Formats byte count into human-readable file size.
 *
 * Converts raw byte count into appropriate units (B, KB, MB, GB, TB)
 * with sensible precision for each scale.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string with unit (e.g. "248 KB", "1.4 MB")
 *
 * @example
 * ```ts
 * formatBytes(1024) // "1 KB"
 * formatBytes(1536) // "1.5 KB"
 * formatBytes(1048576) // "1 MB"
 * formatBytes(248000) // "242.2 KB"
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes < 1024 * 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
}

/**
 * Formats MIME type into short display name.
 *
 * Extracts the subtype from a MIME type and normalizes common variants.
 *
 * @param mimeType - Full MIME type (e.g. "image/jpeg")
 * @returns Uppercase short name (e.g. "JPG")
 *
 * @example
 * ```ts
 * formatMimeType("image/jpeg") // "JPG"
 * formatMimeType("image/svg+xml") // "SVG"
 * formatMimeType("application/pdf") // "PDF"
 */
export function formatMimeType(mimeType: string): string {
  return (mimeType.split("/")[1] || mimeType)
    .toUpperCase()
    .replace("SVG+XML", "SVG")
    .replace("JPEG", "JPG");
}
````

### `packages/react/src/lib/index.ts` (CREATE)

```tsx
export * from "./utils";
```

### Update package exports

Add to `packages/react/src/index.ts`:

```tsx
export * from "./lib";
```

### Run tests

```bash
pnpm typecheck
```

## Step 9 — UI Polish: DnD reordering for multi-upload fields ⏳ **NEXT** [dev]

Integrate the existing `Droppable`, `Draggable`, and `DragHandle` components into `UploadFilledState` to enable drag-and-drop reordering when `hasMany: true`.

**Pattern:** Follow the same DnD integration as `FormArray` and `FormBlocks`.

**Key requirement:** Only show the drag handle when `hasMany === true`. When `hasMany === false` (single upload), render the same layout but hide the grip icon.

### Files to modify

- [ ] `packages/react/src/components/fields/upload/FilledInput.tsx` (MODIFY)

### Changes to `FilledInput.tsx`

**1. Add imports:**

```tsx
import { Droppable, Draggable, DragHandle } from "../../ui/dnd";
import { formatBytes, formatMimeType } from "../../../lib/utils";
```

**2. Add `onReorder` callback to props:**

```tsx
export interface UploadFilledStateProps {
  // ... existing props
  /** Callback to reorder items (multi only). */
  onReorder?: (from: number, to: number) => void;
}
```

**3. Wrap the list in Droppable + Draggable:**

```tsx
export function UploadFilledState({
  adapterName,
  mediaIds,
  fieldDef,
  onRemove,
  onAdd,
  onReorder,
}: UploadFilledStateProps) {
  const atLimit = fieldDef.max !== undefined && mediaIds.length >= fieldDef.max;

  return (
    <div className="flex flex-col gap-2">
      {fieldDef.hasMany && onReorder ? (
        <Droppable
          id={`upload-${fieldDef.label}`}
          onReorder={onReorder}
          div={{ className: "vex-upload-list" }}
        >
          {mediaIds.map((id, index) => (
            <Draggable key={id} id={id} index={index}>
              <UploadItemRow
                adapterName={adapterName}
                mediaId={id}
                onRemove={() => onRemove(id)}
                showDragHandle={true}
              />
            </Draggable>
          ))}
        </Droppable>
      ) : (
        <div className="vex-upload-list">
          {mediaIds.map((id) => (
            <UploadItemRow
              key={id}
              adapterName={adapterName}
              mediaId={id}
              onRemove={() => onRemove(id)}
              showDragHandle={false}
            />
          ))}
        </div>
      )}

      {/* ... rest of component */}
    </div>
  );
}
```

**4. Update `UploadItemRow` to use formatBytes, conditional DragHandle, and pure Tailwind classes:**

**Key changes:**
- Remove all custom classNames (`vex-upload-item`, `meta`, `alt`, `acts`, etc.)
- Use only Tailwind utilities for layout
- Fix alt text truncation with `min-w-0` + `truncate` pattern
- Alt section uses `max-w-[200px]` to prevent taking too much space

```tsx
function UploadItemRow({
  mediaId,
  onRemove,
  adapterName,
  showDragHandle = false,
}: {
  mediaId: string;
  onRemove: () => void;
  adapterName: StorageAdapterSlug;
  showDragHandle?: boolean;
}) {
  const { data: doc } = useQuery({
    ...convexQuery(vexConvexApi.get, { id: mediaId }),
  });
  const mediaDoc = doc as VexMediaDocument | null | undefined;

  if (!mediaDoc) {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-border bg-card px-3 py-2">
        <div className="h-11 w-11 animate-pulse rounded bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-sm border border-border bg-card px-3 py-2">
      {/* Drag handle */}
      {showDragHandle ? (
        <DragHandle className="shrink-0 text-muted-foreground">
          <Icon name="Grip" size={13} />
        </DragHandle>
      ) : (
        <span className="flex shrink-0 items-center text-muted-foreground opacity-0 pointer-events-none">
          <Icon name="Grip" size={13} />
        </span>
      )}

      {/* Thumbnail */}
      <FilePreview
        mediaId={mediaId}
        adapter={adapterName}
        mimeType={mediaDoc.mimeType}
        size={44}
        radius={3}
        alt={mediaDoc.alt || mediaDoc.filename}
      />

      {/* Filename + metadata */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="truncate text-sm font-medium">{mediaDoc.filename}</div>
        <div className="truncate text-xs text-muted-foreground">
          {formatMimeType(mediaDoc.mimeType)} · {formatBytes(mediaDoc.size)}
          {mediaDoc.width &&
            mediaDoc.height &&
            ` · ${mediaDoc.width}×${mediaDoc.height}`}
        </div>
      </div>

      {/* Alt text indicator - stays on one line */}
      <div className="flex min-w-0 max-w-[200px] items-center gap-2">
        <span className="shrink-0 text-xs font-mono uppercase tracking-wide text-muted-foreground">
          ALT
        </span>
        <span className="min-w-0 flex-1 truncate text-xs">
          {mediaDoc.alt || <em className="text-destructive">Missing</em>}
        </span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          title="Remove"
        >
          <Icon name="X" size={13} />
        </Button>
      </div>
    </div>
  );
}
```

**5. Update `Input.tsx` to pass onReorder:**

```tsx
// In UploadFieldInput component:
const handleReorder = (from: number, to: number) => {
  const newIds = [...currentIds];
  const [moved] = newIds.splice(from, 1);
  newIds.splice(to, 0, moved!);
  field.handleChange(newIds);
};

// Pass to UploadFilledState:
<UploadFilledState
  adapterName={adapterName}
  mediaIds={currentIds}
  fieldDef={fieldDef}
  onRemove={handleRemove}
  onAdd={handleOpenPicker}
  onReorder={fieldDef.hasMany ? handleReorder : undefined}
/>;
```

### Edge-case notes

> **Edge: Single upload (hasMany: false).** Drag handle is visually hidden (opacity: 0) but spacing is preserved so layout stays consistent.

> **Edge: Multi upload with max limit reached.** Reordering still works, only the "Add" button is disabled.

### Run tests

```bash
pnpm typecheck
pnpm --filter @vexcms/react test
```

## Step 10 — Refactor MediaUploadForm and connect to MediaPicker ⏳ **NEXT** [dev]

Refactor MediaUploadForm to the new staged-file workflow and connect it to MediaPicker's Upload tab.

**What changes:**
1. Remove MediaUploadDropzone component dependency
2. Show inline dropzone when no files staged  
3. Accept `stagedFiles`, `multi` props from MediaPicker
4. Render accordion forms for each staged file (filename + alt editable)
5. Upload all files in parallel with Promise.all
6. Show upload progress as fraction ("2/5") with button spinner
7. Update MediaPicker to pass new props
8. Auto-close modal after successful upload

**Key change:** MediaUploadForm no longer immediately uploads files. It stages them, lets user edit metadata, then uploads on "Create & select".

### Files to modify

- [ ] `packages/react/src/components/media/MediaUploadForm.tsx` (MODIFY — major refactor)
- [ ] `packages/react/src/components/media/MediaUploadDropzone.tsx` (DELETE)
- [ ] `packages/react/src/components/media/MediaPicker.tsx` (MODIFY — update interface)

### Part A: Refactor MediaUploadForm.tsx

**New interface:**
```tsx
export interface MediaUploadFormProps {
  collection: MediaCollectionConfig;
  adapterName: StorageAdapterSlug;
  multi: boolean;                    // ← NEW: from field.hasMany
  stagedFiles?: File[];              // ← NEW: pre-staged files
  onComplete: (mediaIds: string[]);  // ← CHANGED: array instead of single ID
  onCancel: () => void;              // ← CHANGED: was onBack
}
```

**Full implementation:**

```tsx
"use client";

import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi, formatBytes, formatMimeType } from "@vexcms/core";
import type { MediaCollectionConfig, StorageAdapterSlug } from "@vexcms/core";
import { Button, Icon } from "../ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

/**
 * Props for MediaUploadForm component.
 */
export interface MediaUploadFormProps {
  /** The media collection configuration. */
  collection: MediaCollectionConfig;
  /** The storage adapter name. */
  adapterName: StorageAdapterSlug;
  /** Whether to allow multiple file selection (from field.hasMany). */
  multi: boolean;
  /** Pre-staged files from EmptyInput or direct drops in the modal. */
  stagedFiles?: File[];
  /** Called with array of created media document IDs after successful upload. */
  onComplete: (mediaIds: string[]) => void;
  /** Called when user cancels upload or closes modal. */
  onCancel: () => void;
}

/**
 * Internal staged file representation with editable metadata.
 *
 * Each staged file has a temporary client-side ID and stores both the File
 * object and editable metadata fields (filename, alt). Additional fields from
 * the media collection config can be added here.
 */
interface StagedFile {
  /** Temporary client-side ID (crypto.randomUUID()). */
  id: string;
  /** The File object to upload. */
  file: File;
  /** Editable filename (default: file.name). */
  filename: string;
  /** Editable alt text (default: empty string). */
  alt: string;
  /** Auto-detected MIME type (file.type). */
  mimeType: string;
  /** Auto-detected file size in bytes (file.size). */
  size: number;
}

/**
 * Two-step upload form for MediaPicker's "Upload new" tab.
 *
 * Step 1 (empty state): Dropzone + file picker for staging files.
 * Step 2 (files staged): Accordion forms for editing metadata before upload.
 *
 * Uploads all files in parallel with Promise.all, shows progress as fraction
 * (e.g. "2/5"), and auto-closes modal on success.
 *
 * **Key behavior:**
 * - Does NOT upload immediately on file selection
 * - Stages files, lets user edit metadata, then uploads on "Create & select"
 * - Single-select mode (multi={false}): only one file at a time
 * - Multi-select mode (multi={true}): multiple files, "Add more" button
 *
 * @param props - Component props.
 */
export function MediaUploadForm({
  collection,
  adapterName,
  multi,
  stagedFiles = [],
  onComplete,
  onCancel,
}: MediaUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const { mutateAsync: generateUploadUrl } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.generateUploadUrl),
  });

  const { mutateAsync: createMediaDoc } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.createMediaDocument),
  });

  // Initialize staged files from props
  useEffect(() => {
    if (stagedFiles.length > 0) {
      const staged = stagedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        filename: file.name,
        alt: "",
        mimeType: file.type,
        size: file.size,
      }));
      setFiles(staged);
    }
  }, [stagedFiles]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleAddFiles(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleAddFiles(selectedFiles);
    e.target.value = ""; // Reset
  };

  const handleAddFiles = (newFiles: File[]) => {
    const staged = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      alt: "",
      mimeType: file.type,
      size: file.size,
    }));

    setFiles((prev) => (multi ? [...prev, ...staged] : staged));
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id: string, field: string, value: unknown) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const handleUpload = async () => {
    setUploadProgress({ current: 0, total: files.length });

    try {
      const createdIds = await Promise.all(
        files.map(async (fileData, index) => {
          // 1. Generate upload URL
          const { url } = await generateUploadUrl();

          // 2. Upload file to Convex storage
          const uploadResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": fileData.file.type },
            body: fileData.file,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed for ${fileData.filename}`);
          }

          const { storageId } = await uploadResponse.json();

          // Update progress
          setUploadProgress({ current: index + 1, total: files.length });

          // 3. Create media document
          const mediaDocId = await createMediaDoc({
            collectionSlug: collection.slug,
            storageId,
            filename: fileData.filename,
            mimeType: fileData.file.type,
            size: fileData.file.size,
            alt: fileData.alt,
          });

          return mediaDocId;
        })
      );

      onComplete(createdIds);
      setFiles([]);
      setUploadProgress(null);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress(null);
      // TODO: Show error toast
    }
  };

  const isUploading = uploadProgress !== null;

  // Empty state - show dropzone
  if (files.length === 0) {
    return (
      <>
        <div className="p-5">
          <div
            className={`vex-dropzone ${
              isDragActive ? "border-primary bg-primary/5" : ""
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="ico">
              <Icon name="Image" size={18} />
            </div>
            <div className="title">
              {isDragActive ? "Drop to stage files" : "Drag files here, or choose"}
            </div>
            <div className="sub">
              PNG, JPG, SVG, WebP · up to 10 MB · stored via {adapterName}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Icon name="Image" size={12} />
              Choose file{multi ? "s" : ""}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multi}
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>
        <div className="vex-modal-foot">
          <span className="left">Step 1 of 2 · choose files</span>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled>Create &amp; select</Button>
        </div>
      </>
    );
  }

  // Files staged - show accordion forms
  return (
    <>
      <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto p-5">
        <Accordion type="multiple" defaultValue={files.map((f) => f.id)}>
          {files.map((fileData, index) => (
            <AccordionItem key={fileData.id} value={fileData.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <Icon name="Image" size={14} />
                  <span className="truncate text-sm font-medium">
                    {fileData.filename}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatMimeType(fileData.mimeType)} · {formatBytes(fileData.size)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-3 pt-3">
                  {/* Filename */}
                  <div>
                    <label className="mb-1 block text-xs font-medium">Filename</label>
                    <input
                      type="text"
                      className="vex-input"
                      value={fileData.filename}
                      onChange={(e) =>
                        handleFieldChange(fileData.id, "filename", e.target.value)
                      }
                    />
                  </div>

                  {/* Alt text */}
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Alt text {collection.fields.alt?.required && "*"}
                    </label>
                    <input
                      type="text"
                      className="vex-input"
                      value={fileData.alt}
                      onChange={(e) =>
                        handleFieldChange(fileData.id, "alt", e.target.value)
                      }
                      placeholder="Describe the image"
                    />
                  </div>

                  {/* TODO: Render other fields from collection.fields using fieldToInputComponent */}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(fileData.id)}
                    className="self-start text-destructive"
                    disabled={isUploading}
                  >
                    <Icon name="Trash" size={12} />
                    Remove file
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Add more files button (multi-upload only) */}
        {multi && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="self-start"
            >
              <Icon name="Plus" size={12} />
              Add more files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </>
        )}
      </div>

      <div className="vex-modal-foot">
        <span className="left">
          Step 2 of 2 · {files.length} file{files.length === 1 ? "" : "s"}
          {isUploading && uploadProgress && (
            <span className="ml-2 font-mono text-xs">
              ({uploadProgress.current}/{uploadProgress.total})
            </span>
          )}
        </span>
        <Button variant="ghost" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Uploading..." : `Create & select (${files.length})`}
        </Button>
      </div>
    </>
  );
}
```

### Part B: Update MediaPicker.tsx

Update MediaPicker to use the refactored MediaUploadForm with new interface.

**Changes:**
1. Update `handleUploadComplete` to accept array
2. Pass `multi` prop to MediaUploadForm
3. Pass empty `stagedFiles` array (will be populated in Step 11)

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, Icon } from "../ui";
import { MediaLibraryGrid } from "./MediaLibaryGrid";
import { MediaUploadForm } from "./MediaUploadForm";
import { useVexConfig } from "../../context";
import type { MediaCollectionSlug, StorageAdapterSlug } from "@vexcms/core";
import type { TypedFieldApi } from "../form";

interface MediaPickerProps {
  targetCollection: MediaCollectionSlug;
  field: TypedFieldApi<string[]>;
  multi: boolean;
  onSelect: (mediaIds: string[]) => void;
  onCancel: () => void;
}

export function MediaPicker({
  field,
  targetCollection,
  multi,
  onSelect,
  onCancel,
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(field.state.value ?? []);
  const config = useVexConfig();

  const collection = config.mediaCollections.find(
    (mc) => mc.slug === targetCollection
  );

  if (!collection) {
    throw new Error(`Media collection "${targetCollection}" not found in config`);
  }

  const adapterName: StorageAdapterSlug = collection.meta?.storageAdapter ?? "convex";

  const handleSelect = () => {
    onSelect(selectedIds);
    setSelectedIds([]);
  };

  // ← CHANGED: Now accepts array of IDs
  const handleUploadComplete = (mediaIds: string[]) => {
    onSelect(mediaIds);
    setSelectedIds([]);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="vex-modal max-w-[760px]">
        <div className="vex-modal-head items-center pb-0">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Image" size={16} />
          </div>
          <div className="text">
            <h2>Select media</h2>
            <p className="sub">
              Relationship → <span className="mono">{targetCollection}</span> media collection
            </p>
          </div>
          <button className="close" onClick={onCancel}>
            <Icon name="X" size={14} />
          </button>
        </div>

        <Tabs defaultValue="library" className="mt-3">
          <TabsList className="mx-5">
            <TabsTrigger value="library">
              <Icon name="Folder" size={13} className="mr-1.5" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Icon name="Plus" size={13} className="mr-1.5" />
              Upload new
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-0">
            <MediaLibraryGrid
              fieldName={field.name}
              targetCollection={targetCollection}
              multi={multi}
              onSelect={setSelectedIds}
              selectedIds={selectedIds}
            />
            <div className="vex-modal-foot">
              <span className="left">
                {selectedIds.length} selected
              </span>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={selectedIds.length === 0}>
                {multi && selectedIds.length > 1 ? `Select ${selectedIds.length}` : "Select"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <MediaUploadForm
              collection={collection}
              adapterName={adapterName}
              onComplete={handleUploadComplete}
              onBack={handleBackToLibrary}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Part B: Update MediaPicker.tsx

Update MediaPicker to use the refactored MediaUploadForm with new interface.

**Changes:**
1. Update `handleUploadComplete` to accept array
2. Pass `multi` prop to MediaUploadForm
3. Pass empty `stagedFiles` array (will be populated in Step 14)

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, Icon } from "../ui";
import { MediaLibraryGrid } from "./MediaLibaryGrid";
import { MediaUploadForm } from "./MediaUploadForm";
import { useVexConfig } from "../../context";
import type { MediaCollectionSlug, StorageAdapterSlug } from "@vexcms/core";
import type { TypedFieldApi } from "../form";

interface MediaPickerProps {
  targetCollection: MediaCollectionSlug;
  field: TypedFieldApi<string[]>;
  multi: boolean;
  onSelect: (mediaIds: string[]) => void;
  onCancel: () => void;
}

export function MediaPicker({
  field,
  targetCollection,
  multi,
  onSelect,
  onCancel,
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(field.state.value ?? []);
  const config = useVexConfig();

  const collection = config.mediaCollections.find(
    (mc) => mc.slug === targetCollection
  );

  if (!collection) {
    throw new Error(`Media collection "${targetCollection}" not found in config`);
  }

  const adapterName: StorageAdapterSlug = collection.meta?.storageAdapter ?? "convex";

  const handleSelect = () => {
    onSelect(selectedIds);
    setSelectedIds([]);
  };

  // ← CHANGED: Now accepts array of IDs
  const handleUploadComplete = (mediaIds: string[]) => {
    onSelect(mediaIds);
    setSelectedIds([]);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="vex-modal max-w-[760px]">
        <div className="vex-modal-head items-center pb-0">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Image" size={16} />
          </div>
          <div className="text">
            <h2>Select media</h2>
            <p className="sub">
              Relationship → <span className="mono">{targetCollection}</span> media collection
            </p>
          </div>
          <button className="close" onClick={onCancel}>
            <Icon name="X" size={14} />
          </button>
        </div>

        <Tabs defaultValue="library" className="mt-3">
          <TabsList className="mx-5">
            <TabsTrigger value="library">
              <Icon name="Folder" size={13} className="mr-1.5" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Icon name="Plus" size={13} className="mr-1.5" />
              Upload new
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-0">
            <MediaLibraryGrid
              fieldName={field.name}
              targetCollection={targetCollection}
              multi={multi}
              onSelect={setSelectedIds}
              selectedIds={selectedIds}
            />
            <div className="vex-modal-foot">
              <span className="left">{selectedIds.length} selected</span>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={selectedIds.length === 0}>
                {multi && selectedIds.length > 1 ? `Select ${selectedIds.length}` : "Select"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <MediaUploadForm
              collection={collection}
              adapterName={adapterName}
              multi={multi}              {/* ← NEW */}
              stagedFiles={[]}           {/* ← NEW: empty for now, Step 14 adds wiring */}
              onComplete={handleUploadComplete}
              onCancel={onCancel}        {/* ← CHANGED from onBack */}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Part C: Delete MediaUploadDropzone.tsx

```bash
rm packages/react/src/components/media/MediaUploadDropzone.tsx
```

### Edge-case notes

> **Edge: User removes all staged files.** Shows dropzone again (empty state).

> **Edge: Single-upload mode (hasMany: false).** File input has `multiple={false}`, only one file can be selected.

> **Edge: Upload fails mid-batch.** Error logged, upload stops. TODO: Add error toast.

> **Edge: Alt text missing on required field.** Currently allows upload - validation happens on document creation.

### Run tests

```bash
pnpm typecheck
pnpm --filter @vexcms/react test
```

## Step 11 — Wire EmptyInput to stage files and open MediaPicker on Upload tab ⏳ **TODO** [dev]

Complete the upload flow by wiring EmptyInput to MediaPicker:
1. EmptyInput handles file drops + picker selection
2. Opens MediaPicker on Upload tab when files selected
3. MediaPicker accepts `defaultTab` and `stagedFiles` props
4. Forwards staged files to MediaUploadForm (refactored in Step 13)
5. User edits metadata → clicks "Create & select"
6. Files upload → modal closes → IDs set on field
7. User saves document from CollectionEditView to persist

**Pattern:** EmptyInput → Input.tsx state → MediaPicker → MediaUploadForm.

### Files to modify

- [ ] `packages/react/src/components/fields/upload/EmptyInput.tsx` (MODIFY)
- [ ] `packages/react/src/components/fields/upload/Input.tsx` (MODIFY)
- [ ] `packages/react/src/components/media/MediaPicker.tsx` (MODIFY)

### Part A: Update EmptyInput.tsx

```tsx
export interface MediaUploadFormProps {
  collection: MediaCollectionConfig;
  adapterName: StorageAdapterSlug;
  /** Allow multiple file selection (from field.hasMany). */
  multi: boolean;
  /** Pre-staged files from EmptyInput or direct drops. */
  stagedFiles?: File[];
  /** Called with array of created media document IDs. */
  onComplete: (mediaIds: string[]) => void;
  /** Called when user cancels or goes back to Library tab. */
  onCancel: () => void;
}
```

### Staged file state structure

```tsx
interface StagedFile {
  id: string;              // Temp client ID (crypto.randomUUID())
  file: File;              // The File object
  filename: string;        // Editable, default: file.name
  alt: string;             // Editable, default: ""
  // ... other editable fields from collection.fields
  // Auto-detected (read-only, shown in preview):
  mimeType: string;        // file.type
  size: number;            // file.size
  width?: number;          // Extracted if image (later)
  height?: number;         // Extracted if image (later)
}
```

### Full MediaUploadForm.tsx implementation

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi, formatBytes, formatMimeType } from "@vexcms/core";
import type { MediaCollectionConfig, StorageAdapterSlug } from "@vexcms/core";
import { Button, Icon } from "../ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { fieldToInputComponent } from "../fields";

export interface MediaUploadFormProps {
  collection: MediaCollectionConfig;
  adapterName: StorageAdapterSlug;
  multi: boolean;
  stagedFiles?: File[];
  onComplete: (mediaIds: string[]) => void;
  onCancel: () => void;
}

interface StagedFile {
  id: string;
  file: File;
  filename: string;
  alt: string;
  // Additional fields populated from collection.fields
  [key: string]: unknown;
}

export function MediaUploadForm({
  collection,
  adapterName,
  multi,
  stagedFiles = [],
  onComplete,
  onCancel,
}: MediaUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const { mutateAsync: generateUploadUrl } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.generateUploadUrl),
  });

  const { mutateAsync: createMediaDoc } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.createMediaDocument),
  });

  // Initialize staged files from props
  useEffect(() => {
    if (stagedFiles.length > 0) {
      const staged = stagedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        filename: file.name,
        alt: "",
        mimeType: file.type,
        size: file.size,
      }));
      setFiles(staged);
    }
  }, [stagedFiles]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleAddFiles(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleAddFiles(selectedFiles);
    e.target.value = ""; // Reset so same file can be selected again
  };

  const handleAddFiles = (newFiles: File[]) => {
    const staged = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      alt: "",
      mimeType: file.type,
      size: file.size,
    }));

    setFiles((prev) => (multi ? [...prev, ...staged] : staged));
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id: string, field: string, value: unknown) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const handleUpload = async () => {
    setUploadProgress({ current: 0, total: files.length });

    try {
      const createdIds = await Promise.all(
        files.map(async (fileData, index) => {
          // 1. Generate upload URL
          const { url } = await generateUploadUrl();

          // 2. Upload file to Convex storage
          const uploadResponse = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": fileData.file.type },
            body: fileData.file,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed for ${fileData.filename}`);
          }

          const { storageId } = await uploadResponse.json();

          // Update progress
          setUploadProgress({ current: index + 1, total: files.length });

          // 3. Create media document
          const mediaDocId = await createMediaDoc({
            collectionSlug: collection.slug,
            storageId,
            filename: fileData.filename,
            mimeType: fileData.file.type,
            size: fileData.file.size,
            alt: fileData.alt,
            // ... other fields from fileData (caption, etc.)
          });

          return mediaDocId;
        })
      );

      onComplete(createdIds);
      setFiles([]);
      setUploadProgress(null);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress(null);
      // TODO: Show error toast
    }
  };

  const isUploading = uploadProgress !== null;

  // Empty state - show dropzone
  if (files.length === 0) {
    return (
      <>
        <div className="p-5">
          <div
            className={`vex-dropzone ${
              isDragActive ? "border-primary bg-primary/5" : ""
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="ico">
              <Icon name="Image" size={18} />
            </div>
            <div className="title">
              {isDragActive ? "Drop to stage files" : "Drag files here, or choose"}
            </div>
            <div className="sub">
              PNG, JPG, SVG, WebP · up to 10 MB · stored via {adapterName}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Icon name="Image" size={12} />
              Choose file{multi ? "s" : ""}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multi}
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>
        <div className="vex-modal-foot">
          <span className="left">Step 1 of 2 · choose files</span>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled>Create &amp; select</Button>
        </div>
      </>
    );
  }

  // Files staged - show accordion forms
  return (
    <>
      <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto p-5">
        <Accordion type="multiple" defaultValue={files.map((f) => f.id)}>
          {files.map((fileData, index) => (
            <AccordionItem key={fileData.id} value={fileData.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {index + 1}
                  </span>
                  <Icon name="Image" size={14} />
                  <span className="truncate text-sm font-medium">
                    {fileData.filename}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatMimeType(fileData.mimeType)} · {formatBytes(fileData.size)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-3 pt-3">
                  {/* Filename */}
                  <div>
                    <label className="mb-1 block text-xs font-medium">Filename</label>
                    <input
                      type="text"
                      className="vex-input"
                      value={fileData.filename}
                      onChange={(e) =>
                        handleFieldChange(fileData.id, "filename", e.target.value)
                      }
                    />
                  </div>

                  {/* Alt text */}
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Alt text {collection.fields.alt?.required && "*"}
                    </label>
                    <input
                      type="text"
                      className="vex-input"
                      value={fileData.alt}
                      onChange={(e) =>
                        handleFieldChange(fileData.id, "alt", e.target.value)
                      }
                      placeholder="Describe the image"
                    />
                  </div>

                  {/* TODO: Render other fields from collection.fields using fieldToInputComponent */}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(fileData.id)}
                    className="self-start text-destructive"
                    disabled={isUploading}
                  >
                    <Icon name="Trash" size={12} />
                    Remove file
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Add more files button (multi-upload only) */}
        {multi && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="self-start"
            >
              <Icon name="Plus" size={12} />
              Add more files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </>
        )}
      </div>

      <div className="vex-modal-foot">
        <span className="left">
          Step 2 of 2 · {files.length} file{files.length === 1 ? "" : "s"}
          {isUploading && uploadProgress && (
            <span className="ml-2 font-mono text-xs">
              ({uploadProgress.current}/{uploadProgress.total})
            </span>
          )}
        </span>
        <Button variant="ghost" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={isUploading} isPending={isUploading}>
          {isUploading
            ? "Uploading..."
            : `Create & select (${files.length})`}
        </Button>
      </div>
    </>
  );
}
```

### Delete MediaUploadDropzone.tsx

This component is no longer needed - dropzone logic is now inline in MediaUploadForm.

```bash
rm packages/react/src/components/media/MediaUploadDropzone.tsx
```

### Edge-case notes

> **Edge: User removes all staged files.** Shows dropzone again (empty state).

> **Edge: Single-upload mode (hasMany: false).** File input has `multiple={false}`, only one file can be selected at a time.

> **Edge: Upload fails mid-batch.** Error is logged, upload stops, user sees last progress. TODO: Add error toast.

> **Edge: Alt text missing on required field.** Currently allows upload - collection validation will catch it on document creation.

### Run tests

```bash
pnpm typecheck
pnpm --filter @vexcms/react test
```

## Step 12 — Functional updates: EmptyInput behavior and structure ⏳ **TODO** [dev]

Update EmptyInput functional behavior to match Claude Design patterns BEFORE styling:
1. Proper drag-and-drop state management (active/hover states)
2. File validation (MIME types, size limits)
3. Error handling (show errors when invalid files dropped)
4. Accessibility (keyboard navigation, ARIA labels)

**Do this BEFORE visual styling** so the component works correctly.

### Files to modify

- [ ] `packages/react/src/components/fields/upload/EmptyInput.tsx` (MODIFY)

### Functional requirements

**1. Add file validation:**
```tsx
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates a file against allowed types and size limits.
 *
 * @param file - File to validate.
 * @returns Validation result with error message if invalid.
 *
 * @example
 * ```ts
 * const result = validateFile(file);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `${file.name}: Invalid file type. Only PNG, JPG, SVG, WebP allowed.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `${file.name}: File too large. Max 10MB.` };
  }
  return { valid: true };
};
```

**2. Add error state:**
```tsx
const [errors, setErrors] = useState<string[]>([]);

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragActive(false);
  setErrors([]);

  const files = Array.from(e.dataTransfer.files);
  const validFiles: File[] = [];
  const validationErrors: string[] = [];

  files.forEach(file => {
    const result = validateFile(file);
    if (result.valid) {
      validFiles.push(file);
    } else {
      validationErrors.push(result.error!);
    }
  });

  if (validationErrors.length > 0) {
    setErrors(validationErrors);
  }

  if (validFiles.length > 0) {
    onFilesSelected(allowMultiple ? validFiles : [validFiles[0]!]);
  }
};
```

**3. Render errors below dropzone:**
```tsx
{errors.length > 0 && (
  <div className="flex flex-col gap-1 text-sm text-destructive">
    {errors.map((err, i) => (
      <div key={i}>{err}</div>
    ))}
  </div>
)}
```

### Run tests

```bash
pnpm typecheck
```

## Step 13 — Functional updates: MediaLibraryGrid behavior ⏳ **TODO** [dev]

Update MediaLibraryGrid functional behavior to match Claude Design patterns:
1. Multi-select with checkboxes (when `multi={true}`)
2. Single-select with radio-like behavior (when `multi={false}`)
3. Search debouncing (already implemented, verify)
4. Empty states (no items, no search results)
5. Loading states during fetch

**Do this BEFORE visual styling.**

### Files to modify

- [ ] `packages/react/src/components/media/MediaLibraryGrid.tsx` (MODIFY)

### Functional requirements

**1. Verify multi-select behavior:**
- When `multi={true}`: Allow multiple selections, show checkboxes
- When `multi={false}`: Only one item selected at a time, clicking new item deselects old

**2. Add empty states:**
```tsx
if (isLoading) {
  return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
}

if (displayedItems.length === 0 && debouncedSearch.length > 0) {
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">No media files match your search.</p>
      <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="mt-2">
        Clear search
      </Button>
    </div>
  );
}

if (displayedItems.length === 0) {
  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">No media files yet.</p>
      <p className="text-xs text-muted-foreground mt-1">
        Upload files using the "Upload new" tab.
      </p>
    </div>
  );
}
```

**3. Fix selection behavior for single-select:**
```tsx
/**
 * Handles media item selection/deselection.
 *
 * - Multi-select mode: toggles selection
 * - Single-select mode: replaces current selection
 *
 * @param id - Media document ID to select/deselect.
 */
const handleItemClick = (id: string) => {
  if (multi) {
    // Multi-select: toggle
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(sid => sid !== id)
      : [...selectedIds, id];
    onSelect(newSelected);
  } else {
    // Single-select: replace
    onSelect([id]);
  }
};
```

### Run tests

```bash
pnpm typecheck
```

## Step 14 — Functional updates: MediaPicker tab and modal behavior ⏳ **TODO** [dev]

Update MediaPicker functional behavior:
1. Keyboard navigation (Escape to close, Tab to cycle between tabs)
2. Focus management (auto-focus search input when Library tab opens)
3. Prevent modal close when upload in progress
4. Clear selections when switching tabs

**Do this BEFORE visual styling.**

### Files to modify

- [ ] `packages/react/src/components/media/MediaPicker.tsx` (MODIFY)

### Functional requirements

**1. Prevent close during upload:**
```tsx
const [isUploading, setIsUploading] = useState(false);

/**
 * Handles modal close/cancel action.
 *
 * Prevents closing if upload is in progress (shows confirmation dialog).
 */
const handleCancel = () => {
  if (isUploading) {
    // TODO: Show confirmation dialog
    return;
  }
  onCancel();
};
```

**2. Focus management:**
```tsx
const searchInputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (currentTab === "library") {
    searchInputRef.current?.focus();
  }
}, [currentTab]);
```

**3. Clear selections on tab switch:**
```tsx
/**
 * Handles tab switching between Library and Upload.
 *
 * Clears selections when switching to Upload tab to avoid confusion.
 *
 * @param newTab - The tab to switch to.
 */
const handleTabChange = (newTab: "library" | "upload") => {
  if (newTab === "upload") {
    setSelectedIds([]);
  }
  setCurrentTab(newTab);
};
```

### Run tests

```bash
pnpm typecheck
```

## Step 15 — Visual styling: EmptyInput dropzone ⏳ **TODO** [dev]

Update EmptyInput Tailwind classes to match Claude Design.

**Reference design:** `.pi/design/claude-design/admin/upload.jsx` → `UploadEmpty` component

### Files to modify

- [ ] `packages/react/src/components/fields/upload/EmptyInput.tsx` (MODIFY)

### Design requirements

Match the `vex-dropzone` styles from Claude Design:
- Border: dashed, subtle
- Hover: border color change
- Active (drag over): background tint + border primary color
- Icon, title, subtitle styling
- Button styling (outline variant)

**TODO:** User will update Tailwind classes manually.

## Step 16 — Visual styling: MediaLibraryGrid tiles ⏳ **TODO** [dev]

Update MediaLibraryGrid Tailwind classes to match Claude Design.

**Reference design:** `.pi/design/claude-design/admin/upload.jsx` → `MediaPicker` component (grid tiles)

### Files to modify

- [ ] `packages/react/src/components/media/MediaLibraryGrid.tsx` (MODIFY)

### Design requirements

Match the `vex-media-tile` styles:
- Grid layout (4 columns)
- Tile sizing, aspect ratio
- Thumbnail preview with checkmark overlay
- Dimension badge
- Filename + metadata text
- Selected state (border, background)

**TODO:** User will update Tailwind classes manually.

## Step 17 — Visual styling: MediaPicker modal shell ⏳ **TODO** [dev]

Update MediaPicker modal header, tabs, footer to match Claude Design.

**Reference design:** `.pi/design/claude-design/admin/upload.jsx` → `MediaModalShell` component

### Files to modify

- [ ] `packages/react/src/components/media/MediaPicker.tsx` (MODIFY)

### Design requirements

Match `vex-modal-head`, `vex-tabs`, `vex-modal-foot` styles:
- Modal header layout (icon + title + close)
- Tab styling (active states)
- Footer layout (left count + right buttons)
- Spacing, typography

**TODO:** User will update Tailwind classes manually.

## Step 18 — Visual styling: MediaUploadForm accordion ⏳ **TODO** [dev]

Update MediaUploadForm accordion items to match Claude Design.

**Reference design:** `.pi/design/claude-design/admin/upload.jsx` → `MediaModalCreateForm` component

### Files to modify

- [ ] `packages/react/src/components/media/MediaUploadForm.tsx` (MODIFY)

### Design requirements

Match the two-column layout:
- Left: Preview + derived metadata (read-only)
- Right: Editable form fields
- Accordion item styling
- Progress bar styling

**TODO:** User will update Tailwind classes manually.

## Step 19 — Optional: Dynamic field rendering in MediaUploadForm ⏳ **TODO** [dev]

### Changes to `EmptyInput.tsx`

**Add file selection with drop + picker:**

```tsx
import { useRef, useState } from "react";
import { Button, Icon } from "../../ui";

export interface UploadEmptyProps {
  /** Whether to allow multiple file selection (from hasMany). */
  allowMultiple: boolean;
  /** Callback when files are selected — opens picker with staged files. */
  onFilesSelected: (files: File[]) => void;
  /** Callback to open media picker in library mode. */
  onBrowseLibrary: () => void;
}

export function UploadEmpty({
  allowMultiple,
  onFilesSelected,
  onBrowseLibrary,
}: UploadEmptyProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(allowMultiple ? files : [files[0]!]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = ""; // Reset
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`vex-dropzone ${
          isDragActive ? "border-primary bg-primary/5" : ""
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="ico">
          <Icon name="Image" size={18} />
        </div>
        <div className="title">
          {isDragActive ? "Drop to upload" : "Drag an image here"}
        </div>
        <div className="sub">PNG, JPG, SVG, WebP · up to 10 MB</div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="mt-1"
        >
          <Icon name="Image" size={12} />
          Choose file{allowMultiple ? "s" : ""}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBrowseLibrary}
        className="self-start"
      >
        <Icon name="Folder" size={12} />
        Browse media library
      </Button>
    </div>
  );
}
```

### Changes to `Input.tsx`

**Add staged files state and picker tab control:**

```tsx
export function UploadFieldInput({ name, fieldDef, field, readOnly }) {
  const [activeField, setActiveField] = useQueryState(MODALS.editMedia.urlParam, parseAsString);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [pickerTab, setPickerTab] = useState<"library" | "upload">("library");
  
  const isOpen = activeField === name;
  const value = field.state.value || [];
  const config = useVexConfig();

  const adapterName: StorageAdapterSlug =
    config.mediaCollections.find((mc) => mc.slug === fieldDef.to)?.meta?.storageAdapter ??
    "convex";

  async function openPickerWithFiles(files: File[]) {
    setStagedFiles(files);
    setPickerTab("upload");
    await setActiveField(name);
  }

  async function openPickerLibrary() {
    setStagedFiles([]);
    setPickerTab("library");
    await setActiveField(name);
  }

  async function closePicker() {
    await setActiveField(null);
    setStagedFiles([]);
    setPickerTab("library");
  }

  async function handleSelect(mediaIds: string[]) {
    field.handleChange(mediaIds);
    await closePicker();
  }

  function handleRemove(mediaId?: string) {
    if (mediaId) {
      field.handleChange(value.filter((id) => id !== mediaId));
    } else {
      field.handleChange([]);
    }
  }

  function handleReorder(from: number, to: number) {
    field.moveValue(from, to);
  }

  if (readOnly) {
    return value.length > 0 ? (
      <UploadFilledState
        mediaIds={value}
        fieldDef={fieldDef}
        onRemove={handleRemove}
        openPicker={openPickerLibrary}
        adapterName={adapterName}
      />
    ) : (
      <div className="text-sm text-muted-foreground">—</div>
    );
  }

  // Empty state
  if (value.length === 0) {
    return (
      <>
        <UploadEmpty
          allowMultiple={fieldDef.hasMany}
          onFilesSelected={openPickerWithFiles}
          onBrowseLibrary={openPickerLibrary}
        />
        {isOpen && (
          <MediaPicker
            field={field}
            targetCollection={fieldDef.to}
            multi={fieldDef.hasMany}
            onSelect={handleSelect}
            onCancel={closePicker}
            defaultTab={pickerTab}
            stagedFiles={stagedFiles}
          />
        )}
      </>
    );
  }

  // Filled state
  return (
    <>
      <UploadFilledState
        mediaIds={value}
        adapterName={adapterName}
        fieldDef={fieldDef}
        onRemove={handleRemove}
        onReorder={handleReorder}
        openPicker={openPickerLibrary}
      />
      {isOpen && (
        <MediaPicker
          field={field}
          targetCollection={fieldDef.to}
          multi={fieldDef.hasMany}
          onSelect={handleSelect}
          onCancel={closePicker}
          defaultTab={pickerTab}
          stagedFiles={stagedFiles}
        />
      )}
    </>
  );
}
```

### Changes to `MediaPicker.tsx`

**Add `defaultTab` and `stagedFiles` props, forward to MediaUploadForm:**

```tsx
export interface MediaPickerProps {
  targetCollection: MediaCollectionSlug;
  field: TypedFieldApi<string[]>;
  multi: boolean;
  onSelect: (mediaIds: string[]) => void;
  onCancel: () => void;
  /** Default tab ("library" or "upload"). */
  defaultTab?: "library" | "upload";
  /** Pre-staged files for upload tab. */
  stagedFiles?: File[];
}

export function MediaPicker({
  field,
  targetCollection,
  multi,
  onSelect,
  onCancel,
  defaultTab = "library",
  stagedFiles = [],
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(field.state.value ?? []);
  const config = useVexConfig();

  const collection = config.mediaCollections.find((mc) => mc.slug === targetCollection);
  if (!collection) {
    throw new Error(`Media collection "${targetCollection}" not found`);
  }

  const adapterName: StorageAdapterSlug = collection.meta?.storageAdapter ?? "convex";

  const handleSelect = () => {
    onSelect(selectedIds);
    setSelectedIds([]);
  };

  const handleUploadComplete = (mediaIds: string[]) => {
    onSelect(mediaIds);
    setSelectedIds([]);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="vex-modal max-w-[760px]">
        {/* ... header ... */}

        <Tabs defaultValue={defaultTab} className="mt-3">
          <TabsList className="mx-5">
            <TabsTrigger value="library">
              <Icon name="Folder" size={13} className="mr-1.5" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Icon name="Plus" size={13} className="mr-1.5" />
              Upload new
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-0">
            <MediaLibraryGrid
              fieldName={field.name}
              targetCollection={targetCollection}
              multi={multi}
              onSelect={setSelectedIds}
              selectedIds={selectedIds}
            />
            <div className="vex-modal-foot">
              <span className="left">{selectedIds.length} selected</span>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={selectedIds.length === 0}>
                {multi && selectedIds.length > 1
                  ? `Select ${selectedIds.length}`
                  : "Select"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <MediaUploadForm
              collection={collection}
              adapterName={adapterName}
              multi={multi}
              stagedFiles={stagedFiles}
              onComplete={handleUploadComplete}
              onCancel={onCancel}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### Run tests

```bash
pnpm typecheck
```

## Step 16 — Optional: Dynamic field rendering in MediaUploadForm ⏳ **TODO** [dev]

Optionally extend MediaUploadForm to dynamically render additional fields from `collection.fields` using `fieldToInputComponent`.

**Currently:** Only filename and alt are editable. 
**Enhancement:** Auto-generate inputs for caption, tags, or any custom fields defined on the media collection.

**Pattern:** Similar to CollectionEditView — loop over `collection.fields` and render matching input component.

### Files to modify

- [ ] `packages/react/src/components/media/MediaUploadForm.tsx` (MODIFY)

### Changes to `MediaUploadForm.tsx`

**Add multi-file staging and form rendering:**

```tsx
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCollectionForm } from "../form";
import { vexConvexApi } from "@vexcms/core";
import { convexMutation } from "@convex-dev/react-query";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Button, Icon } from "../ui";

export interface MediaUploadFormProps {
  targetCollection: string;
  adapterName: StorageAdapterSlug;
  multi: boolean;
  stagedFiles: File[];
  onUploadComplete: (mediaIds: string[]) => void;
  onCancel: () => void;
}

interface StagedFileWithMetadata {
  file: File;
  id: string; // Temporary client-side ID
  filename: string;
  alt: string;
  // ... other editable fields based on collection config
}

export function MediaUploadForm({
  targetCollection,
  adapterName,
  multi,
  stagedFiles,
  onUploadComplete,
  onCancel,
}: MediaUploadFormProps) {
  const [files, setFiles] = useState<StagedFileWithMetadata[]>(() =>
    stagedFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      filename: file.name,
      alt: "",
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media collection config to get field definitions
  const { data: collectionConfig } = useQuery({
    ...vexConvexApi.getCollectionConfig({ slug: targetCollection }),
  });

  const handleAddFiles = (newFiles: File[]) => {
    const newStagedFiles = newFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      filename: file.name,
      alt: "",
    }));
    setFiles((prev) => (multi ? [...prev, ...newStagedFiles] : newStagedFiles));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleAddFiles(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleAddFiles(selectedFiles);
    e.target.value = "";
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFieldChange = (id: string, field: string, value: any) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const createdIds: string[] = [];

    try {
      for (const fileData of files) {
        // 1. Generate upload URL
        const { uploadUrl, storageId } = await vexConvexApi.media.generateUploadUrl({
          collection: targetCollection,
        });

        // 2. Upload file to storage
        setUploadProgress((prev) => ({ ...prev, [fileData.id]: 0 }));
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: fileData.file,
        });

        if (!response.ok) throw new Error("Upload failed");
        setUploadProgress((prev) => ({ ...prev, [fileData.id]: 100 }));

        // 3. Create media document
        const mediaDocId = await vexConvexApi.media.create({
          collection: targetCollection,
          storageId,
          filename: fileData.filename,
          mimeType: fileData.file.type,
          size: fileData.file.size,
          alt: fileData.alt,
          // ... other fields from collectionConfig
        });

        createdIds.push(mediaDocId);
      }

      onUploadComplete(createdIds);
    } catch (error) {
      console.error("Upload failed:", error);
      // TODO: Show error toast
    } finally {
      setIsUploading(false);
    }
  };

  // Empty state - no files staged yet
  if (files.length === 0) {
    return (
      <div className="p-5">
        <div
          className="vex-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="ico">
            <Icon name="Image" size={18} />
          </div>
          <div className="title">Drag files here, or choose</div>
          <div className="sub">
            PNG, JPG, SVG, WebP · up to 10 MB
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2"
          >
            <Icon name="Image" size={12} />
            Choose file{multi ? "s" : ""}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multi}
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
        <div className="vex-modal-foot mt-4">
          <span className="left">Step 1 of 2 · choose files</span>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled>Create &amp; select</Button>
        </div>
      </div>
    );
  }

  // Files staged - show forms
  return (
    <div className="flex flex-col gap-4 p-5">
      <Accordion type="multiple" defaultValue={files.map((f) => f.id)}>
        {files.map((fileData, index) => (
          <AccordionItem key={fileData.id} value={fileData.id}>
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">
                  {index + 1}
                </span>
                <Icon name="Image" size={14} />
                <span className="text-sm font-medium truncate">
                  {fileData.filename}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-3 pt-3">
                {/* Filename input */}
                <div>
                  <label className="text-xs font-medium">Filename</label>
                  <input
                    type="text"
                    className="vex-input"
                    value={fileData.filename}
                    onChange={(e) =>
                      handleFieldChange(fileData.id, "filename", e.target.value)
                    }
                  />
                </div>

                {/* Alt text input */}
                <div>
                  <label className="text-xs font-medium">Alt text</label>
                  <input
                    type="text"
                    className="vex-input"
                    value={fileData.alt}
                    onChange={(e) =>
                      handleFieldChange(fileData.id, "alt", e.target.value)
                    }
                    placeholder="Describe the image"
                  />
                </div>

                {/* TODO: Render other fields from collectionConfig */}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(fileData.id)}
                  className="self-start text-destructive"
                >
                  <Icon name="Trash" size={12} />
                  Remove file
                </Button>

                {uploadProgress[fileData.id] !== undefined && (
                  <div className="vex-progress">
                    <span style={{ width: `${uploadProgress[fileData.id]}%` }} />
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {multi && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Icon name="Plus" size={12} />
          Add more files
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple={multi}
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="vex-modal-foot">
        <span className="left">
          Step 2 of 2 · {files.length} file{files.length === 1 ? "" : "s"}
        </span>
        <Button variant="ghost" onClick={onCancel} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Cancel"}
        </Button>
        <Button onClick={handleUpload} disabled={isUploading}>
          {isUploading
            ? "Uploading..."
            : `Create & select (${files.length})`}
        </Button>
      </div>
    </div>
  );
}
```

### Edge-case notes

> **Edge: User removes all files.** Show empty dropzone again.

> **Edge: Upload fails.** Show error toast, keep forms open so user can retry.

> **Edge: Single upload mode.** Adding new files replaces existing staged file.

> **Edge: Alt text missing.** Still allow upload, but warn user (handled by collection validation).

### Run tests

```bash
pnpm typecheck
pnpm --filter @vexcms/react test
```

## Verification (mandatory)

Run these commands to verify the implementation is complete:

```bash
# Typecheck
pnpm typecheck

# Test React package
pnpm --filter @vexcms/react test

# Lint
pnpm lint

# Start dev server and manually verify UI
pnpm dev:app
# Navigate to:
# - http://localhost:3020/admin/images (MediaCollectionListView already exists)
# - Create a collection with an upload field, verify all states (empty, filled single/multi, uploading, error)
# - Open media picker modal, verify Library + Upload new tabs
# - Test single-select and multi-select modes
```

## Success Criteria

User-observable outcomes that prove the implementation is complete:

1. **FilePreview component fetches real images:**
   - Image MIME types (`image/png`, `image/jpeg`, etc.) render actual `<img>` with fetched URL
   - SVG shows type icon, video shows video icon, other files show generic file icon
   - Fallback to file icon on load error (403, 5xx)

2. **Upload field input shows all states correctly:**
   - Empty state renders dropzone + "Browse media library" button
   - Filled state renders FilePreview thumbnails (single or multi via `UploadFilledState`)
   - Single mode shows one item row with Replace/Remove actions
   - Multi mode shows list of item rows + "Add image" / "Browse library" buttons + count display

3. **Field-local modals work correctly:**
   - Clicking "Browse media library" on field A sets URL param `?selectMedia=fieldA`
   - Only field A's `<MediaPicker>` mounts (field B/C render `{false && <MediaPicker />}` = nothing)
   - Closing modal via Cancel or selection clears URL param
   - Multiple fields on same form don't interfere with each other
   - Nested fields work (e.g., `gallery.0`, `gallery.1` get unique URL params)

4. **MediaLibraryGrid search works:**
   - Typing in search input debounces for 200ms before firing query
   - Empty search uses `find` query (all documents)
   - Non-empty search uses `search` query with `search_${useAsTitle}` index
   - Loading spinner shows during debounce period
   - Results update automatically after debounce

5. **Form state behavior is correct:**
   - Selecting media in picker calls `field.handleChange()` directly (no localStorage/URL serialization)
   - Changes only affect TanStack Form state (not Convex DB)
   - Refreshing page resets form to Convex data (loses unsaved changes)
   - User must click "Save" in CollectionEditView to persist changes
   - This is the correct "undo" behavior

6. **MediaUploadForm uses form utilities:**
   - Step 2 auto-generates inputs from `collection.fields` via `fieldToInputComponent`
   - System fields (name/filename, alt, caption) + adapter-declared fields all render correctly
   - Form validation works (required fields block submit)

7. **Upload cell component renders real thumbnails:**
   - Empty: shows "—" placeholder
   - Single value: shows FilePreview thumbnail + filename
   - Multiple values: shows FilePreview thumbnail + filename + `+N` badge

8. **MediaFieldValue component works:**
   - Collapsed state shows FilePreview thumbnail + metadata line + "Edit" button
   - Expanded state shows full metadata grid
   - Alt missing warning appears when alt text is empty for images

9. **Type safety:**
   - `UploadFieldInput` accepts `value: string[]` and `onChange: (value: string[]) => void`
   - `MediaPicker` accepts `multi: boolean` and adapts UI behavior accordingly
   - `FilePreview` accepts `mediaId`, `adapter`, `mimeType` and fetches URL correctly
   - MODALS constant includes `selectMedia` entry
   - No TypeScript errors in `pnpm typecheck`

10. **Tests pass:**

- All React package tests pass (`pnpm --filter @vexcms/react test`)

## References

- **Spec 32** — Media collection core types, storage adapter integration, API factories
- **Design walkthrough** — `.pi/design/claude-design/admin/upload.jsx` (all UI component designs)
- **Existing components** — `MediaCollectionListView`, `CreateMediaModal`, `MediaUploadDropzone` (already functional)
- **Form utilities** — `useCollectionForm`, `fieldToInputComponent` (same pattern as `CollectionEditView`)
- **Developer preferences** — `.pi/agent-docs/standards/developer-preferences.md`
- **JSDoc conventions** — `.pi/agent-docs/standards/jsdoc-conventions.md`
- **Test writing** — `.pi/agent-docs/standards/testing/test-writing.md`
