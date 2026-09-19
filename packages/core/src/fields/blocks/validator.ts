import type { GenericDataModel } from "convex/server";
import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { BlocksField, GenericBlock } from "./types";

/**
 * Converts a blocks field definition to a Convex schema validator string.
 *
 * Each block type becomes a `v.object()` with three framework keys first —
 * `blockType: v.literal(slug)`, `blockName: v.optional(v.string())`,
 * `id: v.string()` — followed by the block's own field validators. Multiple
 * block types are combined with `v.union()`; a single block type uses a bare
 * `v.object()`. The whole thing is wrapped in `v.array()`, then `v.optional()`
 * when `field.required` is `false`.
 *
 * @param props - Input props.
 * @param props.field - The resolved blocks field definition.
 * @returns A Convex validator string.
 *
 * @example
 * ```ts
 * const heading   = defineBlock({ slug: "heading",   fields: { text: text({ required: true }) } })
 * const paragraph = defineBlock({ slug: "paragraph", fields: { content: text() } })
 * blocksFieldToValidator({ field: blocks({ blocks: [heading, paragraph] }) })
 * // → 'v.optional(v.array(v.union(
 * //      v.object({ blockType: v.literal("heading"), blockName: v.optional(v.string()), id: v.string(), text: v.string() }),
 * //      v.object({ blockType: v.literal("paragraph"), blockName: v.optional(v.string()), id: v.string(), content: v.optional(v.string()) }),
 * //    )))'
 * ```
 *
 * @internal — Used by CLI schema generation via `adminFieldToValidator`.
 */
export function blocksFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: BlocksField<TFieldMeta>;
}): string {
  const { field } = props;

  const blockObjects = field.blocks.map((block) => {
    const subValidators = Object.entries(block.fields)
      .map(
        ([key, subField]) =>
          `${key}: ${adminFieldToValidator({ field: subField })}`,
      )
      .join(", ");

    const frameworkEntries = [
      `blockType: v.literal("${block.blockType}")`,
      `blockName: v.optional(v.string())`,
      `id: v.string()`,
    ].join(", ");

    const allEntries = subValidators
      ? `${frameworkEntries}, ${subValidators}`
      : frameworkEntries;

    return `v.object({ ${allEntries} })`;
  });

  const itemValidator =
    blockObjects.length === 1
      ? blockObjects[0]!
      : `v.union(\n${blockObjects.map((o) => `  ${o}`).join(",\n")}\n)`;

  return applyBaseValidators({
    field,
    validator: `v.array(${itemValidator})`,
  });
}

/**
 * Types a `blocks()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `GenericBlock[]`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function blocksValidator<
  TCollectionSlug extends CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, GenericBlock[], TDataModel, BlocksField>,
): FieldValidate<TCollectionSlug, GenericBlock[]> {
  return fieldValidator<TCollectionSlug, GenericBlock[], TDataModel, BlocksField>(slug, fn);
}
