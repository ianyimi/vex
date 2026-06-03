import { ADMIN_FIELDS, wrapLines } from "../fields";
import { CollectionConfig } from "./types";
import { slugToPascalCase } from "./utils";

/**
 * Recursively collects `export type` declarations for every group field that
 * carries an `interfaceName`, at any depth in the field tree.
 *
 * Traversal is depth-first so nested named types are always declared before
 * the parent types that reference them. Both direct group sub-fields and
 * group items inside array fields are visited.
 *
 * @param fields - The field map to walk (collection-level or group sub-fields).
 * @returns Ordered list of `export type Name = ...` strings, ready to prepend
 *   to the generated interface block.
 */
function getFieldInterfaces(fields: CollectionConfig["fields"]): string[] {
  const declarations: string[] = [];

  for (const field of Object.values(fields)) {
    if (field.type === ADMIN_FIELDS.group.type) {
      // Depth-first: collect nested declarations before this one so that
      // sub-group named types are declared before any type that references them.
      declarations.push(...getFieldInterfaces(field.fields));

      if (field.interfaceName) {
        declarations.push(
          `export type ${field.interfaceName} = ${field.interfaceType}`,
        );
      }
    } else if (field.type === ADMIN_FIELDS.array.type) {
      // Array items may themselves be groups — visit their fields too.
      if (field.items.type === ADMIN_FIELDS.group.type) {
        declarations.push(...getFieldInterfaces(field.items.fields));

        if (field.items.interfaceName) {
          declarations.push(
            `export type ${field.items.interfaceName} = ${field.items.interfaceType}`,
          );
        }
      }
    } else if (field.type === ADMIN_FIELDS.blocks.type) {
      // Depth-first: recurse into each block's fields for any named sub-groups,
      // then emit each block's own type declaration.
      for (const block of field.blocks) {
        declarations.push(...getFieldInterfaces(block.fields));
        declarations.push(
          `export type ${block.interfaceName} = ${block.interfaceType}`,
        );
      }
      // Named union alias — emitted after all individual block types.
      if (field.interfaceName) {
        const union = field.blocks.map((b) => b.interfaceName).join(" | ");
        declarations.push(`export type ${field.interfaceName} = ${union}`);
      }
    }
  }

  return declarations;
}

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
  const fieldInterfaces = getFieldInterfaces(collection.fields);
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

/**
 * Converts a resolved `CollectionConfig` to the TypeScript source string for its
 * `CollectionsFieldTypeMap` entry used in the `declare module '@vexcms/core'` block.
 *
 * The output maps each field type present in the collection to a union of that
 * collection's field keys of that type, plus a fixed `id: "_id"` entry. This
 * lets framework code look up field keys by type at the TypeScript level —
 * for example, finding all `text` fields on a given collection for search.
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection definition to convert.
 * @returns A TypeScript source string for one `CollectionsFieldTypeMap` entry (without wrapping braces).
 *
 * @example
 * ```ts
 * const posts = defineCollection({
 *   slug: "posts",
 *   fields: { title: text({ required: true }), author: relationship({ collection: { slug: "authors" } }) },
 * });
 * collectionConfigToFieldTypeMap({ collection: posts });
 * // → '\tposts: {\n\t\tid: "_id"\n\t\ttext: "title"\n\t\trelationship: "author"\n\t}'
 * ```
 *
 * @see {@link generateVexTypes} for the full-file generator that wraps this function
 */
export function collectionConfigToFieldTypeMap(props: {
  collection: CollectionConfig;
}): string {
  const { collection } = props;
  const fieldTypeMap = Object.entries(collection.fields).reduce<
    Record<string, string[]>
  >((acc, [fieldKey, field]) => {
    if (!acc[field.type]) acc[field.type] = [];
    acc[field.type]!.push(`"${fieldKey}"`);
    return acc;
  }, {});
  const interfaceBody = Object.entries(fieldTypeMap).reduce(
    (acc, [fieldType, fields]) => {
      acc += `\t\t${fieldType}: ${fields.join(" | ")}\n`;
      return acc;
    },
    "",
  );
  const interfaceStart = `\t${collection.slug}: {\n
    \t\tid: "_id"
    ${interfaceBody}
    \t}`;
  return interfaceStart;
}
