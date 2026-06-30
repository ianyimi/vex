import type { CollectionConfig } from "../collections";
import { ADMIN_FIELDS } from "../fields/constants";
import { MediaCollectionSlug } from "../types";
import { VexStorageConfigError } from "./types";
import type { MediaCollectionConfig, VexStorageAdapter } from "./types";

interface StorageValidationInput {
  collections: CollectionConfig[];
  storageAdapters?: VexStorageAdapter[];
}

interface StorageValidationOutput {
  mediaCollections: MediaCollectionConfig[];
}

/**
 * Validates storage adapter configuration and merges media collections.
 *
 * Checks:
 * 1. `upload()` fields only exist when storage adapters are configured.
 * 2. Every `upload().to` slug matches a media collection slug.
 * 3. No slug collisions between regular collections and media collections.
 * 4. No duplicate media collection slugs across adapters.
 *
 * @param input — Validation input containing collections and adapters.
 * @returns Merged media collections with `meta.storageAdapterName` set.
 * @throws {VexStorageConfigError} On any validation failure.
 */
export function validateAndMergeStorageConfig(
  input: StorageValidationInput,
): StorageValidationOutput {
  const { collections, storageAdapters } = input;

  // Check if any collection uses upload fields
  const uploadFields: {
    collectionSlug: string;
    fieldName: string;
    to: MediaCollectionSlug;
  }[] = [];
  for (const collection of collections) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.type === ADMIN_FIELDS.upload.type) {
        uploadFields.push({
          collectionSlug: collection.slug,
          fieldName,
          to: field.to,
        });
      }
    }
  }

  // Edge: upload fields without storage adapters
  if (uploadFields.length > 0 && (!storageAdapters || storageAdapters.length === 0)) {
    const fieldList = uploadFields.map((f) => `${f.collectionSlug}.${f.fieldName}`).join(", ");
    throw new VexStorageConfigError(
      `upload() fields require a configured storage adapter. Fields without adapter: ${fieldList}. ` +
        `Add a storage adapter to defineConfig({ storageAdapters: [convexFileStorage({...})] }).`,
    );
  }

  // Merge media collections from all adapters
  const mediaCollections: MediaCollectionConfig[] = [];
  const seenMediaSlugs = new Map<string, string>(); // slug -> adapterName

  if (storageAdapters) {
    for (const adapter of storageAdapters) {
      for (const collection of adapter.mediaCollections) {
        // Check for duplicate media collection slugs across adapters
        if (seenMediaSlugs.has(collection.slug)) {
          const otherAdapter = seenMediaSlugs.get(collection.slug);
          throw new VexStorageConfigError(
            `Duplicate media collection slug "${collection.slug}" defined by both ` +
              `"${otherAdapter}" and "${adapter.name}" adapters. Media collection slugs must be unique across all adapters.`,
          );
        }
        seenMediaSlugs.set(collection.slug, adapter.name);

        // Tag with storageAdapterName
        const taggedCollection: MediaCollectionConfig = {
          ...collection,
          meta: {
            ...collection.meta,
            storageAdapter: adapter.name,
          },
        };
        mediaCollections.push(taggedCollection);
      }
    }
  }

  // Check for slug collisions between regular collections and media collections
  const collectionSlugs = new Set(collections.map((c) => c.slug));
  for (const mediaCollection of mediaCollections) {
    if (collectionSlugs.has(mediaCollection.slug)) {
      throw new VexStorageConfigError(
        `Slug collision: "${mediaCollection.slug}" is defined as both a collection and a media collection. ` +
          `Collection and media collection slugs must be unique.`,
      );
    }
  }

  // Validate upload field references
  if (uploadFields.length > 0) {
    const mediaSlugs = new Set(mediaCollections.map((c) => c.slug));
    const missing = new Set<string>();

    for (const uploadField of uploadFields) {
      if (!mediaSlugs.has(uploadField.to)) {
        missing.add(uploadField.to);
      }
    }

    if (missing.size > 0) {
      throw new VexStorageConfigError(
        `upload() fields reference missing media collections: ${[...missing].join(", ")}. ` +
          `Define these collections via a storage adapter's defineMediaCollection(). ` +
          `Available media collections: ${[...mediaSlugs].join(", ") || "none"}.`,
      );
    }
  }

  return { mediaCollections };
}
