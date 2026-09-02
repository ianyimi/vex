import { ADMIN_FIELDS, wrapLines, getFieldInterfaces } from "../fields";
import type { GlobalConfig } from "./types";

/**
 * Converts a resolved `GlobalConfig` to a TypeScript `export interface` source string.
 *
 * The generated interface extends `VexDocumentGlobal<"slug">` (which itself
 * extends `VexDocument`), adding user fields at root level. This produces the
 * flat shape returned by `globals.get` — no `data` wrapper.
 *
 * @param props.global - The resolved global definition to convert.
 * @returns TypeScript source string for one flat global interface block.
 *
 * @example
 * ```ts
 * globalConfigToInterface({ global: siteSettings });
 * // → 'export interface SiteSettingsGlobal extends VexDocumentGlobal<"siteSettings"> {\n\tsiteName: string\n\t...\n}'
 * ```
 */
export function globalConfigToInterface(props: { global: GlobalConfig }): string {
  const { global: g } = props;
  const fieldInterfaces = getFieldInterfaces(g.fields);
  const interfaceStart = `export interface ${g.interfaceName} extends VexDocumentGlobal<"${g.slug}"> {`;

  const interfaceFields = Object.entries(g.fields)
    .map(([fieldKey, field]) => {
      let fieldType = field.interfaceType;
      if (field.type === ADMIN_FIELDS.group.type && field.interfaceName) {
        fieldType = field.interfaceName;
      }
      if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
        fieldType = `${field.interfaceName}[]`;
      }
      let jsdocComment = "";
      const jsdoc = field.interfaceDescription ?? field.description;
      if (jsdoc) {
        const linesArray = wrapLines({ text: jsdoc, maxLen: 80 });
        jsdocComment = `\t/**\n${linesArray.map((l) => `\t * ${l}`).join("\n")}\n\t */\n`;
      }
      return `${jsdocComment}\t${fieldKey}${field.required ? "" : "?"}: ${fieldType}`;
    })
    .join("\n");

  return [fieldInterfaces.join("\n\n"), interfaceStart, interfaceFields, "}"].join("\n");
}

/**
 * Converts a resolved `GlobalConfig` to the TypeScript source string for its
 * `GlobalsFieldTypeMap` entry in the `declare module '@vexcms/core'` block.
 *
 * Powers `GlobalRelationshipKeysOf<TGlobalSlug>` for populate type narrowing.
 *
 * @param props.global - The resolved global definition.
 * @returns TypeScript source string for one `GlobalsFieldTypeMap` entry.
 */
export function globalConfigToFieldTypeMap(props: { global: GlobalConfig }): string {
  const { global: g } = props;
  const fieldTypeMap = Object.entries(g.fields).reduce<Record<string, string[]>>(
    (acc, [fieldKey, field]) => {
      if (!acc[field.type]) acc[field.type] = [];
      acc[field.type]!.push(`"${fieldKey}"`);
      return acc;
    },
    {},
  );
  const interfaceBody = Object.entries(fieldTypeMap)
    .map(([fieldType, fields]) => `\t\t${fieldType}: ${fields.join(" | ")}`)
    .join("\n");
  // See `collectionConfigToFieldTypeMap` for why there is no synthetic `id` entry.
  return `\t${g.slug}: {\n${interfaceBody}\n\t}`;
}
