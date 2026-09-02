# JSDoc Additions for Spec 32b Steps 10-19

This document contains all JSDoc comments that need to be added to code snippets in the spec.

---

## Step 10 - MediaUploadForm & MediaPicker

### MediaUploadForm - Already Added ✅

### MediaPicker - Part B

```tsx
/**
 * Props for the MediaPicker component.
 */
interface MediaPickerProps {
  /** The slug of the target media collection. */
  targetCollection: MediaCollectionSlug;
  /** The upload field's TanStack Form API. */
  field: TypedFieldApi<string[]>;
  /** Whether to allow multi-select (from field.hasMany). */
  multi: boolean;
  /** Called with selected media document IDs. */
  onSelect: (mediaIds: string[]) => void;
  /** Called when the picker is cancelled or closed. */
  onCancel: () => void;
}

/**
 * Media picker modal with tabbed UI (Library + Upload new).
 *
 * Uses shadcn/ui Tabs component for ARIA-compliant tab navigation. Adapts
 * behavior based on `multi`:
 * - Single-select (multi=false): only one item selected at a time
 * - Multi-select (multi=true): checkboxes on multiple items
 *
 * @param props — Media picker component props.
 */
export function MediaPicker({ ... }) { ... }
```

---

## Step 11 - EmptyInput Wiring

### Part A: EmptyInput Interface

```tsx
/**
 * Props for the UploadEmpty component.
 */
export interface UploadEmptyProps {
  /** Whether to allow multiple file selection (from field.hasMany). */
  allowMultiple: boolean;
  /** Called when files are selected — opens picker with staged files. */
  onFilesSelected: (files: File[]) => void;
  /** Called to open media picker in library mode (browse existing media). */
  onBrowseLibrary: () => void;
}

/**
 * Empty state for upload field — dropzone + file picker + browse library button.
 *
 * Handles file selection via:
 * - Drag and drop into dropzone
 * - File input picker (hidden, triggered by button)
 *
 * When files are selected, opens MediaPicker on Upload tab with staged files.
 *
 * @param props — Component props.
 */
export function UploadEmpty({ ... }) { ... }
```

### Part B: Input.tsx Helper Functions

Add JSDoc to the helper functions in Input.tsx:

```tsx
/**
 * Opens MediaPicker on Upload tab with pre-staged files.
 *
 * @param files - Files to stage in the upload form.
 */
async function openPickerWithFiles(files: File[]) { ... }

/**
 * Opens MediaPicker on Library tab (browse existing media).
 */
async function openPickerLibrary() { ... }

/**
 * Closes MediaPicker and resets staged files state.
 */
async function closePicker() { ... }

/**
 * Handles media selection from picker.
 *
 * @param mediaIds - Selected media document IDs.
 */
async function handleSelect(mediaIds: string[]) { ... }

/**
 * Removes a media document from the field value.
 *
 * @param mediaId - ID to remove (removes all if undefined).
 */
function handleRemove(mediaId?: string) { ... }

/**
 * Reorders media documents in the field value.
 *
 * @param from - Source index.
 * @param to - Destination index.
 */
function handleReorder(from: number, to: number) { ... }
```

### Part C: MediaPicker Props Update

```tsx
/**
 * Props for the MediaPicker component.
 */
export interface MediaPickerProps {
  /** The slug of the target media collection. */
  targetCollection: MediaCollectionSlug;
  /** The upload field's TanStack Form API. */
  field: TypedFieldApi<string[]>;
  /** Whether to allow multi-select (from field.hasMany). */
  multi: boolean;
  /** Called with selected media document IDs. */
  onSelect: (mediaIds: string[]) => void;
  /** Called when the picker is cancelled or closed. */
  onCancel: () => void;
  /** Default tab to show ("library" or "upload"). */
  defaultTab?: "library" | "upload";
  /** Pre-staged files for upload tab. */
  stagedFiles?: File[];
}
```

---

## Step 12 - EmptyInput Functional Updates

### File Validation Function

```tsx
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
    return { 
      valid: false, 
      error: `${file.name}: Invalid file type. Only PNG, JPG, SVG, WebP allowed.` 
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `${file.name}: File too large. Max 10MB.` 
    };
  }
  return { valid: true };
};
```

---

## Step 13 - MediaLibraryGrid Functional Updates

### Handle Item Click

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

---

## Step 14 - MediaPicker Functional Updates

### Prevent Close During Upload

```tsx
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

### Tab Change Handler

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

---

## General Guidelines

All JSDoc comments should follow these patterns:

### Interfaces
```tsx
/**
 * Props for [ComponentName] component.
 */
export interface ComponentProps {
  /** Description of prop. */
  propName: Type;
}
```

### Components
```tsx
/**
 * One-line summary.
 *
 * Longer description with behavior details, patterns, edge cases.
 *
 * @param props — Component props.
 */
export function Component({ ... }) { ... }
```

### Functions
```tsx
/**
 * Description of what the function does.
 *
 * @param paramName - Description of parameter.
 * @returns Description of return value.
 *
 * @example
 * ```ts
 * // Usage example
 * ```
 */
function helperFunction(paramName: Type): ReturnType { ... }
```

---

## Application Instructions

1. Search for each interface/component/function in the spec
2. Add the corresponding JSDoc comment above it
3. Ensure consistent formatting (two spaces, proper punctuation)
4. Update @param descriptions to match actual parameter names

