---
applies_to: ["packages/file-storage-convex/src/**", "packages/core/src/media/**", "apps/test/convex/vex/media.ts"]
---
# File Storage Adapters

- `ConvexStorageAdapter extends StorageAdapterPresignedUrl`
  (`packages/file-storage-convex/src/adapter/index.ts:13-80`). Every method takes Convex
  `ctx` (query or mutation ctx) as the first parameter:
  `generateUploadUrl(ctx)`, `createMediaDocument(ctx, {...})`, `deleteMedia(ctx, {...})`,
  `getUrl(ctx, {...})`.
- `createMediaDocument` args: `collectionSlug`, `storageId`, `filename`, `mimeType`,
  `size`, `alt?`, `adapterFields?`. `deleteMedia` supports `softDelete?`.
- Standard media document fields: `alt`, `filename`, `mimeType`, `size`, `storageId`,
  `deleted`, `src` (resolved URL), optional `width`/`height`.
- Host registration: `apps/test/convex/vex/media.ts:1-7` calls `mediaQueryApi()` +
  `mediaMutationApi()` factories and re-exports the endpoints.
- New storage backends (S3/R2/Blob — post-v1 backlog) implement the same adapter surface;
  keep ctx-first signatures and the standard media field set.
