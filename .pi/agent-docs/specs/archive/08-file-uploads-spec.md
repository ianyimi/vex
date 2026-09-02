# File Uploads Implementation Spec

This document defines the implementation plan for Vex CMS file upload functionality. It covers upload-enabled collections, the `upload` field type, media library UI, and the storage adapter interface.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.7

**Depends on**:
- [05-schema-field-system-spec.md](./05-schema-field-system-spec.md) - Field types and schema generation
- [06-convex-integration-spec.md](./06-convex-integration-spec.md) - Admin handlers and access control

---

## Design Goals

1. **Upload-enabled collections** - Collections with `upload.enabled: true` store files (like PayloadCMS)
2. **Direct client upload** - Client uploads directly to Convex (framework-agnostic, not Next.js-specific)
3. **Media library picker** - Browse existing files or upload new ones in a modal
4. **Per-field restrictions** - Each `upload` field specifies allowed MIME types and size limits
5. **Adapter pattern** - Convex file storage as default, ready for S3/R2/Vercel Blob adapters
6. **Reference-based** - Upload fields store `v.id("collectionName")`, not inline file data

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UPLOAD FLOW                                  │
│                                                                      │
│  1. User clicks upload field                                         │
│     ├── Opens media library picker modal                             │
│     └── Can browse existing files or drag-drop new file              │
│                                                                      │
│  2. New file upload                                                  │
│     ├── Client calls generateUploadUrl() mutation                    │
│     ├── Client uploads file directly to Convex storage               │
│     ├── Client calls createMedia() mutation with storageId + meta    │
│     └── Media document created in upload collection                  │
│                                                                      │
│  3. Field receives media document ID                                 │
│     ├── Upload field stores v.id("media") reference                  │
│     └── Document saved with reference to media                       │
│                                                                      │
│  4. Display                                                          │
│     ├── Admin fetches media document by ID                           │
│     ├── Gets storage URL via ctx.storage.getUrl(storageId)           │
│     └── Renders thumbnail/preview                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

### Upload-Enabled Collection Config

```typescript
/**
 * Upload configuration for collections that store files
 * Only collections with upload.enabled can be referenced by upload fields
 */
interface UploadConfig {
  /**
   * Enables file storage for this collection
   * Documents in this collection will have a storageId field
   */
  enabled: true;

  /**
   * Allowed MIME types for this collection
   * Supports wildcards: 'image/*', 'video/*'
   * @default ['*'] (all types)
   */
  accept?: string[];

  /**
   * Maximum file size in bytes
   * @default 20 * 1024 * 1024 (20MB, Convex limit)
   */
  maxSize?: number;

  /**
   * Storage adapter to use
   * @default 'convex'
   */
  storage?: 'convex' | StorageAdapter;
}

/**
 * Extended collection config for upload collections
 */
interface CollectionConfig<TFields extends Record<string, VexField<any, any>>> {
  fields: TFields;

  /**
   * Enable file storage for this collection
   * If set, documents will have system fields: _storageId, _filename, _mimeType, _size
   */
  upload?: UploadConfig;

  // ... other existing config options
}
```

### Upload Field Metadata

```typescript
/**
 * Upload field specific metadata
 * References an upload-enabled collection
 */
interface UploadFieldMeta extends BaseFieldMeta {
  readonly type: 'upload';

  /**
   * The upload-enabled collection to reference
   * If omitted, uses admin.defaultMediaCollection from config
   */
  relationTo?: string;

  /**
   * Allow selecting multiple files
   * Changes validator from v.id() to v.array(v.id())
   * @default false
   */
  hasMany?: boolean;

  /**
   * Allowed MIME types (must be subset of collection's accept)
   * More restrictive than collection-level setting
   */
  accept?: string[];

  /**
   * Maximum file size (must be <= collection's maxSize)
   * More restrictive than collection-level setting
   */
  maxSize?: number;

  /**
   * Admin UI configuration
   */
  admin?: BaseAdminConfig & {
    /**
     * Allow creating new uploads inline
     * @default true
     */
    allowCreate?: boolean;

    /**
     * Show file preview/thumbnail
     * @default true
     */
    showPreview?: boolean;
  };
}
```

### Global Admin Config

```typescript
interface AdminConfig {
  /** Collection slug used for admin users */
  user: string;

  /**
   * Default upload collection for upload fields that don't specify relationTo
   * Must reference a collection with upload.enabled: true
   */
  defaultMediaCollection?: string;

  // ... other existing config
}
```

### System Fields for Upload Collections

```typescript
/**
 * System fields automatically added to upload-enabled collections
 * These are added by generateVexSchema() when collection.upload.enabled is true
 */
interface UploadSystemFields {
  /** Convex storage ID for the file */
  _storageId: Id<'_storage'>;

  /** Original filename */
  _filename: string;

  /** MIME type */
  _mimeType: string;

  /** File size in bytes */
  _size: number;

  /** Image width in pixels (images only) */
  _width?: number;

  /** Image height in pixels (images only) */
  _height?: number;
}
```

### Storage Adapter Interface

```typescript
/**
 * Storage adapter interface for custom storage backends
 * Convex is the default, S3/R2/Vercel Blob can be implemented later
 */
interface StorageAdapter {
  /** Unique identifier for this adapter */
  readonly name: string;

  /**
   * Generate a URL for uploading a file
   * For Convex: calls ctx.storage.generateUploadUrl()
   */
  generateUploadUrl(ctx: MutationContext): Promise<string>;

  /**
   * Get the public URL for a stored file
   * For Convex: calls ctx.storage.getUrl(storageId)
   */
  getUrl(ctx: QueryContext, storageId: string): Promise<string | null>;

  /**
   * Delete a file from storage
   * For Convex: calls ctx.storage.delete(storageId)
   */
  delete(ctx: MutationContext, storageId: string): Promise<void>;

  /**
   * Get file metadata
   * For Convex: calls ctx.storage.getMetadata(storageId)
   */
  getMetadata(ctx: QueryContext, storageId: string): Promise<FileMetadata | null>;
}

interface FileMetadata {
  contentType: string;
  size: number;
}
```

---

## Schema Generation

### Upload Field Validator

The `upload()` field factory creates a relationship validator to the upload collection.

```typescript
/**
 * upload() field factory
 *
 * Creates validator: v.id("collectionName") or v.array(v.id("collectionName"))
 */
function upload(meta: Omit<UploadFieldMeta, 'type'>): VexField<...> {
  // Validator depends on hasMany
  const collectionName = meta.relationTo; // resolved at schema build time
  const baseValidator = v.id(collectionName);
  const validator = meta.hasMany
    ? v.array(baseValidator)
    : baseValidator;

  return {
    _validator: meta.required ? validator : v.optional(validator),
    _meta: { type: 'upload', ...meta }
  };
}
```

### Upload Collection System Fields

When `generateVexSchema()` encounters a collection with `upload.enabled: true`, it adds system fields to the generated `vex.schema.ts`.

```typescript
/**
 * In generateVexSchema(), for upload collections:
 */
function buildUploadCollectionSchema(collection: VexCollection<any>) {
  const userFields = extractValidators(collection.config.fields);

  // Add upload system fields
  const systemFields = {
    _storageId: v.id('_storage'),
    _filename: v.string(),
    _mimeType: v.string(),
    _size: v.number(),
    _width: v.optional(v.number()),
    _height: v.optional(v.number()),
  };

  return v.object({
    ...systemFields,
    ...userFields,
  });
}
```

### Resolving Default Media Collection

At schema generation time, upload fields without `relationTo` use the global default.

```typescript
/**
 * In generateVexSchema(), resolve upload field references:
 */
function resolveUploadFieldCollection(
  field: VexField<any, UploadFieldMeta>,
  config: VexConfig
): string {
  if (field._meta.relationTo) {
    return field._meta.relationTo;
  }

  if (!config.admin?.defaultMediaCollection) {
    throw new Error(
      'Upload field has no relationTo and no defaultMediaCollection configured'
    );
  }

  return config.admin.defaultMediaCollection;
}
```

---

## Admin Mutations & Queries

### Generate Upload URL

```typescript
/**
 * @vex/convex/mutations/adminGenerateUploadUrl.ts
 *
 * Generates a signed URL for client-side upload
 * Called before the actual file upload
 */
interface GenerateUploadUrlArgs {
  /** Target upload collection */
  collection: string;
}

interface GenerateUploadUrlResult {
  /** Signed URL for PUT request */
  uploadUrl: string;
}
```

#### `adminGenerateUploadUrl`

Generates a URL for client-side file upload.

**Must accomplish:**
- Validate user has create permission on the collection
- Validate collection has `upload.enabled: true`
- Get storage adapter for the collection (default: Convex)
- Call `adapter.generateUploadUrl(ctx)`
- Return the upload URL

**Edge cases:**
- Non-upload collection: throw error with helpful message
- User lacks permission: throw auth error
- Storage adapter error: propagate with context

---

### Create Media Document

```typescript
/**
 * @vex/convex/mutations/adminCreateMedia.ts
 *
 * Creates a media document after file upload completes
 * Client calls this after successful PUT to upload URL
 */
interface CreateMediaArgs {
  /** Target upload collection */
  collection: string;

  /** Storage ID returned from upload */
  storageId: Id<'_storage'>;

  /** Original filename */
  filename: string;

  /** User-provided metadata (alt text, etc.) */
  data?: Record<string, unknown>;
}

interface CreateMediaResult {
  /** Created document ID */
  _id: Id<typeof collection>;

  /** Public URL for the file */
  url: string;
}
```

#### `adminCreateMedia`

Creates a media document after file upload.

**Must accomplish:**
- Validate user has create permission on the collection
- Validate collection has `upload.enabled: true`
- Get file metadata from storage (mimeType, size)
- Validate mimeType against collection's `accept` config
- Validate size against collection's `maxSize` config
- If image, extract width/height (via Convex action if needed)
- Run collection's `beforeCreate` hooks
- Insert document with system fields + user fields
- Run collection's `afterCreate` hooks
- Return document ID and public URL

**Edge cases:**
- Storage ID doesn't exist: throw error
- MIME type not allowed: throw validation error
- Size exceeds limit: throw validation error (shouldn't happen if client validates)
- Hook throws: roll back, delete storage if possible

---

### List Media

```typescript
/**
 * @vex/convex/queries/adminListMedia.ts
 *
 * List media documents for media library picker
 */
interface ListMediaArgs {
  /** Upload collection to list */
  collection: string;

  /** Filter by MIME type pattern */
  accept?: string[];

  /** Search by filename */
  search?: string;

  /** Pagination cursor */
  cursor?: string;

  /** Number of results */
  limit?: number;
}

interface ListMediaResult {
  items: MediaDocument[];
  nextCursor?: string;
}

interface MediaDocument {
  _id: Id<typeof collection>;
  _storageId: Id<'_storage'>;
  _filename: string;
  _mimeType: string;
  _size: number;
  _width?: number;
  _height?: number;
  url: string;
  // ... user-defined fields
}
```

#### `adminListMedia`

Lists media documents for the picker.

**Must accomplish:**
- Validate user has read permission on the collection
- Apply MIME type filter if `accept` provided
- Apply filename search if `search` provided
- Paginate using cursor
- Resolve storage URLs for each document
- Return documents with URLs

**Edge cases:**
- Empty collection: return empty array
- Invalid accept pattern: ignore or error
- Storage URL resolution fails: include null URL, don't fail entire query

---

### Get Media URL

```typescript
/**
 * @vex/convex/queries/adminGetMediaUrl.ts
 *
 * Get public URL for a media document
 * Used for displaying images/files in admin
 */
interface GetMediaUrlArgs {
  /** Document ID */
  id: Id<typeof collection>;

  /** Collection name */
  collection: string;
}

interface GetMediaUrlResult {
  url: string | null;
}
```

#### `adminGetMediaUrl`

Gets the public URL for a media document.

**Must accomplish:**
- Fetch document by ID
- Check read access
- Get URL from storage adapter
- Return URL

**Edge cases:**
- Document not found: return null
- Storage file deleted: return null
- Access denied: throw auth error

---

### Delete Media

```typescript
/**
 * @vex/convex/mutations/adminDeleteMedia.ts
 *
 * Delete a media document and its stored file
 */
interface DeleteMediaArgs {
  /** Document ID */
  id: Id<typeof collection>;

  /** Collection name */
  collection: string;
}
```

#### `adminDeleteMedia`

Deletes a media document and its file.

**Must accomplish:**
- Validate user has delete permission
- Run collection's `beforeDelete` hooks
- Delete file from storage
- Delete document from database
- Run collection's `afterDelete` hooks

**Edge cases:**
- Document referenced by other documents: decide policy (warn vs prevent vs cascade)
- Storage deletion fails: still delete document, log error
- Hook throws: abort deletion

---

## Client Upload Utilities

### Upload Function

```typescript
/**
 * @vex/client/upload.ts
 *
 * Client-side upload utility (framework-agnostic)
 */
interface UploadOptions {
  /** File to upload */
  file: File;

  /** Target collection */
  collection: string;

  /** Convex client */
  convex: ConvexReactClient;

  /** Progress callback */
  onProgress?: (progress: number) => void;

  /** Additional metadata for the document */
  data?: Record<string, unknown>;
}

interface UploadResult {
  /** Created document ID */
  _id: string;

  /** Public URL */
  url: string;

  /** File metadata */
  metadata: {
    filename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
  };
}

/**
 * Upload a file to an upload collection
 *
 * @example
 * const result = await uploadFile({
 *   file: selectedFile,
 *   collection: 'media',
 *   convex,
 *   onProgress: (p) => setProgress(p),
 *   data: { alt: 'Hero image' },
 * });
 */
async function uploadFile(options: UploadOptions): Promise<UploadResult>;
```

#### `uploadFile`

Client-side file upload utility.

**Must accomplish:**
- Validate file type against collection's accept (client-side check)
- Validate file size against collection's maxSize (client-side check)
- Call `adminGenerateUploadUrl` mutation
- Upload file via fetch with progress tracking
- Call `adminCreateMedia` mutation with storageId
- Return created document info

**Implementation:**

```typescript
async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { file, collection, convex, onProgress, data } = options;

  // 1. Generate upload URL
  const { uploadUrl } = await convex.mutation(
    api.vex.adminGenerateUploadUrl,
    { collection }
  );

  // 2. Upload file with progress tracking
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', uploadUrl);
    xhr.send(file);
  });

  // 3. Create media document
  const result = await convex.mutation(api.vex.adminCreateMedia, {
    collection,
    storageId: /* extracted from response */,
    filename: file.name,
    data,
  });

  return result;
}
```

**Edge cases:**
- Network error during upload: reject with error
- Upload cancelled: support AbortController
- Very large file: progress updates should be frequent enough
- Zero-byte file: validate and reject

---

## Admin Panel Components

### Upload Field Component

```typescript
/**
 * @vex/admin/components/fields/UploadField.tsx
 */
interface UploadFieldProps {
  /** Field path in form */
  path: string;

  /** Field configuration */
  field: VexField<any, UploadFieldMeta>;

  /** Resolved collection name */
  collection: string;
}
```

#### `UploadField`

Renders the upload field in document forms.

**Must accomplish:**
- Show current selection (thumbnail + filename for images, icon + filename for others)
- Show "Select" button to open media library picker
- Show "Remove" button to clear selection
- Handle drag-drop for new uploads
- Support `hasMany` mode with multiple selections

**Edge cases:**
- Referenced document deleted: show "Missing file" state with option to clear
- Loading state while fetching URL: show skeleton
- Upload in progress: show progress bar, disable other interactions

---

### Media Library Picker

```typescript
/**
 * @vex/admin/components/MediaLibraryPicker.tsx
 */
interface MediaLibraryPickerProps {
  /** Collection to browse */
  collection: string;

  /** Filter by MIME types */
  accept?: string[];

  /** Allow multiple selection */
  multiple?: boolean;

  /** Currently selected IDs */
  selected?: string[];

  /** Callback when selection changes */
  onSelect: (ids: string[]) => void;

  /** Close the picker */
  onClose: () => void;
}
```

#### `MediaLibraryPicker`

Modal for browsing and selecting media.

**Must accomplish:**
- Display grid of media items with thumbnails
- Search by filename
- Filter by MIME type (derived from `accept` prop)
- Support drag-drop upload into the picker
- Support single or multiple selection mode
- Pagination/infinite scroll for large libraries
- Show upload progress for new files

**Edge cases:**
- Empty library: show upload prompt
- No matching files for filter: show empty state
- Upload fails: show error toast, don't close picker
- Large number of selected items: show count instead of all thumbnails

---

### Media Item Card

```typescript
/**
 * @vex/admin/components/MediaItemCard.tsx
 */
interface MediaItemCardProps {
  /** Media document */
  item: MediaDocument;

  /** Whether this item is selected */
  selected?: boolean;

  /** Click handler */
  onClick?: () => void;
}
```

#### `MediaItemCard`

Individual media item in the picker grid.

**Must accomplish:**
- Show thumbnail for images
- Show file type icon for non-images
- Show filename (truncated if long)
- Show file size
- Visual selected state
- Hover state with checkbox

**Edge cases:**
- Very long filename: truncate with ellipsis
- Thumbnail load error: show placeholder
- Unsupported preview type: show generic file icon

---

## Media Collection View

### Collection List View

Upload collections get a specialized list view with media-specific features.

```typescript
/**
 * Detected automatically when collection.upload.enabled is true
 * Adds media-specific columns and actions to standard list view
 */
interface MediaListViewConfig {
  /** Show thumbnail column */
  showThumbnails: true;

  /** Default columns for media collections */
  defaultColumns: ['thumbnail', '_filename', '_mimeType', '_size', 'createdAt'];

  /** Additional bulk actions */
  bulkActions: ['delete', 'download'];
}
```

**Features:**
- Thumbnail column showing file preview
- File size column with human-readable formatting
- MIME type column with icons
- Download action for selected files
- Grid view toggle (in addition to table view)

---

## Validation

### Client-Side Validation

```typescript
/**
 * @vex/client/validateUpload.ts
 *
 * Validate file before upload attempt
 */
interface ValidateUploadOptions {
  file: File;
  accept?: string[];
  maxSize?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: {
    type?: string;
    size?: string;
  };
}

function validateUpload(options: ValidateUploadOptions): ValidationResult;
```

#### `validateUpload`

Validates a file against restrictions before upload.

**Must accomplish:**
- Check MIME type against `accept` patterns
- Check file size against `maxSize`
- Return validation result with specific error messages

**Implementation:**

```typescript
function validateUpload(options: ValidateUploadOptions): ValidationResult {
  const { file, accept, maxSize } = options;
  const errors: ValidationResult['errors'] = {};

  // Check MIME type
  if (accept && accept.length > 0) {
    const isAllowed = accept.some((pattern) => {
      if (pattern === '*') return true;
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -1);
        return file.type.startsWith(prefix);
      }
      return file.type === pattern;
    });

    if (!isAllowed) {
      errors.type = `File type "${file.type}" is not allowed. Allowed types: ${accept.join(', ')}`;
    }
  }

  // Check size
  if (maxSize && file.size > maxSize) {
    errors.size = `File size (${formatBytes(file.size)}) exceeds limit (${formatBytes(maxSize)})`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
```

---

### Server-Side Validation

```typescript
/**
 * Validate file after upload, in adminCreateMedia mutation
 */
function validateUploadedFile(
  metadata: FileMetadata,
  collectionConfig: UploadConfig,
  fieldConfig?: UploadFieldMeta
): void {
  const accept = fieldConfig?.accept ?? collectionConfig.accept ?? ['*'];
  const maxSize = Math.min(
    fieldConfig?.maxSize ?? Infinity,
    collectionConfig.maxSize ?? 20 * 1024 * 1024
  );

  // Validate MIME type
  if (!isTypeAllowed(metadata.contentType, accept)) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: `File type "${metadata.contentType}" is not allowed`,
    });
  }

  // Validate size
  if (metadata.size > maxSize) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: `File size exceeds limit`,
    });
  }
}
```

---

## Configuration Examples

### Defining an Upload Collection

```typescript
// collections/media.ts
export const media = defineCollection('media', {
  upload: {
    enabled: true,
    accept: ['image/*', 'video/*', 'application/pdf'],
    maxSize: 20 * 1024 * 1024, // 20MB
  },

  fields: {
    alt: text({ label: 'Alt Text', required: true }),
    caption: textarea({ label: 'Caption' }),
    owner: relationship({ to: 'users' }),
  },

  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['_filename', 'alt', '_mimeType', '_size'],
  },
});
```

### Multiple Upload Collections

```typescript
// collections/documents.ts
export const documents = defineCollection('documents', {
  upload: {
    enabled: true,
    accept: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*'],
    maxSize: 50 * 1024 * 1024, // 50MB for docs
  },

  fields: {
    title: text({ label: 'Title', required: true }),
    description: textarea({ label: 'Description' }),
    category: select({
      label: 'Category',
      options: [
        { value: 'contract', label: 'Contract' },
        { value: 'report', label: 'Report' },
        { value: 'manual', label: 'Manual' },
      ],
    }),
  },

  access: {
    read: ({ user }) => user?.role === 'admin' || user?.role === 'staff',
    create: ({ user }) => user?.role === 'admin',
  },
});
```

### Using Upload Fields

```typescript
// collections/posts.ts
export const posts = defineCollection('posts', {
  fields: {
    title: text({ label: 'Title', required: true }),

    // Uses default media collection
    featuredImage: upload({
      label: 'Featured Image',
      required: true,
      accept: ['image/*'], // Only images
    }),

    // Explicit collection reference
    attachments: upload({
      label: 'Attachments',
      relationTo: 'documents',
      hasMany: true,
    }),

    // Gallery with multiple images
    gallery: upload({
      label: 'Gallery',
      hasMany: true,
      accept: ['image/jpeg', 'image/png', 'image/webp'],
      admin: {
        showPreview: true,
      },
    }),
  },
});
```

### Global Config with Default Collection

```typescript
// vex.config.ts
export default defineConfig({
  collections: [media, documents, posts, pages],

  admin: {
    user: 'users',
    defaultMediaCollection: 'media',
  },
});
```

---

## File Structure

```
@vex/core/
├── fields/
│   └── upload.ts              # upload() field factory

@vex/convex/
├── mutations/
│   ├── adminGenerateUploadUrl.ts
│   ├── adminCreateMedia.ts
│   └── adminDeleteMedia.ts
├── queries/
│   ├── adminListMedia.ts
│   └── adminGetMediaUrl.ts
├── storage/
│   ├── adapters/
│   │   ├── types.ts           # StorageAdapter interface
│   │   ├── convex.ts          # Convex storage adapter (default)
│   │   └── s3.ts              # S3 adapter (Phase 4)
│   └── index.ts

@vex/client/
├── upload.ts                  # uploadFile() utility
├── validateUpload.ts          # Client-side validation
└── index.ts

@vex/admin/
├── components/
│   ├── fields/
│   │   └── UploadField.tsx    # Upload field component
│   ├── MediaLibraryPicker.tsx # Media picker modal
│   ├── MediaItemCard.tsx      # Individual media item
│   └── MediaGridView.tsx      # Grid layout for media
├── views/
│   └── MediaListView.tsx      # Media collection list view
└── hooks/
    └── useUpload.ts           # Upload state management hook
```

---

## Testing Requirements

- Unit tests for `upload()` field factory
- Unit tests for MIME type pattern matching
- Unit tests for client-side validation
- Integration tests for full upload flow (generate URL → upload → create document)
- Integration tests for media listing with filters
- E2E tests for media library picker interaction
- E2E tests for drag-drop upload
- E2E tests for upload field in document forms
- Error handling tests (network failure, invalid file type, size limit)
