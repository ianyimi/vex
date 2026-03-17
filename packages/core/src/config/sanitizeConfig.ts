import type { VexConfig, ClientVexConfig } from "../types";

/**
 * Strip non-serializable values from VexConfig for safe passage across
 * RSC / JSON serialization boundaries (e.g., server layout → client component).
 *
 * Currently strips:
 * - `media.storageAdapter` (contains async functions — only needed at CLI / schema-gen time)
 * - `admin.livePreview.url` function values on collections (replaced with `null`)
 *
 * This function is the single place to extend when new non-serializable
 * properties are added to VexConfig in the future.
 */
export function sanitizeConfigForClient(config: VexConfig): ClientVexConfig {
  const { media, ...rest } = config;

  return {
    ...rest,
    collections: rest.collections.map((collection) => {
      if (!collection.admin?.livePreview) return collection;
      if (typeof collection.admin.livePreview.url === "string") return collection;

      // Strip function URL — replaced with null for RSC serialization.
      // The admin panel resolves function URLs at runtime via livePreviewConfigs prop.
      return {
        ...collection,
        admin: {
          ...collection.admin,
          livePreview: {
            ...collection.admin.livePreview,
            url: null as any,
          },
        },
      };
    }),
    media: media
      ? { collections: media.collections }
      : undefined,
  };
}

/**
 * Extracts a map of collection slug → original livePreview URL function for collections
 * that have function-based preview URLs. Pass this to admin components so they
 * can resolve preview URLs at runtime on the client.
 *
 * @returns Map of collection slug → { url } (only entries with function URLs)
 */
export function extractLivePreviewConfigs(config: VexConfig): Record<string, { url: (doc: { _id: string; [key: string]: any }) => string }> {
  const result: Record<string, { url: (doc: { _id: string; [key: string]: any }) => string }> = {};

  for (const collection of config.collections) {
    if (collection.admin?.livePreview && typeof collection.admin.livePreview.url === "function") {
      result[collection.slug] = { url: collection.admin.livePreview.url };
    }
  }

  return result;
}
