import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "../constants";
import type { RelationshipFieldInput, RelationshipField } from "./types";
import type { CollectionSlug , VexResourceSlug } from "../../types/generated";
import { ComponentHKT } from "../../components/types";
import { BaseFieldMeta } from "../types";
import { resolveFieldLimit, resolveFieldComponents } from "../utils";

/**
 * Creates a relationship field with all defaults applied.
 *
 * Stores Convex `Id` references pointing to documents in another registered collection.
 * The generated Convex schema **always** emits `v.array(v.id("collection"))` regardless
 * of `hasMany` — `hasMany` is a UI-only hint that controls whether the admin picker allows
 * one or multiple selections; it does not change the stored Convex type.
 * A `.index("by_<fieldKey>", ["<fieldKey>"])` is auto-generated for every relationship
 * field — no explicit `index` property needed.
 *
 * `TTargetSlug` is inferred from `options.collection`. After running `vex generate`,
 * passing an unregistered slug is a compile-time error.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from field key by `defineCollection`)
 * - `required` — `false`
 * - `hasMany` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @typeParam TTargetSlug - Inferred from `options.collection`.
 * @param options - Relationship field config. `collection` is required.
 * @returns Resolved relationship field definition with all defaults applied.
 *
 * @example
 * ```ts
 * // Single reference — stores Id<"authors">
 * author: relationship({ collection: { slug: "authors" } })
 *
 * // Multi-reference — stores Id<"tags">[]
 * tags: relationship({ collection: { slug: "tags" }, hasMany: true, required: false })
 * ```
 *
 * @see {@link RelationshipFieldInput} for the full input type
 * @see {@link RelationshipField} for the resolved output type
 */
export function relationship<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  THasMany extends boolean = boolean,
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  options: RelationshipFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, THasMany, TTargetSlug, TComponent>,
): RelationshipField<TCollectionSlug, TFieldMeta, TTargetSlug, TComponent> {
  const schema =
    options.schema?.validator !== undefined
      ? { validator: options.schema.validator }
      : undefined;
  return {
    label: "",
    required: false,
    nullable: false,
    hasMany: false,
    ...options,
    schema,
    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value} related items.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value} related items.`,
    }),
    type: ADMIN_FIELDS.relationship.type,
    interfaceType:
      options.schema?.validator === FIELD_SCHEMA_VALIDATORS.id
        ? `Id<"${options.collection.slug}">`
        : options.schema?.validator === FIELD_SCHEMA_VALIDATORS.string
          ? "string"
          : `Id<"${options.collection.slug}">[]`,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
