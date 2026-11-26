import { childInterfaceType } from "../childInterfaceType";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldComponents } from "../utils";
import type { KeyValueFieldInput, KeyValueField } from "./types";
import type { CollectionSlug, VexResourceSlug } from "../../types/generated";

/**
 * Creates a keyValue field with all defaults applied.
 *
 * KeyValue fields store a Convex `v.record(keys, value)` — a dynamically-keyed
 * map from `keys` (`v.string()`, or `v.id(collection)` when `keys` is set) to
 * one shared `value` data field. `value`'s own `required` is forced to `true`
 * (record values can't be `v.optional` in Convex); its `nullable` still
 * applies.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `{}`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 * - `admin.defaultCollapsed` — `false`
 *
 * @param options - KeyValue field configuration. `value` is required; all
 *   other properties are optional.
 * @returns Resolved keyValue field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { keyValue, number } from "@vexcms/core"
 *
 * storageShapes: defineCollection({
 *   fields: {
 *     scores: keyValue({ label: "Scores", value: number({ required: true }) }),
 *   },
 * })
 * ```
 *
 * @see {@link KeyValueFieldInput} for the full input type
 * @see {@link KeyValueField} for the resolved output type
 */
export function keyValue<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TKeysSlug extends CollectionSlug = CollectionSlug,
>(
  options: KeyValueFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, TKeysSlug>,
): KeyValueField<TCollectionSlug, TFieldMeta, TKeysSlug> {
  const keyInterfaceType = options.keys ? `Id<"${options.keys.collection.slug}">` : "string";
  const valueInterfaceType = childInterfaceType(options.value);

  return {
    type: ADMIN_FIELDS.keyValue.type,
    interfaceType: `Record<${keyInterfaceType}, ${valueInterfaceType}>`,

    label: "",
    required: false,
    nullable: false,
    defaultValue: {},
    ...options,

    value: { ...options.value, required: true } as KeyValueField["value"],

    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      defaultCollapsed: false,
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
