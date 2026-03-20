# @vexcms/file-storage-convex

[Convex](https://convex.dev) file storage adapter for [VEX CMS](https://github.com/vexcms). Integrates Convex's built-in file storage system with VEX media collections.

## Installation

```bash
pnpm add @vexcms/file-storage-convex
```

## Usage

```typescript
import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

export default defineConfig({
  media: {
    collections: [media],
    storageAdapter: convexFileStorage(),
  },
  collections: [/* ... */],
})
```

## What It Does

`convexFileStorage()` returns a `FileStorageAdapter` that tells VEX CMS to use Convex's native file storage. This affects:

- **Schema generation** — Media collection `storageId` fields use `v.id("_storage")` (Convex's typed storage reference) instead of plain strings
- **Upload flow** — Media uploads go through Convex's presigned URL system
- **File management** — Delete and URL resolution use Convex's storage APIs

## Media Collection Fields

When you use a storage adapter, every media collection automatically gets these fields:

| Field | Type | Notes |
|-------|------|-------|
| `storageId` | `v.id("_storage")` | Convex file storage reference (locked) |
| `filename` | `v.string()` | Original filename (locked, read-only) |
| `mimeType` | `v.string()` | MIME type, indexed (locked, read-only) |
| `size` | `v.number()` | File size in bytes (locked, read-only) |
| `url` | `v.string()` | Accessible URL (overridable) |
| `alt` | `v.optional(v.string())` | Alt text (overridable) |
| `width` | `v.optional(v.number())` | Image width (overridable) |
| `height` | `v.optional(v.number())` | Image height (overridable) |

You can add additional custom fields to media collections alongside these.

## Adapter Interface

The adapter implements `FileStorageAdapter` from `@vexcms/core`:

```typescript
interface FileStorageAdapter {
  name: string                                        // "convex"
  storageIdValueType: string                          // 'v.id("_storage")'
  getUploadUrl(): Promise<string>                     // Presigned upload URL
  getUrl(props: { storageId: string }): Promise<string | null>  // Resolve to URL
  deleteFile(props: { storageId: string }): Promise<void>       // Delete file
}
```

The runtime methods (`getUploadUrl`, `getUrl`, `deleteFile`) are wired to actual Convex functions by the admin panel at runtime.

## Peer Dependencies

- `@vexcms/core` — Core VEX CMS types
- `convex` — Convex backend
