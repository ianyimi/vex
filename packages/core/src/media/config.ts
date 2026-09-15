import type { CollectionConfig } from "../collections";
import { ADMIN_FIELDS } from "../fields/constants";
import { VexStorageConfigError } from "./types";
import type { MediaCollectionConfig } from "./types";

interface StorageValidationInput {
  collections: CollectionConfig[];
  mediaCollections: MediaCollectionConfig[];
}

/**
 * Validates a config's media wiring.
 *
 * Checks:
 * 1. Every `upload().to` slug names a declared media collection.
 * 2. No slug is used by both a regular collection and a media collection.
 *
 * Media collections arrive pre-declared on the client config as of the
 * client/server config split, so there is no adapter list to flatten or
 * de-duplicate here anymore — `defineServerConfig()` separately confirms each
 * one's `meta.storageAdapter` resolves to a registered adapter instance.
 *
 * @param input - The collections and media collections to validate against each other.
 * @param input.collections - All registered collections, auth and internal ones included.
 * @param input.mediaCollections - Media collections declared on the config.
 * @throws {VexStorageConfigError} On any validation failure.
 */
export function validateAndMergeStorageConfig(input: StorageValidationInput): void {
  const { collections, mediaCollections } = input;
  const mediaSlugs = new Set(mediaCollections.map((c) => c.slug));

  const missing = new Set<string>();
  for (const collection of collections) {
    for (const field of Object.values(collection.fields)) {
      if (field.type === ADMIN_FIELDS.upload.type && !mediaSlugs.has(field.to)) {
        missing.add(field.to);
      }
    }
  }
  if (missing.size > 0) {
    throw new VexStorageConfigError(
      `upload() fields reference missing media collections: ${[...missing].join(", ")}. ` +
        `Declare them on defineConfig({ mediaCollections: [...] }) using a storage package's defineMediaCollection(). ` +
        `Available media collections: ${[...mediaSlugs].join(", ") || "none"}.`,
    );
  }

  const collectionSlugs = new Set(collections.map((c) => c.slug));
  for (const mediaCollection of mediaCollections) {
    if (collectionSlugs.has(mediaCollection.slug)) {
      throw new VexStorageConfigError(
        `Slug collision: "${mediaCollection.slug}" is defined as both a collection and a media collection. ` +
          `Collection and media collection slugs must be unique.`,
      );
    }
  }
}
