import { ConvexStorageAdapter } from "./adapter";

/**
 * Options for the convex-file-storage package
 */
export interface ConvexFileStorageOptions {
  /** Admin panel config options for @vexcms/file-storage-convex */
  admin?: {
    /** When true, delete operations mark media as deleted instead of physically removing files. */
    softDelete?: boolean;
  };
  /** Convex site URL for generating file URLs. Auto-detected from env if omitted. */
  convexUrl?: string;
}

/**
 * Creates a Convex file storage adapter for VexCMS.
 *
 * Configures the Convex-backed file storage backend and returns a
 * `VexStorageAdapter` for `defineServerConfig`'s `server.storage.adapters`.
 * Media collections are declared on the CLIENT config instead of here — see
 * `defineMediaCollection` (`@vexcms/file-storage-convex/client`), which
 * already tags every collection it produces with `meta.storageAdapter: "convex"`.
 *
 * @param options — Adapter configuration. Every field is optional.
 * @returns A `VexStorageAdapter` ready for `defineServerConfig({ server: { storage: { adapters: [...] } } })`.
 *
 * @example
 * ```ts
 * // vex.config.ts (client)
 * import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
 * const images = defineMediaCollection({ slug: "images" });
 * export default defineConfig({ mediaCollections: [images], collections: [posts] });
 *
 * // vex.config.server.ts (server)
 * import { convexFileStorage } from "@vexcms/file-storage-convex";
 * export default defineServerConfig({
 *   config,
 *   server: { storage: { adapters: [convexFileStorage()] } },
 * });
 * ```
 */
export function convexFileStorage(options: ConvexFileStorageOptions = {}): ConvexStorageAdapter {
  return new ConvexStorageAdapter(options);
}
