import { nanoid } from "nanoid";
import { ADMIN_FIELDS } from "../constants";
import { getDataFields } from "../utils";
import { RESERVED_BLOCK_FIELD_NAMES } from "./types";
import type { BlockConfig, GenericBlock } from "./types";
import type { AdminField } from "../types";

/**
 * Builds the default value for a new block of the given type.
 *
 * @param props - Input props.
 * @param props.blockDef - The block type to build a default value for.
 * @returns A new block object with a fresh `id`, `blockType`, and each
 *   sub-field initialised to its `defaultValue` (or `null`). `blockName` is
 *   left unset so the admin UI's placeholder (the block's label) shows.
 */
export function buildDefaultBlock(props: { blockDef: BlockConfig }): GenericBlock {
  const { blockDef } = props;
  const dataFields = getDataFields({ fields: blockDef.fields });
  const fieldDefaults = Object.fromEntries(
    Object.entries(dataFields).map(([key, subField]) => [key, subField.defaultValue ?? null]),
  );
  return {
    id: nanoid(),
    blockType: blockDef.blockType,
    ...fieldDefaults,
  };
}

/**
 * Recursively regenerates ids on every nested block item reachable through
 * `field` — a nested `blocks()` field, directly or wrapped in `group()`/`array()`.
 * Leaf fields and unrecognised nested `blockType`s are returned unchanged.
 *
 * @param props - Input props.
 * @param props.value - The current value at `field`'s path.
 * @param props.field - The field definition describing `value`'s shape.
 * @returns `value`, with every nested block's `id` (and ITS nested blocks) replaced.
 */
function cloneNestedBlockIds(props: { value: unknown; field: AdminField }): unknown {
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
        result[key] = cloneNestedBlockIds({ value: groupValue[key], field: subField });
      }
    }
    return result;
  }
  if (field.type === ADMIN_FIELDS.array.type) {
    return (value as unknown[]).map((item) => cloneNestedBlockIds({ value: item, field: field.items }));
  }
  return value;
}

/**
 * Clones a block item with a fresh `id`, recursively regenerating ids on
 * every nested block reachable through its own fields.
 *
 * @param props - Input props.
 * @param props.block - The block item to clone.
 * @param props.blockDef - The block type definition `block.blockType` resolves to.
 * @returns A new block object: the same keys as `block`, a fresh top-level
 *   `id`, and fresh ids on every nested block item.
 */
export function cloneBlockWithFreshIds(props: { block: GenericBlock; blockDef: BlockConfig }): GenericBlock {
  const { block, blockDef } = props;
  const dataFields = getDataFields({ fields: blockDef.fields });
  const cloned: GenericBlock = { ...block, id: nanoid() };
  for (const [key, subField] of Object.entries(dataFields)) {
    if (!(key in cloned)) continue;
    cloned[key] = cloneNestedBlockIds({ value: cloned[key], field: subField });
  }
  return cloned;
}

/**
 * Coerces an arbitrary object (e.g. pasted from the block clipboard) into a
 * valid block of `blockDef`'s shape: a fresh `id`, keys `blockDef` does not
 * declare dropped, and keys it declares but `block` is missing filled with
 * their field default. `blockName` is kept when present and a string. Every
 * nested block reachable through `blockDef`'s own fields also gets a fresh id.
 *
 * @param props - Input props.
 * @param props.block - The untrusted candidate block object.
 * @param props.blockDef - The target field's block type definition to coerce against.
 * @returns The coerced block plus the keys from `block` that were dropped.
 */
export function coerceBlockToDefinition(props: {
  block: Record<string, unknown>;
  blockDef: BlockConfig;
}): { block: GenericBlock; droppedKeys: string[] } {
  const { block, blockDef } = props;
  const dataFields = getDataFields({ fields: blockDef.fields });
  const droppedKeys: string[] = [];
  const coerced: GenericBlock = {
    id: nanoid(),
    blockType: blockDef.blockType,
    ...Object.fromEntries(
      Object.entries(dataFields).map(([key, subField]) => [key, subField.defaultValue ?? null]),
    ),
  };
  if (typeof block.blockName === "string") {
    coerced.blockName = block.blockName;
  }
  for (const key of Object.keys(block)) {
    if ((RESERVED_BLOCK_FIELD_NAMES as readonly string[]).includes(key)) continue;
    const subField = dataFields[key];
    if (!subField) {
      droppedKeys.push(key);
      continue;
    }
    coerced[key] = cloneNestedBlockIds({ value: block[key], field: subField });
  }
  return { block: coerced, droppedKeys };
}
