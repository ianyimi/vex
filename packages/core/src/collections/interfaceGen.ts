import { ADMIN_FIELDS } from "../fields";
import { CollectionConfig } from "./types";
import { slugToPascalCase } from "./utils";

/**
 * Converts a resolved `CollectionConfig` to a TypeScript `export interface` source string.
 *
 * Each generated interface extends `VexDocument` (inheriting `_id` and `_creationTime`)
 * and overrides `_id` with the branded Convex `Id<"slug">` type for that collection.
 * Optional fields (`field.required === false`) are emitted with the `?` modifier.
 * `select` fields with custom options emit a companion type alias above the interface.
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection definition to convert.
 * @returns A TypeScript source string for one document interface block.
 *
 * @example
 * ```ts
 * const collection = defineCollection({
 *   slug: "posts",
 *   fields: { title: text({ required: true }), excerpt: text({ required: false }) },
 * });
 * collectionConfigToInterface({ collection });
 * // → 'export interface PostsDocument extends VexDocument {\n\t_id: Id<"posts">\n\ttitle: string\n\texcerpt?: string\n}'
 * ```
 *
 * @see {@link generateVexTypes} for the full-file generator that wraps this function
 */
export function collectionConfigToInterface(props: {
  collection: CollectionConfig;
}): string {
  const { collection } = props;
  const interfaceStart = `export interface ${collection.interfaceName} extends VexDocument {\n
    \t_id: Id<"${collection.slug}">`;

  const collectionSubTypes: string[] = [];
  const interfaceFields = Object.entries(collection.fields)
    .map(([fieldKey, field]) => {
      let fieldType = field.interfaceType;
      if (field.type === ADMIN_FIELDS.select.type) {
        fieldType =
          field.optionInterfaceName ??
          `${slugToPascalCase({ slug: fieldKey })}Option`;
        collectionSubTypes.push(
          `type ${fieldType} = ${field.options.map((o) => `"${o.value}"`).join(" | ")}`,
        );
      }
      return `\t${fieldKey}${field.required ? "" : "?"}: ${fieldType}`;
    })
    .join("\n");

  return [
    collectionSubTypes.join("\n"),
    interfaceStart,
    interfaceFields,
    "}",
  ].join("\n");
}
