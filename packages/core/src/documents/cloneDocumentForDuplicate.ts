import { COLLECTION_SYSTEM_FIELDS } from "../collections/constants";
import { removeVexFields } from "../versions/removeVexFields";
import { ADMIN_FIELDS, cloneBlockWithFreshIds, getDataFields } from "../fields";
import type { AdminField, GenericBlock } from "../fields";

/**
 * Regenerates ids on every array/block item reachable through `field` —
 * a `blocks()`/`group()`/`array()` field, at any nesting depth. Leaf data
 * fields and an unrecognised nested `blockType` are returned unchanged.
 * Mirrors `fields/blocks/utils.ts`'s private `cloneNestedBlockIds`, which
 * only walks a single block's OWN fields — this walks a whole document's.
 *
 * @param props - Input props.
 * @param props.value - The current value at `field`'s path.
 * @param props.field - The field definition describing `value`'s shape.
 * @returns `value`, with every nested block's `id` (and its own nested
 *   blocks) replaced; `value` itself unchanged if `field` is not
 *   `blocks()`/`group()`/`array()`.
 */
function regenerateNestedIds(props: { value: unknown; field: AdminField }): unknown {
  const { value, field } = props;
  if (value == null) return value;
  if (field.type === ADMIN_FIELDS.blocks.type) {
    const blockDefMap = new Map(field.blocks.map((blockDef) => [blockDef.blockType, blockDef]));
    return (value as GenericBlock[]).map((item) => {
      const itemBlockDef = blockDefMap.get(item.blockType as string);
      return itemBlockDef
        ? cloneBlockWithFreshIds({ block: item, blockDef: itemBlockDef })
        : item;
    });
  }
  if (field.type === ADMIN_FIELDS.group.type) {
    const groupValue = (value ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown> = { ...groupValue };
    for (const [key, subField] of Object.entries(field.fields)) {
      if (key in groupValue) {
        result[key] = regenerateNestedIds({ value: groupValue[key], field: subField });
      }
    }
    return result;
  }
  if (field.type === ADMIN_FIELDS.array.type) {
    return (value as unknown[]).map((item) => regenerateNestedIds({ value: item, field: field.items }));
  }
  return value;
}

/**
 * Builds the payload for a duplicated document: the source document's saved
 * values, with every framework field stripped and every array/block item's
 * `id` regenerated so the clone shares no item identity with the original.
 *
 * Decision 8 (spec.md): only framework fields are stripped — `_id`,
 * `_creationTime`, `updatedAt`, and (versioned collections only) `vex_status`,
 * `vex_publishedAt`, `vex_publishedId`, `vex_activeVersion`. Every other
 * value, including unique fields like a `slug`, copies as-is; a unique-value
 * conflict is resolved by the fallback create modal (Step 6, decision 7).
 *
 * @param props - Input props.
 * @param props.fields - The source collection's resolved `fields` map
 *   (`collection.fields`, not yet flattened).
 * @param props.document - The saved document being duplicated, as returned
 *   from `vexConvexApi.get`/`find` (a `VexDocument`/`VexVersionDocument`).
 * @returns A plain object: `props.document` minus every framework field,
 *   with a fresh `id` on every array/block item at any nesting depth. Ready
 *   to pass as `data` to `create()` (Step 6).
 * @throws {Error} Propagated from `getDataFields` if `props.fields` is
 *   malformed (duplicate field key across tabs) — `props.fields` is assumed
 *   to be an already-validated `collection.fields`.
 */
export function cloneDocumentForDuplicate(props: {
  fields: Record<string, AdminField>;
  document: Record<string, unknown>;
}): Record<string, unknown> {
  const dataFields = getDataFields({ fields: props.fields });
  const stripped = removeVexFields({ doc: props.document });
  delete stripped[COLLECTION_SYSTEM_FIELDS.updatedAt.slug];

  const cloned: Record<string, unknown> = { ...stripped };
  for (const [key, field] of Object.entries(dataFields)) {
    if (key in cloned) {
      cloned[key] = regenerateNestedIds({ value: cloned[key], field });
    }
  }
  return cloned;
}
