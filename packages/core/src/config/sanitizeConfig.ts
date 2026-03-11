import type { VexConfig, ClientVexConfig } from "../types";

/**
 * Strip non-serializable values from VexConfig for safe passage across
 * RSC / JSON serialization boundaries (e.g., server layout → client component).
 *
 * Currently strips:
 * - `media.storageAdapter` (contains async functions — only needed at CLI / schema-gen time)
 *
 * This function is the single place to extend when new non-serializable
 * properties are added to VexConfig in the future.
 */
export function sanitizeConfigForClient(config: VexConfig): ClientVexConfig {
  const { media, ...rest } = config;

  return {
    ...rest,
    media: media
      ? { collections: media.collections }
      : undefined,
  };
}
