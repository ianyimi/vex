import { ADMIN_FIELDS } from "../fields/constants";
import { adminFieldToValidator } from "../fields/validators";
import { CollectionConfig } from "./types";

/**
 * Converts a resolved `CollectionConfig` to a Convex `defineTable(...)` source string.
 *
 * Iterates the collection's fields, builds each field's Convex validator, and appends
 * `.index()` and `.searchIndex()` chains for any indexed fields. The returned string
 * is a single `export const` declaration intended for inclusion in `vex.schema.ts`.
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection definition to convert.
 * @returns A TypeScript source string declaring the Convex table (e.g. `export const posts = defineTable({...})`).
 *
 * @example
 * ```ts
 * const collection = defineCollection({
 *   slug: "posts",
 *   fields: {
 *     title: text({ required: true }),
 *     slug:  text({ required: true, index: "by_slug" }),
 *   },
 * });
 * collectionConfigToVexSchema({ collection });
 * // → 'export const posts = defineTable({\n\ttitle: v.string()\n\tslug: v.string()\n})\n\t.index("by_slug", ["slug"])\n'
 * ```
 *
 * @see {@link generateVexSchema} for the full-file generator that wraps this function
 * @see {@link adminFieldToValidator} for the per-field validator logic
 */
export function collectionConfigToVexSchema(props: {
  collection: CollectionConfig;
}): string {
  const fieldsBlock = [];
  const indexes = [];
  const searchIndexes = [];
  for (const [fieldKey, field] of Object.entries(props.collection.fields)) {
    const validator = adminFieldToValidator({ field });
    fieldsBlock.push(`\t${fieldKey}: ${validator},`);
    if (field.index) {
      indexes.push(`\t.index("${field.index}", ["${fieldKey}"])`);
    }
    if (field.type === ADMIN_FIELDS.text.type && field.searchIndex) {
      searchIndexes.push(`\t.searchIndex("${field.searchIndex.name}", {\n
          searchField: "${fieldKey}",\n
          filterFields: ${JSON.stringify(field.searchIndex.filterFields)},\n
        })`);
    }
  }
  return `export const ${props.collection.slug} = defineTable({\n${fieldsBlock.join("\n")}\n
    })${indexes.length > 0 ? `\n${indexes.join("\n")}` : ""}${
      searchIndexes.length > 0 ? `\n${searchIndexes.join("\n")}` : ""
    }
  `;
}
