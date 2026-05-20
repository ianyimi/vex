import { ADMIN_FIELDS } from "../constants";
import { adminFieldToJSDocComment } from "../utils";
import type { GroupFieldInput, GroupField } from "./types";

/**
 * Creates a group field with all defaults applied.
 *
 * Group fields store a named set of sub-fields as a single nested Convex
 * `v.object({...})`. Each sub-field respects its own `required` setting —
 * required sub-fields emit bare validators (e.g. `v.string()`); optional
 * ones emit `v.optional(v.string())`.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `{}`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Group field configuration. `fields` is required; all other
 *   properties are optional.
 * @returns Resolved group field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { group, text, url } from "@vexcms/core"
 *
 * posts: defineCollection({
 *   fields: {
 *     seo: group({
 *       label: "SEO",
 *       fields: {
 *         title:       text({ required: true }),
 *         description: text(),
 *         ogImage:     url(),
 *       },
 *     }),
 *   },
 * })
 * ```
 *
 * @see {@link GroupFieldInput} for the full input type
 * @see {@link GroupField} for the resolved output type
 */
export function group<TFieldMeta extends {} = {}>(
  options: GroupFieldInput<TFieldMeta>,
): GroupField<TFieldMeta> {
  // Compute the TypeScript interface type string from sub-fields so that
  // generateVexTypes emits accurate per-field types rather than `object`.
  const computedInterfaceType = buildInterfaceType(options.fields);

  return {
    type: ADMIN_FIELDS.group.type,
    interfaceType: computedInterfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: {},
    defaultOpen: true,
    ...options,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options?.admin,
    },
  };
}

/**
 * Builds a TypeScript object-type string from a record of sub-fields.
 *
 * Used by `group()` to compute `GroupField.interfaceType`.
 *
 * @param fields - The sub-field record from the group config.
 * @returns A TypeScript type string, e.g. `"{ title: string; description?: string }"`.
 */
function buildInterfaceType(fields: GroupFieldInput["fields"]): string {
  const entries = Object.entries(fields)
    .map(([key, field]) => {
      const jsdocComment = adminFieldToJSDocComment({ field });
      const typeStr =
        field.type === ADMIN_FIELDS.group.type && field.interfaceName
          ? field.interfaceName
          : field.interfaceType;
      return `\n${jsdocComment}${key}${field.required ? "" : "?"}: ${typeStr}`;
    })
    .join("; ");
  return `{ ${entries} }`;
}
