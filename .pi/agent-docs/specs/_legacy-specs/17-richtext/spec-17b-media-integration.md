# 17b — Rich Text Media Integration

## Overview

Connects the richtext editor's image feature to VEX media collections. When a `mediaCollection` is configured on a richtext field, users can pick images from the media library, paste images from clipboard (auto-upload), drop image files into the editor (auto-upload), and resize images inline. When no media collection is set, the existing URL-only image insertion remains.

## Design Decisions

1. **Same media pattern as UploadField** — The `renderRichTextField` callback receives media picker state and upload modal triggers, following the same architecture as `renderUploadField`. The admin-next `CollectionEditView` wires up `useMediaPickerState` for richtext fields that have a `mediaCollection`.

2. **Placeholder during upload** — When a file is pasted or dropped, a loading placeholder is inserted into the editor immediately. Once the upload completes and the media document is created, the placeholder is replaced with the real image node containing `url` and `mediaId`.

3. **Plate's built-in DnD** — File drops use Plate's native browser drag-and-drop handling, not `@hello-pangea/dnd` (which is for list reordering, not file drops into editors).

4. **Inline resize** — Images get drag handles via CSS. Width is stored on the image node and applied as an inline style. Minimum width clamped to 50px.

5. **Media-gated features** — Paste-to-upload and drop-to-upload only work when `mediaCollection` is configured. Without it, the editor only supports URL-based image insertion.

## Out of Scope

- Image cropping / filters / effects
- Caption / figcaption (future custom blocks spec)
- Image alignment (left/center/right)
- Multiple media collections per richtext field

## Target Directory Structure

```
packages/core/src/types/
  fields.ts                              # + mediaCollection on RichTextFieldDef

packages/richtext/src/editor/
  PlateEditorField.tsx                   # + pass mediaCollection + upload handlers
  components/
    image/
      ImageUpload.tsx                    # REWRITE — media picker tabs + URL input
      ImagePlaceholder.tsx               # NEW — loading skeleton during upload
      useImageUpload.ts                  # NEW — upload logic (paste/drop/manual)
    editorElements.tsx                   # + resizable ImageElement

packages/admin-next/src/
  components/AdminPage.tsx               # + media props on renderRichTextField
  views/CollectionEditView.tsx           # + media picker state for richtext fields

apps/test-app/src/app/admin/
  AdminPageWrapper.tsx                   # + wire media picker to richtext
```

## Implementation Order

1. **Step 1: Add `mediaCollection` to `RichTextFieldDef`** — core type change
2. **Step 2: Expand `renderRichTextField` props** — add media picker state, upload handlers
3. **Step 3: `useImageUpload` hook** — shared upload logic for paste, drop, and manual upload
4. **Step 4: `ImagePlaceholder` component** — loading skeleton in editor
5. **Step 5: Rewrite `ImageUpload` component** — media picker grid + URL tabs
6. **Step 6: Paste-to-upload** — intercept paste events, upload image files
7. **Step 7: Drop-to-upload** — intercept drop events, upload image files
8. **Step 8: Inline image resize** — drag handles on ImageElement
9. **Step 9: Wire admin-next** — CollectionEditView media state for richtext
10. **Step 10: Wire test-app** — AdminPageWrapper passes media props

---

## Step 1: Add `mediaCollection` to `RichTextFieldDef`

- [ ] Add `mediaCollection?: string` to `RichTextFieldDef` in `packages/core/src/types/fields.ts`
- [ ] Run `pnpm --filter @vexcms/core build`

### Modify: `packages/core/src/types/fields.ts`

Add to `RichTextFieldDef`:

```ts
  /**
   * Media collection slug for image uploads.
   * When set, the editor can pick images from the specified media collection,
   * and paste/drop image uploads are auto-saved to this collection.
   * When not set, images can only be inserted by URL.
   */
  mediaCollection?: string;
```

---

## Step 2: Expand `renderRichTextField` props

- [ ] Update `renderRichTextField` type in `AppFormProps` (`packages/ui/src/components/form/AppForm.tsx`)
- [ ] Update `renderRichTextField` type in `AdminPage` (`packages/admin-next/src/components/AdminPage.tsx`)
- [ ] Update `renderRichTextField` type in `CollectionEditView` (`packages/admin-next/src/views/CollectionEditView.tsx`)
- [ ] Run `pnpm --filter @vexcms/ui build && pnpm --filter @vexcms/admin-next build`

### Type for `renderRichTextField`:

```ts
renderRichTextField?: (props: {
  field: any;
  fieldDef: any;
  name: string;
  /** Media picker results (images from the media collection). Empty if no mediaCollection. */
  mediaResults?: MediaDocument[];
  mediaSearchTerm?: string;
  onMediaSearchChange?: (term: string) => void;
  mediaCanLoadMore?: boolean;
  onMediaLoadMore?: () => void;
  mediaIsLoading?: boolean;
  /** Opens the upload modal for the media collection. */
  onUploadNew?: () => void;
  /** Generates a presigned upload URL for direct file upload. */
  generateUploadUrl?: () => Promise<string>;
  /** Creates a media document after file upload completes. Returns the document ID. */
  createMediaDocument?: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<string>;
}) => React.ReactNode;
```

All media-related props are optional — when `mediaCollection` is not set, they're simply not passed.

---

## Step 3: `useImageUpload` hook

- [ ] Create `packages/richtext/src/editor/components/image/useImageUpload.ts`

### File: `packages/richtext/src/editor/components/image/useImageUpload.ts`

```ts
import { useCallback } from "react";

interface UseImageUploadProps {
  /** Media collection slug. When not set, upload is disabled. */
  mediaCollection?: string;
  /** Generates a presigned upload URL. */
  generateUploadUrl?: () => Promise<string>;
  /** Creates a media document. Returns the new document ID. */
  createMediaDocument?: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<string>;
}

interface UploadResult {
  url: string;
  mediaId: string;
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Hook that provides a function to upload an image file to the media collection.
 * Returns null if media collection is not configured.
 */
export function useImageUpload(props: UseImageUploadProps) {
  // TODO: implement
  //
  // 1. If props.mediaCollection or props.generateUploadUrl or props.createMediaDocument
  //    is missing, return { uploadFile: null, isEnabled: false }
  //
  // 2. Create an `uploadFile` callback that:
  //    a. Takes a File object
  //    b. Calls props.generateUploadUrl() to get the presigned URL
  //    c. Uploads the file via fetch(url, { method: "POST", body: file })
  //    d. Extracts storageId from the response
  //    e. If the file is an image, reads width/height using Image() or createImageBitmap()
  //    f. Calls props.createMediaDocument({
  //         collectionSlug: props.mediaCollection,
  //         fields: { storageId, filename: file.name, mimeType: file.type, size: file.size, url: "", alt: "", width, height }
  //       })
  //    g. Returns { url: resolvedUrl, mediaId: documentId, width, height }
  //
  // 3. Return { uploadFile, isEnabled: true }
  //
  // Edge cases:
  // - Upload fails (network error): throw, let caller handle
  // - Non-image file: still upload but no width/height
  // - generateUploadUrl fails: throw
  throw new Error("Not implemented");
}
```

---

## Step 4: `ImagePlaceholder` component

- [ ] Create `packages/richtext/src/editor/components/image/ImagePlaceholder.tsx`

### File: `packages/richtext/src/editor/components/image/ImagePlaceholder.tsx`

```ts
"use client";

/**
 * Loading placeholder shown in the editor while an image is being uploaded.
 * Displays a pulsing skeleton with a spinner.
 */
export function ImagePlaceholder() {
  return (
    <div
      contentEditable={false}
      style={{
        background: "var(--muted)",
        borderRadius: "var(--radius)",
        padding: 24,
        margin: "8px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "var(--muted-foreground)",
        fontSize: 13,
        animation: "vex-pulse 1.5s ease-in-out infinite",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vex-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />
      Uploading image…
    </div>
  );
}
```

---

## Step 5: Rewrite `ImageUpload` component

- [ ] Rewrite `packages/richtext/src/editor/components/image/ImageUpload.tsx`

The new `ImageUpload` has two modes:

1. **Media collection mode** (`mediaResults` provided) — shows a tabbed UI:
   - Tab 1: Media picker grid (browse/search existing images)
   - Tab 2: URL input (manual URL)

2. **URL-only mode** (no `mediaResults`) — same as current, just URL + alt text inputs

### File: `packages/richtext/src/editor/components/image/ImageUpload.tsx`

```tsx
"use client";

// TODO: implement
//
// Props interface:
// {
//   onClose: () => void;
//   onInsertUrl: (props: { url: string; alt?: string }) => void;
//   onInsertMedia: (props: { url: string; mediaId: string; alt?: string }) => void;
//   onUploadNew?: () => void;
//   mediaResults?: MediaDocument[];
//   mediaSearchTerm?: string;
//   onMediaSearchChange?: (term: string) => void;
//   mediaCanLoadMore?: boolean;
//   onMediaLoadMore?: () => void;
//   mediaIsLoading?: boolean;
// }
//
// 1. Detect mode: if mediaResults is provided, show tabbed UI
//    Otherwise show URL-only form
//
// 2. Media tab:
//    a. Search input at top
//    b. Grid of image thumbnails (3 columns)
//    c. Click thumbnail → call onInsertMedia({ url: doc.url, mediaId: doc._id, alt: doc.alt })
//    d. "Upload new" button at bottom → calls onUploadNew()
//    e. Scroll-to-load-more when canLoadMore
//
// 3. URL tab (or only view when no media):
//    a. URL text input
//    b. Alt text input
//    c. Insert button → calls onInsertUrl({ url, alt })
//
// 4. All styling uses CSS variables
//
// Edge cases:
// - Empty media results: show "No images found" message
// - Loading state: show skeleton placeholders
// - Only show image MIME types from results (filter non-images)
```

---

## Step 6: Paste-to-upload

- [ ] Add paste handler to `PlateEditorField.tsx`

### Modify: `packages/richtext/src/editor/PlateEditorField.tsx`

```ts
// TODO: implement
//
// 1. Add an onPaste handler to PlateContent (or use Plate's plugin system)
//
// 2. In the paste handler:
//    a. Check if clipboardData contains files
//    b. Filter for image files only (file.type.startsWith("image/"))
//    c. If no image files, let default paste behavior continue (text/HTML)
//    d. If mediaCollection is NOT configured, ignore file pastes
//
// 3. For each image file:
//    a. Insert an ImagePlaceholder node at cursor position
//    b. Call uploadFile(file) from useImageUpload
//    c. On success: replace placeholder with real image node { type: "img", url, mediaId, width, height }
//    d. On failure: remove placeholder, show error (console.error or toast)
//
// 4. Prevent default paste behavior for the file items
//
// Edge cases:
// - Paste contains both text and image: prefer image
// - Paste multiple images: upload all in parallel
// - Upload fails mid-paste: remove that placeholder, keep others
```

---

## Step 7: Drop-to-upload

- [ ] Add drop handler to `PlateEditorField.tsx`

### Modify: `packages/richtext/src/editor/PlateEditorField.tsx`

```ts
// TODO: implement
//
// 1. Add onDrop handler to PlateContent (or via Plate plugin)
//
// 2. Same logic as paste:
//    a. Check dataTransfer.files for image files
//    b. If mediaCollection not configured, ignore
//    c. Insert placeholders, upload, replace on complete
//
// 3. Prevent default browser behavior (opening the file)
//
// Edge cases:
// - Drop non-image file: ignore
// - Drop multiple files: handle all
```

---

## Step 8: Inline image resize

- [ ] Update `ImageElement` in `packages/richtext/src/editor/components/editorElements.tsx`

### Modify: `ImageElement` in `editorElements.tsx`

```tsx
// TODO: implement
//
// 1. Read width from element props: element.width (stored as number, pixels)
//
// 2. Add a resize handle (right edge):
//    a. A small drag handle element positioned at the right edge of the image
//    b. On mousedown: start tracking mouse movement
//    c. On mousemove: calculate new width based on delta
//    d. Clamp to min 50px, max container width
//    e. On mouseup: update the node's width property via editor.tf.setNodes()
//
// 3. Apply width as inline style: style={{ width: element.width || "100%" }}
//
// 4. The stored width persists in the JSON and is used by the static renderer too
//
// Edge cases:
// - No initial width: default to 100% (full container)
// - Window resize: percentage-based won't work since we store px — consider max-width: 100%
// - Touch devices: may not work well, acceptable for admin panel
```

---

## Step 9: Wire `admin-next` — CollectionEditView media state

- [ ] Modify `CollectionEditView` to detect richtext fields with `mediaCollection`
- [ ] Call `useMediaPickerState` for those fields
- [ ] Pass media state through `renderRichTextField`
- [ ] Handle upload modal for richtext image uploads

### Modify: `packages/admin-next/src/views/CollectionEditView.tsx`

```ts
// TODO: implement
//
// 1. In the component body, find all richtext fields that have mediaCollection set:
//    const richtextMediaFields = fieldEntries.filter(
//      e => e.field.type === "richtext" && e.field.mediaCollection
//    );
//
// 2. For each, create media picker state using useMediaPickerState:
//    → same pattern as upload fields
//    → keyed by field name
//
// 3. Pass to renderRichTextField:
//    renderRichTextField={({ field, fieldDef, name }) => {
//      const mediaState = richtextMediaStates[name];
//      return renderRichTextField({
//        field, fieldDef, name,
//        mediaResults: mediaState?.results,
//        mediaSearchTerm: mediaState?.searchTerm,
//        onMediaSearchChange: mediaState?.setSearchTerm,
//        mediaCanLoadMore: mediaState?.canLoadMore,
//        onMediaLoadMore: mediaState?.loadMore,
//        mediaIsLoading: mediaState?.isLoading,
//        onUploadNew: () => handleOpenUploadModal(name, fieldDef.mediaCollection),
//        generateUploadUrl,
//        createMediaDocument,
//      });
//    }
//
// Edge cases:
// - richtext field without mediaCollection: don't create picker state, pass no media props
// - Multiple richtext fields with different mediaCollections: each gets its own state
```

---

## Step 10: Wire test-app `AdminPageWrapper`

- [ ] Update `apps/test-app/src/app/admin/AdminPageWrapper.tsx` to pass media props to PlateEditorField
- [ ] Update posts collection to set `mediaCollection: "media"` on the content field
- [ ] Run full build

### Modify: `AdminPageWrapper.tsx`

Pass the media props through to `PlateEditorField`:

```tsx
renderRichTextField={({ field, fieldDef, name, mediaResults, onUploadNew, generateUploadUrl, createMediaDocument, ...mediaProps }) => (
  <PlateEditorField
    value={field.state.value}
    onChange={(val) => field.handleChange(val)}
    name={name}
    label={fieldDef.label ?? name}
    description={fieldDef.description}
    features={defaultFeatures}
    mediaCollection={fieldDef.mediaCollection}
    mediaResults={mediaResults}
    onUploadNew={onUploadNew}
    generateUploadUrl={generateUploadUrl}
    createMediaDocument={createMediaDocument}
    {...mediaProps}
  />
)}
```

### Modify: `posts.ts` collection

```ts
content: richtext({
  label: "Content",
  mediaCollection: "media",
}),
```

---

## Success Criteria

- [ ] `richtext({ mediaCollection: "media" })` enables media picker in the image toolbar
- [ ] Image toolbar shows media grid + URL tabs when mediaCollection is set
- [ ] Image toolbar shows URL-only when mediaCollection is not set
- [ ] Selecting from media grid inserts image with `url` and `mediaId` on the node
- [ ] Paste image from clipboard auto-uploads to media collection and inserts image
- [ ] Drop image file into editor auto-uploads and inserts image
- [ ] Upload shows placeholder in editor while in progress
- [ ] Images can be resized inline by dragging the right edge
- [ ] Resize width is stored on the node and rendered by the static renderer
- [ ] All existing features still work (marks, blocks, tables, etc.)
- [ ] `pnpm build` and `pnpm typecheck` pass
