# Storage Adapter Architecture Comparison

## Current State

```ts
// packages/file-storage-convex/src/adapter/index.ts
export function convexFileStorage(options: ConvexFileStorageOptions): VexStorageAdapter {
  const mediaCollections = options.mediaCollections.map((collection) => ({
    ...collection,
    meta: { ...collection.meta, storageAdapterName: "convex" },
  }));

  return {
    name: "convex",
    mediaCollections,
    softDelete: options?.softDelete ?? false,
  };
}
```

```ts
// packages/file-storage-convex/src/index.ts
export { defineMediaCollection } from "./config";
export * from "./adapter";
export { upload, uploadFile, createMediaDocument, deleteMedia, getUrl } from "./convex";
```

```ts
// packages/core/src/media/types.ts
export interface VexStorageAdapter {
  readonly name: string;
  readonly mediaCollections: MediaCollectionConfig[];
  readonly softDelete?: boolean;
}

export interface StorageAdapterClient {
  readonly type: StorageAdapterProtocol;
  generateUploadUrl(ctx: GenericMutationCtx<GenericDataModel>): Promise<{ url: string; storageId?: string }>;
  createMediaDocument(ctx: GenericMutationCtx<GenericDataModel>, args: {...}): Promise<string>;
  deleteMedia(ctx: GenericMutationCtx<GenericDataModel>, args: {...}): Promise<boolean>;
  getUrl(ctx: GenericQueryCtx<GenericDataModel>, args: {...}): Promise<{ url: string } | { url: null; error: string }>;
}
```

---

## Option A: Class-based factory (Recommended)

### What changes

**`packages/file-storage-convex/src/adapter/index.ts`**

```ts
export class ConvexStorageAdapter implements VexStorageAdapter {
  readonly name = "convex";
  readonly softDelete: boolean;
  readonly mediaCollections: MediaCollectionConfig[];

  constructor(options: ConvexFileStorageOptions) {
    this.softDelete = options?.softDelete ?? false;
    this.mediaCollections = options.mediaCollections.map((collection) => ({
      ...collection,
      meta: { ...collection.meta, storageAdapterName: "convex" },
    }));
  }

  async generateUploadUrl(): Promise<{ url: string }> {
    const result = await anyApi.media.convex.generateUploadUrl();
    return { url: result.uploadUrl };
  }

  async createMediaDocument(args: CreateMediaDocumentArgs): Promise<string> {
    return anyApi.media.convex.createMediaDocument(args);
  }

  async deleteMedia(args: DeleteMediaArgs): Promise<boolean> {
    return anyApi.media.convex.deleteMedia(args);
  }

  async getUrl(args: GetUrlArgs): Promise<{ url: string } | { url: null; error: string }> {
    return anyApi.media.convex.getUrl(args);
  }
}

export function convexFileStorage(options: ConvexFileStorageOptions): VexStorageAdapter {
  return new ConvexStorageAdapter(options);
}
```

**`packages/react/src/context/StorageAdapterContext.tsx`**

```tsx
import { createContext, useContext } from "react";
import type { StorageAdapter } from "@vexcms/core";

const StorageAdapterContext = createContext<Map<string, StorageAdapter>>(new Map());

export const StorageAdapterProvider = StorageAdapterContext.Provider;

export function useStorageAdapter(name: string): StorageAdapter {
  const adapters = useContext(StorageAdapterContext);
  const adapter = adapters.get(name);
  if (!adapter) {
    throw new Error(`Storage adapter "${name}" not found`);
  }
  return adapter;
}
```

**`apps/www/app/admin/layout.tsx`**

```tsx
import { convexFileStorage } from "@vexcms/file-storage-convex";

const imagesAdapter = convexFileStorage({ mediaCollections: [images] });
const videosAdapter = convexFileStorage({ mediaCollections: [videos] });

const adapters = new Map([
  ["convex-images", imagesAdapter],
  ["convex-videos", videosAdapter],
]);

export default function AdminLayout({ children }) {
  return (
    <StorageAdapterProvider value={adapters}>
      {children}
    </StorageAdapterProvider>
  );
}
```

**`packages/react/src/fields/upload/Input.tsx`**

```tsx
export function UploadFieldInput({ collectionSlug, value, onChange, max }) {
  // Get adapter name from collection config
  const adapterName = useCollectionAdapterName(collectionSlug);
  const adapter = useStorageAdapter(adapterName);

  const uploadMutation = useMutation({
    mutationFn: convexMutation(async (file: File) => {
      const { url } = await adapter.generateUploadUrl();
      const response = await fetch(url, { method: "POST", body: file });
      if (!response.ok) throw new Error("Upload failed");

      const mediaId = await adapter.createMediaDocument({
        collectionSlug,
        storageId: "pending",
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        alt: file.name,
      });

      return mediaId;
    }),
  });

  // ... rest of component
}
```

**Pros:**
- Easy to expand with new methods
- Stateful adapters possible (e.g., cache, retry logic)
- Clear separation of concerns
- Easy to mock for testing

**Cons:**
- More complex than interface-based
- Requires class instantiation

---

## Option B: Interface-based (current)

**`packages/file-storage-convex/src/react.ts`**

```ts
export function getStorageAdapterClient(): StorageAdapterClient {
  return {
    type: "presigned-url",
    generateUploadUrl: async () => {
      const url = await anyApi.media.convex.generateUploadUrl();
      return { url };
    },
    createMediaDocument: async (args) => {
      return anyApi.media.convex.createMediaDocument(args);
    },
    deleteMedia: async (args) => {
      return anyApi.media.convex.deleteMedia(args);
    },
    getUrl: async (args) => {
      return anyApi.media.convex.getUrl(args);
    },
  };
}
```

**`packages/react/src/context/StorageAdapterContext.tsx`**

```tsx
import { createContext, useContext } from "react";
import type { StorageAdapterClient } from "@vexcms/core";

const StorageAdapterContext = createContext<Map<string, StorageAdapterClient>>(new Map());

export const StorageAdapterProvider = StorageAdapterContext.Provider;

export function useStorageAdapterClient(name: string): StorageAdapterClient {
  const adapters = useContext(StorageAdapterContext);
  const client = adapters.get(name);
  if (!client) {
    throw new Error(`Storage adapter client "${name}" not found`);
  }
  return client;
}
```

**`apps/www/app/admin/layout.tsx`**

```tsx
import { getStorageAdapterClient } from "@vexcms/file-storage-convex/react";

const adapters = new Map([
  ["convex", getStorageAdapterClient()],
]);

export default function AdminLayout({ children }) {
  return (
    <StorageAdapterProvider value={adapters}>
      {children}
    </StorageAdapterProvider>
  );
}
```

**Pros:**
- Simple
- No class instantiation
- Easy to understand

**Cons:**
- Less flexible for future expansion
- Hard to add stateful behavior
- Hard to mock for testing

---

## Option C: Hybrid: interface + class

**`packages/file-storage-convex/src/adapter/index.ts`**

```ts
export class ConvexStorageAdapter implements VexStorageAdapter {
  readonly name = "convex";
  readonly softDelete: boolean;
  readonly mediaCollections: MediaCollectionConfig[];

  constructor(options: ConvexFileStorageOptions) {
    this.softDelete = options?.softDelete ?? false;
    this.mediaCollections = options.mediaCollections.map((collection) => ({
      ...collection,
      meta: { ...collection.meta, storageAdapterName: "convex" },
    }));
  }

  async generateUploadUrl(): Promise<{ url: string }> {
    const result = await anyApi.media.convex.generateUploadUrl();
    return { url: result.uploadUrl };
  }

  async createMediaDocument(args: CreateMediaDocumentArgs): Promise<string> {
    return anyApi.media.convex.createMediaDocument(args);
  }

  async deleteMedia(args: DeleteMediaArgs): Promise<boolean> {
    return anyApi.media.convex.deleteMedia(args);
  }

  async getUrl(args: GetUrlArgs): Promise<{ url: string } | { url: null; error: string }> {
    return anyApi.media.convex.getUrl(args);
  }
}

export function convexFileStorage(options: ConvexFileStorageOptions): VexStorageAdapter {
  return new ConvexStorageAdapter(options);
}

// Simple factory for single-adapter setups
export function getStorageAdapterClient(): StorageAdapterClient {
  const adapter = new ConvexStorageAdapter({ mediaCollections: [] });
  return {
    type: "presigned-url",
    generateUploadUrl: () => adapter.generateUploadUrl(),
    createMediaDocument: (args) => adapter.createMediaDocument(args),
    deleteMedia: (args) => adapter.deleteMedia(args),
    getUrl: (args) => adapter.getUrl(args),
  };
}
```

**Pros:**
- Most flexible
- Supports both simple and advanced setups
- Easy to expand

**Cons:**
- More complex
- More code to maintain

---

## Option D: Registry-based

**`packages/file-storage-convex/src/registry.ts` (NEW)**

```ts
const registry = new Map<string, StorageAdapterClient>();

export function registerAdapter(name: string, client: StorageAdapterClient): void {
  registry.set(name, client);
}

export function getAdapter(name: string): StorageAdapterClient | undefined {
  return registry.get(name);
}
```

**`packages/file-storage-convex/src/adapter/index.ts`**

```ts
import { registerAdapter } from "./registry";

export class ConvexStorageAdapter implements VexStorageAdapter {
  readonly name = "convex";
  readonly softDelete: boolean;
  readonly mediaCollections: MediaCollectionConfig[];

  constructor(options: ConvexFileStorageOptions) {
    this.softDelete = options?.softDelete ?? false;
    this.mediaCollections = options.mediaCollections.map((collection) => ({
      ...collection,
      meta: { ...collection.meta, storageAdapterName: "convex" },
    }));
    registerAdapter("convex", this);
  }

  async generateUploadUrl(): Promise<{ url: string }> {
    const result = await anyApi.media.convex.generateUploadUrl();
    return { url: result.uploadUrl };
  }

  async createMediaDocument(args: CreateMediaDocumentArgs): Promise<string> {
    return anyApi.media.convex.createMediaDocument(args);
  }

  async deleteMedia(args: DeleteMediaArgs): Promise<boolean> {
    return anyApi.media.convex.deleteMedia(args);
  }

  async getUrl(args: GetUrlArgs): Promise<{ url: string } | { url: null; error: string }> {
    return anyApi.media.convex.getUrl(args);
  }
}

export function convexFileStorage(options: ConvexFileStorageOptions): VexStorageAdapter {
  return new ConvexStorageAdapter(options);
}
```

**`packages/react/src/context/StorageAdapterContext.tsx`**

```tsx
import { createContext, useContext } from "react";
import { getAdapter } from "@vexcms/file-storage-convex/registry";
import type { StorageAdapterClient } from "@vexcms/core";

const StorageAdapterContext = createContext<Map<string, StorageAdapterClient>>(new Map());

export const StorageAdapterProvider = StorageAdapterContext.Provider;

export function useStorageAdapterClient(name: string): StorageAdapterClient {
  // Try context first, then registry
  const adapters = useContext(StorageAdapterContext);
  const client = adapters.get(name) || getAdapter(name);
  if (!client) {
    throw new Error(`Storage adapter client "${name}" not found`);
  }
  return client;
}
```

**`apps/www/app/admin/layout.tsx`** — No changes needed (registry auto-registers)

**`packages/react/src/fields/upload/Input.tsx`** — Same as Option A

**Pros:**
- Most flexible
- Easy to add new adapters
- No manual registration needed

**Cons:**
- Global state
- Harder to test
- Harder to reason about

---

## Recommendation

I recommend **Option A: Class-based factory** because:

1. It's easy to expand with new methods
2. Stateful adapters are possible (e.g., cache, retry logic)
3. Clear separation of concerns
4. Easy to mock for testing
5. Consistent with the current design
6. Makes it easy to add new adapters

The context would provide a map of adapter names to instances, and the upload field would look up the instance based on the collection's adapter name.

For the future, when you want to support multiple adapters per collection, you can add a `adapters` field to the media collection config that lists the adapters in priority order. The upload field would try each adapter in order until one succeeds.
