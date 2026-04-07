// FileStorageAdapter will be imported from @vexcms/core once it is rebuilt
export interface FileStorageAdapter {
  name: string;
  storageIdValueType: string;
  getUploadUrl: () => Promise<string>;
  getUrl: (props: { storageId: string }) => Promise<string | null>;
  deleteFile: (props: { storageId: string }) => Promise<void>;
}

export interface ConvexFileStorageOptions {
  convexUrl?: string;
}

/**
 * Create a Convex file storage adapter.
 *
 * Uses Convex's built-in file storage system. Sets `storageIdValueType` to
 * `v.id("_storage")` so media collection schemas use Convex's typed storage reference.
 *
 * The runtime methods (getUploadUrl, getUrl, deleteFile) throw descriptive errors
 * because they need to be wired to Convex runtime functions by the admin panel.
 *
 * @example
 * ```ts
 * defineConfig({
 *   media: {
 *     collections: [images],
 *     storageAdapter: convexFileStorage(),
 *   },
 * });
 * ```
 */
export function convexFileStorage(
  _props?: ConvexFileStorageOptions,
): FileStorageAdapter {
  return {
    name: "convex",
    storageIdValueType: 'v.id("_storage")',
    getUploadUrl: async () => {
      throw new Error(
        "convexFileStorage.getUploadUrl() requires a Convex client. Wire via admin panel runtime.",
      );
    },
    getUrl: async (_props: { storageId: string }) => {
      throw new Error(
        "convexFileStorage.getUrl() requires a Convex client. Wire via admin panel runtime.",
      );
    },
    deleteFile: async (_props: { storageId: string }) => {
      throw new Error(
        "convexFileStorage.deleteFile() requires a Convex client. Wire via admin panel runtime.",
      );
    },
  };
}
