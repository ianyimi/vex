# Media Collection UI - Bug Fixes

## Files Requiring Changes

### Issue 1: DnD Drag Handle Errors
- `/packages/react/src/components/fields/upload/FilledInput.tsx` ✅ (already applied)
- `/packages/react/src/components/fields/upload/Input.tsx` (if issue persists)

### Issue 2: "No more than null Sections allowed"
- `/packages/core/src/fields/blocks/inputSchema.ts`
- `/packages/core/src/fields/blocks/types.ts` (optional)
- `/apps/www/src/vexcms/collections/pages.ts` (check config)

### Issue 3: "Invalid input: expected string, received null" (ogImage)
- `/packages/core/src/fields/url/inputSchema.ts` ⚠️ **HIGH PRIORITY**
- `/apps/www/src/vexcms/collections/pages.ts` (optional config change)

### Issue 4: SVG Files Show "T" Icon
- `/packages/react/src/components/media/FilePreview.tsx`

---

## Issue 1: DnD "Unable to find drag handle" Errors

### Symptoms
```
@hello-pangea/dnd
A setup problem was encountered.
> Invariant failed: Draggable[id: m5730qy3...]: Unable to find drag handle
Unable to find drag handle with id "m572f2pp7..." as no handle with a matching id was found
```

### Root Cause
The DragHandle component needs to be rendered **inside** every Draggable, even when not visible. The `@hello-pangea/dnd` library registers drag handles during the initial render pass and expects them to exist.

### Current Code Problem
**File**: `/packages/react/src/components/fields/upload/FilledInput.tsx`

The code conditionally renders either a `DragHandle` or a placeholder `<span>`:
```tsx
{showDragHandle ? (
  <DragHandle />
) : (
  <span className="grip opacity-0 pointer-events-none">
    <Icon name="Grip" size={13} />
  </span>
)}
```

This breaks because when `showDragHandle={false}`, there's no actual `DragHandle` component, so `@hello-pangea/dnd` can't find it.

### Proposed Fix
**File**: `/packages/react/src/components/fields/upload/FilledInput.tsx`

**Already applied** - Always render `DragHandle` but make it invisible:
```tsx
<DragHandle className={showDragHandle ? "" : "opacity-0 pointer-events-none"} />
```

### If Issue Persists
The problem might be a **React key or mounting issue**. Check if:

1. **Stale keys**: When items are added from MediaPicker, the `key={id}` in the Draggable might be reused or stale
2. **Mount timing**: DragHandle registers with dnd on mount, but if the parent re-renders before registration completes, it fails
3. **Multiple Droppables**: If there are multiple upload fields on the page, each needs a unique Droppable ID

**Debug steps:**
```tsx
// Add console.log to see when items mount
<Draggable key={id} id={id} index={index}>
  {console.log('Draggable mounted:', id)}
  <UploadItemRow ... />
</Draggable>
```

**Potential fix - Force remount on mediaIds change:**
**File**: `/packages/react/src/components/fields/upload/FilledInput.tsx`

```tsx
// In UploadFilledState component
return (
  <div className="flex flex-col gap-2" key={JSON.stringify(mediaIds)}>
    {/* ^ Force full remount when array changes */}
```

**Alternative fix - Use stable keys:**
**File**: `/packages/react/src/components/fields/upload/Input.tsx`

The issue might be that media IDs from Convex are being used as React keys before the full document loads. Ensure `mediaIds` array is stable:

```tsx
// When calling FilledInput
<UploadFilledState
  mediaIds={field.state.value ?? []}  // Ensure never undefined
  // ...
/>
```

---

## Issue 2: "No more than null Sections allowed"

### Symptoms
Error when saving forms with blocks field:
```
No more than null Sections allowed.
```

### Root Cause
**File**: `/packages/core/src/fields/blocks/inputSchema.ts`

The validation message uses `field.max` directly:
```ts
if (field.max !== undefined) {
  schema = schema.max(
    field.max,
    `No more than ${field.max} ${field.labels.plural} allowed.`,
  );
}
```

But somewhere `field.max` is being set to `null` instead of `undefined` or a number, causing the message to render "null".

### Diagnostic Steps
**File**: `/apps/www/src/vexcms/collections/pages.ts` (or your collection config)

Check the blocks field definition:
```ts
blocks: blocks({
  max: ???,  // ← Check this value
  blocks: [...]
})
```

**Possible causes:**
1. `max: null` explicitly set (should be `max: undefined` or omitted)
2. Database has old documents with `max: null` serialized
3. Type coercion somewhere converts `undefined` → `null`

### Proposed Fix 1: Schema Validation (Defensive)
**File**: `/packages/core/src/fields/blocks/inputSchema.ts`

Around line 60-65, change:
```ts
if (field.max !== undefined && field.max !== null) {
  schema = schema.max(
    field.max,
    `No more than ${field.max} ${field.labels.plural} allowed.`,
  );
}
```

### Proposed Fix 2: Field Definition (Type Safety)
**File**: `/packages/core/src/fields/blocks/types.ts`

Ensure the type doesn't allow `null`:
```ts
export interface BlocksField<TFieldMeta extends {} = {}> {
  // ...
  max?: number;  // ← Should not be `number | null`
}
```

### Proposed Fix 3: Config Check
**File**: `/apps/www/src/vexcms/collections/pages.ts` (or wherever your blocks field is defined)

Ensure:
```ts
// ❌ Bad
blocks: blocks({
  max: null,  // Don't do this
})

// ✅ Good
blocks: blocks({
  max: 10,  // Or omit entirely
})
```

---

## Issue 3: "Invalid input: expected string, received null" for `ogImage`

### Symptoms
Error when saving a page with an empty URL field:
```
Invalid input: expected string, received null
Field: ogImage (url field)
```

### Root Cause
**File**: `/packages/core/src/fields/url/inputSchema.ts`

The schema is:
```ts
let inputSchema = z.url();
```

`z.url()` expects a **non-empty string** that is a valid URL. It rejects:
- `null`
- `undefined`
- `""` (empty string)

But when a URL input is empty, the form value is likely `null` or `""`.

### Current Field Definition
**File**: `/apps/www/src/vexcms/collections/pages.ts`

```ts
ogImage: url({
  label: "OG Image",
  description: "...",
  // required: false (implied)
})
```

### Proposed Fix 1: Allow Empty String (Recommended)
**File**: `/packages/core/src/fields/url/inputSchema.ts`

Replace the `urlFieldToInputSchema` function (starts around line 23):
```ts
export function urlFieldToInputSchema(props: { field: UrlField }): ZodType {
  const { field } = props;

  let inputSchema: ZodType;
  
  if (field.required) {
    // Required: must be valid URL with at least 1 char
    inputSchema = z.string().url().min(1, "This field is required.");
  } else {
    // Optional: allow empty string OR valid URL
    inputSchema = z.union([
      z.string().url(),
      z.literal(""),
    ]);
  }

  if (field.defaultValue !== undefined) {
    inputSchema = inputSchema.default(field.defaultValue);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

### Proposed Fix 2: Transform Null to Empty String
**File**: `/packages/core/src/fields/url/inputSchema.ts`

```ts
export function urlFieldToInputSchema(props: { field: UrlField }): ZodType {
  const { field } = props;

  let inputSchema: ZodType = z
    .string()
    .nullable()
    .transform(val => val ?? "")  // Convert null → ""
    .pipe(
      field.required
        ? z.string().url().min(1, "This field is required.")
        : z.union([z.string().url(), z.literal("")])
    );

  // ... rest of schema
}
```

### Proposed Fix 3: Make Field Nullable in Schema
**File**: `/packages/core/src/fields/url/inputSchema.ts`

```ts
let inputSchema: ZodType;

if (field.required) {
  inputSchema = z.string().url().min(1, "This field is required.");
} else {
  inputSchema = z.string().url().nullable().optional();
  // ↑ Accepts null, undefined, or valid URL
}
```

### Proposed Fix 4: Set Empty Default in Collection Config
**File**: `/apps/www/src/vexcms/collections/pages.ts`

```ts
ogImage: url({
  label: "OG Image",
  defaultValue: "",  // ← Ensure empty string, not null
})
```

**Recommended approach**: Fix 1 (allow empty string for optional fields) is most intuitive for forms.

---

## Issue 4: SVG Files Show Letter "T" Instead of Preview

### Symptoms
In `FilePreview` component, SVG files show an icon with letter "T" (Type icon) instead of rendering the actual SVG image.

### Current Code
**File**: `/packages/react/src/components/media/FilePreview.tsx`

Around line 80:
```tsx
if (isSvg) {
  return (
    <IconWrapper>
      <Icon name="Type" size={size} className="text-muted-foreground" />
    </IconWrapper>
  );
}
```

### Why SVGs Aren't Rendered
Comment in code says:
> SVG → show type icon (SVG is vector, not raster)

This was a **design decision**, not a technical limitation. SVGs can be rendered as images.

### Proposed Fix: Render SVGs as Images
**File**: `/packages/react/src/components/media/FilePreview.tsx`

Replace lines 44-90 with:
```tsx
const isSvg = mimeType === "image/svg+xml";
const isImage = mimeType.startsWith("image/");  // ← Include SVGs now
const isVideo = mimeType.startsWith("video/");

// Remove the separate SVG check - let it fall through to image handling
if (isImage && urlResponse?.url) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={wrapperStyle}>
      <VexImage
        src={urlResponse.url}
        alt={alt}
        className="h-full w-full object-cover"
        onError={(e) => {
          // Fallback to Type icon on load error (for SVGs too)
          const wrapper = e.currentTarget.parentElement;
          if (wrapper) {
            wrapper.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"><svg width="${size * 0.3}" height="${size * 0.3}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-6"/><polyline points="14 2 14 8 20 8"/><path d="M5 17a2 2 0 0 0 2 2h6"/></svg></div>`;
          }
        }}
      />
    </div>
  );
}

// Remove this block:
// if (isSvg) { ... }
```

### Alternative: Use Native `<img>` for SVGs
**File**: `/packages/react/src/components/media/FilePreview.tsx`

If `VexImage` (Next.js Image) doesn't support SVGs well, add this before the main image block (around line 70):
```tsx
if (isSvg && urlResponse?.url) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={wrapperStyle}>
      <img
        src={urlResponse.url}
        alt={alt}
        className="h-full w-full object-contain"  // ← object-contain for SVGs
      />
    </div>
  );
}
```

### Alternative: Keep Type Icon But Make It Visual
**File**: `/packages/react/src/components/media/FilePreview.tsx`

If you want to keep the current approach but make it clearer (around line 80):
```tsx
if (isSvg) {
  return (
    <IconWrapper>
      <Icon name="FileType2" size={size * 0.6} className="text-primary" />
      <span className="absolute bottom-0 right-0 text-[8px] font-mono text-muted-foreground">
        SVG
      </span>
    </IconWrapper>
  );
}
```

**Recommended**: Render SVGs as images (first fix) - users expect to see their uploaded SVG, not an icon placeholder.

---

## Testing Checklist

### Issue 1 (DnD)
- [ ] Upload multiple images to a `hasMany: true` upload field
- [ ] Verify no console errors about drag handles
- [ ] Try dragging items to reorder
- [ ] Remove an item and add a new one
- [ ] Verify drag still works after add/remove

### Issue 2 (Blocks null)
- [ ] Find blocks field with `max: null` in config
- [ ] Change to `max: undefined` or remove the property
- [ ] Try saving a page with blocks
- [ ] Verify error message shows correct number if max is set

### Issue 3 (URL null)
- [ ] Find a page with empty `ogImage` field
- [ ] Try to save it
- [ ] Verify no validation error for empty optional URL
- [ ] Fill in invalid URL (e.g., "not-a-url")
- [ ] Verify validation error shows

### Issue 4 (SVG preview)
- [ ] Upload an SVG file to media library
- [ ] View it in MediaLibraryGrid
- [ ] Verify SVG renders (not Type icon)
- [ ] Select SVG in upload field
- [ ] Verify SVG renders in FilledInput thumbnail

---

## Implementation Priority

1. **Issue 3 (URL null)** - Blocks form submission, high impact
2. **Issue 4 (SVG preview)** - User-facing, easy fix
3. **Issue 2 (Blocks null)** - Check config first (might not be a code issue)
4. **Issue 1 (DnD)** - Already partially fixed, test before deeper changes

---

## Notes

- All fixes should include tests after implementation
- Check if any of these issues appear in the existing test suite
- Consider adding Zod schema tests for edge cases (null, empty string, etc.)
- DnD issue might need a deeper investigation into React 19 compatibility with `@hello-pangea/dnd`
