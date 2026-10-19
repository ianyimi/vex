import { ADMIN_FIELDS } from "../fields/constants";
import { adminFieldToValidator } from "../fields/validators";
import { CollectionConfig } from "./types";
import type { VexClientConfig } from "../config";
import { CONVEX_SYSTEM_FIELDS } from "./constants";
import { versionFieldsToVexSchema } from "../versions/schema";

/**
 * Describes a relationship field in another collection that points to a given collection.
 *
 * Used by `collectionConfigToVexSchema` to detect whether a search index should be
 * auto-generated on the current collection's `useAsTitle` field.
 *
 * @see {@link getIncomingRelationships}
 */
export interface IncomingRelationship {
  /** The slug of the collection that holds the relationship field. */
  fromSlug: string;
  /** The field key of the relationship field in that collection. */
  fieldKey: string;
}

/**
 * Returns all relationship fields in other collections that point to `collection`.
 *
 * Iterates every collection in `config` (excluding `collection` itself) and collects
 * any field with `type === "relationship"` whose `collection` matches
 * `props.collection.slug`.
 *
 * @param props - Input props.
 * @param props.collection - The collection being checked for incoming relationships.
 * @param props.config - The full resolved VexCMS configuration.
 * @returns An array of `IncomingRelationship` descriptors, empty if none found.
 *
 * @example
 * ```ts
 * // posts has: author: relationship({ collection: "authors" })
 * getIncomingRelationships({ collection: authorsCollection, config })
 * // → [{ fromSlug: "posts", fieldKey: "author" }]
 */
export function getIncomingRelationships(props: {
  collection: CollectionConfig;
  config: VexClientConfig;
}): IncomingRelationship[] {
  const relationships: IncomingRelationship[] = [];
  // NOTE: self-references are intentionally INCLUDED. A collection that has
  // a relationship pointing to itself (e.g. `posts.parent: relationship({
  // slug: "posts" })`) still needs `.searchIndex("search_<useAsTitle>", …)`
  // so the relationship picker can search the same collection it lives in.
  // Skipping self-refs left the picker stuck on the loading state because
  // the picker query targeted an index that was never generated.
  for (const collection of props.config.collections) {
    Object.entries(collection.fields)

      .filter(([_fieldKey, field]) => {
        if (field.type === ADMIN_FIELDS.relationship.type) {
          return field.collection.slug === props.collection.slug;
        }
        if (field.type === ADMIN_FIELDS.upload.type) {
          return field.to === props.collection.slug;
        }
        return false;
      })

      .forEach(([fieldKey, _field]) => {
        relationships.push({
          fieldKey,
          fromSlug: collection.slug,
        });
      });
  }
  return relationships;
}

/**
 * The search index a relationship/upload picker should query when listing
 * candidates from `collection`, derived from that collection's
 * `admin.useAsTitle`.
 */
export interface ResolvedTitleSearchIndex {
  /** The Convex `.searchIndex()` name to query. */
  indexName: string;
  /** The field key the index was built on — always equal to `useAsTitle`. */
  searchField: string;
}

/**
 * Resolves the search index backing a collection's `useAsTitle` field, for
 * use by both schema generation (`collectionConfigToVexSchema`) and the
 * admin picker (`usePaginatedSearch`), so the two agree on a single name.
 *
 * `useAsTitle` is searchable only when it names a field declaring its own
 * `searchIndex` support (`"searchIndex" in field` — `text`, `textarea`,
 * `email`). When that field configures its own `searchIndex` (any name),
 * that index is reused as-is. Otherwise the field is searchable but has no
 * manual index, so the auto-generated `search_<useAsTitle>` name is
 * returned. A `useAsTitle` pointing at a Convex system field (`_id`,
 * `_creationTime`) or at a non-searchable field type (number, date, …)
 * returns `undefined` — the picker falls back to `find()`.
 *
 * @param props - Input props.
 * @param props.collection - The collection whose `useAsTitle` is resolved.
 * @returns The index name + search field to query, or `undefined` when
 *   `useAsTitle` has no backing search index.
 */
export function resolveTitleSearchIndex(props: {
  collection: CollectionConfig;
}): ResolvedTitleSearchIndex | undefined {
  const useAsTitle = props.collection.admin.useAsTitle;
  const coreAdminFields: string[] = Object.values(CONVEX_SYSTEM_FIELDS).map((f) => f.slug);
  if (coreAdminFields.includes(useAsTitle)) return undefined;
  const field = props.collection.fields[useAsTitle];
  if (
    field === undefined ||
    (field.type !== ADMIN_FIELDS.text.type &&
      field.type !== ADMIN_FIELDS.textarea.type &&
      field.type !== ADMIN_FIELDS.email.type)
  ) {
    return undefined;
  }
  if (field.searchIndex) {
    return { indexName: field.searchIndex.name, searchField: useAsTitle };
  }
  return { indexName: `search_${useAsTitle}`, searchField: useAsTitle };
}

/**
 * Converts a resolved `CollectionConfig` to a Convex `defineTable(...)` source string.
 *
 * Iterates the collection's fields, builds each field's Convex validator via
 * `adminFieldToValidator`, and appends index chains:
 * - `.index()` for fields with an explicit `field.index` property
 * - `.index("by_<fieldKey>", ["<fieldKey>"])` auto-generated for every relationship field
 * - `.searchIndex()` for fields declaring their own `field.searchIndex`
 * - a `.searchIndex(...)` for `useAsTitle` auto-generated when another collection has a
 *   relationship pointing HERE, via `resolveTitleSearchIndex` — reuses the `useAsTitle`
 *   field's own `searchIndex` name when it has one, generates `search_<useAsTitle>`
 *   when it doesn't, and is omitted entirely when `useAsTitle` is a Convex system field
 *   or a non-searchable field type
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection definition to convert.
 * @param props.config - The full resolved VexCMS config, needed for cross-collection relationship detection.
 * @returns A TypeScript source string declaring the Convex table.
 *
 * @example
 * ```ts
 * const posts = defineCollection({
 *   slug: "posts",
 *   fields: { author: relationship({ collection: "authors", required: true }) },
 * });
 * collectionConfigToVexSchema({ collection: posts, config });
 * // → 'export const posts = defineTable({...})\n\t.index("by_author", ["author"])'
 *
 * @see {@link generateVexSchema} for the full-file generator that wraps this function
 * @see {@link getIncomingRelationships} for the cross-collection helper
 * @see {@link resolveTitleSearchIndex} for the `useAsTitle` index-name resolution rule
 */
export function collectionConfigToVexSchema(props: {
  collection: CollectionConfig;
  config: VexClientConfig;
}): string {
  const fieldsBlock = [];
  const indexes = [];
  const searchIndexes: string[] = [];
  for (const index of props.collection.indexes ?? []) {
    if (index.draftStatus === true) {
      indexes.push(`\t.index("${index.name}", ${JSON.stringify(["vex_status", ...index.fields])})`);
    } else if (index.draftStatus === "both") {
      indexes.push(`\t.index("${index.name}", ${JSON.stringify(index.fields)})`);
      indexes.push(
        `\t.index("${index.name}__draftStatus", ${JSON.stringify(["vex_status", ...index.fields])})`,
      );
    } else {
      indexes.push(`\t.index("${index.name}", ${JSON.stringify(index.fields)})`);
    }
  }

  for (const [fieldKey, field] of Object.entries(props.collection.fields)) {
    const validator = adminFieldToValidator({ field });
    fieldsBlock.push(`\t${fieldKey}: ${validator},`);

    const fieldIndexName = field.index
      ? field.index
      : field.type === ADMIN_FIELDS.relationship.type
        ? `by_${fieldKey}`
        : undefined;
    // collection indexes preferred since they can be compound indexes
    if (fieldIndexName && !props.collection.indexes?.find((i) => i.name === fieldIndexName)) {
      if (field.indexDraftStatus === true) {
        indexes.push(`\t.index("${fieldIndexName}", ${JSON.stringify(["vex_status", fieldKey])})`);
      } else if (field.indexDraftStatus === "both") {
        indexes.push(`\t.index("${fieldIndexName}", ["${fieldKey}"])`);
        indexes.push(
          `\t.index("${fieldIndexName}__draftStatus", ${JSON.stringify(["vex_status", fieldKey])})`,
        );
      } else {
        indexes.push(`\t.index("${fieldIndexName}", ["${fieldKey}"])`);
      }
    }

    if ("searchIndex" in field && field.searchIndex) {
      searchIndexes.push(`\t.searchIndex("${field.searchIndex.name}", {\n
        searchField: "${fieldKey}",
        filterFields: ${JSON.stringify(field.searchIndex.filterFields)}\n
      })`);
    }
  }

  const relationships = getIncomingRelationships({
    collection: props.collection,
    config: props.config,
  });
  if (relationships.length > 0) {
    const titleSearchIndex = resolveTitleSearchIndex({ collection: props.collection });
    if (titleSearchIndex !== undefined) {
      const titleField = props.collection.fields[titleSearchIndex.searchField];
      const hasOwnSearchIndex =
        titleField !== undefined && "searchIndex" in titleField && titleField.searchIndex !== undefined;
      if (!hasOwnSearchIndex) {
        searchIndexes.push(`\t.searchIndex("${titleSearchIndex.indexName}", {\n
        searchField: "${titleSearchIndex.searchField}",\n
        filterFields: []
      })`);
      }
    }
  }
  if (props.collection.versions.drafts) {
    const versionSchema = versionFieldsToVexSchema({ tableName: props.collection.slug });
    fieldsBlock.push(...versionSchema.fields);
    indexes.push(...versionSchema.indexes);
  }

  return `export const ${props.collection.slug} = defineTable({\n${fieldsBlock.join("\n")}\n
    })${indexes.length > 0 ? `\n${indexes.join("\n")}` : ""}${
      searchIndexes.length > 0 ? `\n${searchIndexes.join("\n")}` : ""
    }
  `;
}
