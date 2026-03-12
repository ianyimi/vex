import type { VexField } from "../types/fields";

interface HasSlugAndFields {
  readonly slug: string;
  fields: Record<string, VexField>;
}

interface ConfigShape {
  collections: HasSlugAndFields[];
  globals: HasSlugAndFields[];
  media?: {
    collections: HasSlugAndFields[];
  };
}

export type CollectionKind = "collection" | "media" | "global";

export interface ResolvedCollectionMatch {
  slug: string;
  fields: Record<string, VexField>;
  kind: CollectionKind;
}

/**
 * Get all collections, media collections, and globals as a flat array.
 *
 * Each entry includes the `kind` discriminator so callers can switch on it.
 *
 * @param props.config - The resolved Vex config
 * @param props.excludeGlobals - Skip globals (default: false)
 */
export function getAllCollections(props: {
  config: ConfigShape;
  excludeGlobals?: boolean;
}): ResolvedCollectionMatch[] {
  const { config, excludeGlobals = false } = props;
  const result: ResolvedCollectionMatch[] = [];

  for (const c of config.collections) {
    result.push({ slug: c.slug, fields: c.fields, kind: "collection" });
  }

  if (config.media?.collections) {
    for (const c of config.media.collections) {
      result.push({ slug: c.slug, fields: c.fields, kind: "media" });
    }
  }

  if (!excludeGlobals) {
    for (const g of config.globals) {
      result.push({ slug: g.slug, fields: g.fields, kind: "global" });
    }
  }

  return result;
}

/**
 * Find a collection, media collection, or global by slug across the entire config.
 *
 * Searches in order: collections → media collections → globals.
 * Returns the match with its fields and what kind it is, or null if not found.
 *
 * @param props.slug - The slug to search for
 * @param props.config - The resolved Vex config
 * @param props.excludeGlobals - Skip globals when searching (default: false)
 */
export function findCollectionBySlug(props: {
  slug: string;
  config: ConfigShape;
  excludeGlobals?: boolean;
}): ResolvedCollectionMatch | null {
  return getAllCollections(props).find((c) => c.slug === props.slug) ?? null;
}
