import { ADMIN_FIELDS } from "../fields/constants";
import { adminFieldToValidator } from "../fields/validators";
import { CollectionConfig } from "./types";
import type { VexConfig } from "../config";
import { CORE_ADMIN_FIELDS } from "./constants";

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
  config: VexConfig;
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
      // eslint-disable-next-line no-unused-vars
      .filter(([_fieldKey, field]) => {
        if (field.type === ADMIN_FIELDS.relationship.type) {
          return field.collection.slug === props.collection.slug;
        }
        return false;
      })
      // eslint-disable-next-line no-unused-vars
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
 * Converts a resolved `CollectionConfig` to a Convex `defineTable(...)` source string.
 *
 * Iterates the collection's fields, builds each field's Convex validator via
 * `adminFieldToValidator`, and appends index chains:
 * - `.index()` for fields with an explicit `field.index` property
 * - `.index("by_<fieldKey>", ["<fieldKey>"])` auto-generated for every relationship field
 * - `.searchIndex()` for text fields with `field.searchIndex` configured
 * - `.searchIndex("search_<useAsTitle>", { searchField: "<useAsTitle>", filterFields: [] })`
 *   auto-generated when another collection has a relationship pointing HERE and
 *   `useAsTitle` is not a Convex system field (`_id`, `_creationTime`), provided
 *   no manually configured search index already has that name.
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
 */
export function collectionConfigToVexSchema(props: {
  collection: CollectionConfig;
  config: VexConfig;
}): string {
  const fieldsBlock = [];
  const indexes = [];
  const searchIndexes: string[] = [];
  for (const [fieldKey, field] of Object.entries(props.collection.fields)) {
    const validator = adminFieldToValidator({ field });
    fieldsBlock.push(`\t${fieldKey}: ${validator},`);
    if (field.index) {
      indexes.push(`\t.index("${field.index}", ["${fieldKey}"])`);
    } else if (field.type === ADMIN_FIELDS.relationship.type) {
      indexes.push(`\t.index("by_${fieldKey}", ["${fieldKey}"])`);
    }
    if (field.type === ADMIN_FIELDS.text.type && field.searchIndex) {
      searchIndexes.push(`\t.searchIndex("${field.searchIndex.name}", {\n
        searchField: "${fieldKey}",\n
        filterFields: ${JSON.stringify(field.searchIndex.filterFields)},\n
      })`);
    }
  }
  const relationships = getIncomingRelationships({
    collection: props.collection,
    config: props.config,
  });
  relationships.forEach(() => {
    const useAsTitle = props.collection.admin.useAsTitle;
    const coreAdminFields: string[] = Object.values(CORE_ADMIN_FIELDS).map(
      (f) => f.slug,
    );
    if (coreAdminFields.includes(useAsTitle)) return;
    const searchIndex = searchIndexes.find((si) =>
      si.includes(`.searchIndex("search_${useAsTitle}", {`),
    );
    if (searchIndex !== undefined) return;
    searchIndexes.push(`\t.searchIndex("search_${useAsTitle}", {\n
      searchField: "${useAsTitle}",\n
      filterFields: []
    })`);
  });
  return `export const ${props.collection.slug} = defineTable({\n${fieldsBlock.join("\n")}\n
    })${indexes.length > 0 ? `\n${indexes.join("\n")}` : ""}${
      searchIndexes.length > 0 ? `\n${searchIndexes.join("\n")}` : ""
    }
  `;
}
