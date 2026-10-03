import { ADMIN_FIELDS, wrapLines, getFieldInterfaces } from "../fields";
import { CollectionConfig } from "./types";
import { slugToPascalCase } from "./utils";

/**
 * Converts a resolved `CollectionConfig` to a TypeScript `export interface` source string.
 *
 * Each generated interface extends `VexDocument` (inheriting `_id` and `_creationTime`)
 * and overrides `_id` with the branded Convex `Id<"slug">` type for that collection.
 * Optional fields (`field.required === false`) are emitted with the `?` modifier.
 * `select` fields with custom options emit a companion type alias above the interface,
 * named `<InterfaceName><FieldKey>Option` so the same field key on two collections does
 * not produce two aliases with one name. Override with the field's `optionInterfaceName`.
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
export function collectionConfigToInterface(props: { collection: CollectionConfig }): string {
  const { collection } = props;
  const fieldInterfaces = getFieldInterfaces(collection.fields);
  const interfaceStart = `export interface ${collection.interfaceName} extends VexDocument {\n
    \t_id: Id<"${collection.slug}">`;

  const collectionSubTypes: string[] = [];
  const interfaceFields = Object.entries(collection.fields)
    .map(([fieldKey, field]) => {
      let fieldType = field.interfaceType;
      if (field.type === ADMIN_FIELDS.select.type) {
        // Qualified by the collection's interface name, not the field key alone.
        // The field key alone collides whenever two collections declare a `select`
        // under the same name — `status` on three content collections emitted three
        // `StatusOption` aliases and broke the generated file. Interface names are
        // already unique (two collections sharing one would collide on the interface
        // itself), so qualifying is sufficient without any cross-collection state.
        //
        // Safe to rename: this alias is deliberately NOT exported, so nothing outside
        // the generated file can reference it.
        const optionName =
          field.optionInterfaceName ??
          `${collection.interfaceName}${slugToPascalCase({ slug: fieldKey })}Option`;
        collectionSubTypes.push(
          `type ${optionName} = ${field.options.map((o) => `"${o.value}"`).join(" | ")}`,
        );
        // `[]` matters: a `select` stores `v.array(...)` (see `ADMIN_FIELDS.select`,
        // whose own `interfaceType` is `string[]`), and substituting the bare union
        // name here used to drop it — so the generated interface promised a scalar
        // while the deployed schema rejected one. Inserting the documented value then
        // failed at runtime with a validator error, and an access constraint written
        // as `q.eq("status", "published")` typechecked against a shape that can never
        // match a stored row.
        fieldType = `${optionName}[]`;
      }
      if (field.type === ADMIN_FIELDS.group.type && field.interfaceName) {
        fieldType = field.interfaceName;
      }
      if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
        fieldType = `${field.interfaceName}[]`;
      }
      let jsdocComment = "";
      const jsdoc = field.interfaceDescription ?? field.description;
      if (jsdoc) {
        const linesArray = wrapLines({
          text: jsdoc,
          maxLen: 80,
        });
        jsdocComment = `\t/**\n${linesArray.map((l) => `\t * ${l}`).join("\n")}\n\t */\n`;
      }
      return `${jsdocComment}\t${fieldKey}${field.required ? "" : "?"}: ${fieldType}`;
    })
    .join("\n");

  return [
    fieldInterfaces.join("\n\n"),
    collectionSubTypes.join("\n"),
    interfaceStart,
    interfaceFields,
    "}",
  ].join("\n");
}
