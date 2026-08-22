import type { ComponentHKT } from "../fields";
import { slugToPascalCase } from "../collections/utils";
import type { GlobalConfig, GlobalConfigInput, ReservedGlobalFieldKey } from "./types";
import type { GlobalSlug } from "../types/generated";

/**
 * Defines a singleton global document for the VexCMS project.
 *
 * **Flat API:** `globals.get({ slug: "siteSettings" })` returns a flat document
 * where user fields (`siteName`, `activeTheme`, …) are at root level alongside
 * `_id`, `_creationTime`, and `_slug`. The DB stores data nested in a `data`
 * field; the VexCMS API layer handles flattening on read and re-nesting on write.
 *
 * **Reserved field keys:** `_id`, `_creationTime`, and `_slug` may not be used
 * as field names. A compile-time error is emitted on the offending field when
 * they are used. A runtime error is also thrown for JS consumers.
 *
 * @typeParam TFieldMeta - Metadata on each field definition.
 * @typeParam TGlobalMeta - Metadata on the global config itself.
 * @typeParam TGlobalSlug - The slug string literal (inferred by TypeScript).
 * @typeParam TFieldSlug - Union of field key string literals.
 * @typeParam TComponent - Framework HKT binding.
 * @param config - The raw global configuration.
 * @returns The resolved `GlobalConfig` with all defaults applied.
 * @throws {Error} When `config.fields` contains one of the reserved keys
 *   `_id`, `_creationTime`, or `_slug`.
 *
 * @example
 * ```ts
 * export const siteSettings = defineGlobal({
 *   slug: "siteSettings",
 *   label: "Site Settings",
 *   fields: {
 *     siteName: text({ label: "Site Name", required: true }),
 *     activeTheme: relationship({ label: "Active Theme", collection: "themes" }),
 *   },
 *   admin: { group: "Site Builder" },
 * });
 * ```
 *
 * @see {@link GlobalConfigInput} for the user-facing input type
 * @see {@link GlobalConfig} for the resolved return type
 */
export function defineGlobal<
  TFieldMeta extends {} = {},
  TGlobalMeta extends {} = {},
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  config: string extends TFieldSlug
    ? GlobalConfigInput<TFieldMeta, TGlobalMeta, TGlobalSlug, TFieldSlug, TComponent>
    : [TFieldSlug & ReservedGlobalFieldKey] extends [never]
      ? GlobalConfigInput<TFieldMeta, TGlobalMeta, TGlobalSlug, TFieldSlug, TComponent>
      : {
          fields: {
            [K in TFieldSlug &
              ReservedGlobalFieldKey]: "Field name is reserved — cannot use _id, _creationTime, or _slug";
          };
        },
): GlobalConfig<TFieldMeta, TGlobalMeta, TGlobalSlug, TFieldSlug, TComponent> {
  // Runtime guard for JS consumers
  const reservedKeys: ReservedGlobalFieldKey[] = ["_id", "_creationTime", "_slug"];
  for (const key of reservedKeys) {
    if (key in (config as GlobalConfigInput).fields) {
      throw new Error(
        `defineGlobal: field key "${key}" is reserved and cannot be used in global "${(config as GlobalConfigInput).slug}". ` +
          `Reserved keys: ${reservedKeys.join(", ")}.`,
      );
    }
  }

  const input = config as GlobalConfigInput<
    TFieldMeta,
    TGlobalMeta,
    TGlobalSlug,
    TFieldSlug,
    TComponent
  >;

  return {
    ...input,
    interfaceName: input.interfaceName ?? slugToPascalCase({ slug: input.slug }) + "Global",
    admin: {
      group: "",
      description: "",
      components: {},
      ...input.admin,
    },
    meta: (input.meta ?? {}) as TGlobalMeta,
    versions: {
      drafts: false,
      ...input.versions,
    },
  };
}
