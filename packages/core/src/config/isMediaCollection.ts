import type { AnyVexCollection } from "../types";

interface ConfigWithMedia {
  media?: {
    collections: AnyVexCollection[];
  };
}

/**
 * Check whether a collection is a media collection.
 *
 * Compares the collection's slug against the slugs in `config.media.collections`.
 * Works with both `VexConfig` and `ClientVexConfig` (both have the `media?.collections` shape).
 *
 * @param props.collection - The collection to check
 * @param props.config - The Vex config (or client config) containing media configuration
 * @returns true if the collection's slug matches a media collection slug
 */
export function isMediaCollection(props: {
  collection: AnyVexCollection;
  config: ConfigWithMedia;
}): boolean {
  if (!props.config.media?.collections) return false;
  return props.config.media.collections.some(
    (mc) => mc.slug === props.collection.slug,
  );
}
