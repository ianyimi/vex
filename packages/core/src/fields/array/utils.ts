import { nanoid } from "nanoid";
import { ADMIN_FIELDS } from "../constants";
import { walkVariantValue } from "../variant";
import type { BlocksField } from "../blocks";
import type { AdminField } from "../types";

/** Singular item label used when an array's `items` field has no `label`. */
export const DEFAULT_ARRAY_ITEM_LABEL = "Item";

/**
 * The singular label for one item of an array — its `items` field's own
 * `label` ("Grid Item"), falling back to {@link DEFAULT_ARRAY_ITEM_LABEL}. The
 * array's own `label` ("Grid Items") is the plural.
 *
 * @returns The item's own label, or {@link DEFAULT_ARRAY_ITEM_LABEL} if unset.
 */
export function arrayItemLabel(field: { items: { label: string } }): string {
  return field.items.label || DEFAULT_ARRAY_ITEM_LABEL;
}

/** Plural label used when an array has no `label` (one not keyed by `defineCollection`). */
export const DEFAULT_ARRAY_LABEL = "Items";

/**
 * The plural label for an array's items — its own `label`, falling back to
 * {@link DEFAULT_ARRAY_LABEL}.
 *
 * @returns The array's own label, or {@link DEFAULT_ARRAY_LABEL} if unset.
 */
export function arrayPluralLabel(field: { label: string }): string {
  return field.label || DEFAULT_ARRAY_LABEL;
}

/**
 * Whether an array's `items` field type produces an object-shaped value —
 * today only `group()` (`v.object(...)`); every other field type's own item
 * validator is a scalar, a union (`select`), or itself a `v.array(...)`.
 *
 * The one predicate every "does this array item need a stored `id`"
 * decision shares — the Convex validator (`validator.ts`), the admin form
 * schema (`inputSchema.ts`), type generation (`config.ts`), the write-path
 * backfill below, and `FormArray`'s client-side id assignment —
 * so a second object-shaped field type later is a one-line change here,
 * not five.
 *
 * @param itemField - The array's own `field.items` definition.
 * @returns `true` if `itemField` is a `group()`, `false` otherwise.
 */
export function isObjectShapedArrayItem(itemField: AdminField): boolean {
  return itemField.type === ADMIN_FIELDS.group.type;
}

/**
 * Assigns a fresh `id` to one object-shaped array item that doesn't already
 * carry a (string) one. Shared by the server write path
 * ({@link assignArrayItemIds}, below) and `FormArray`'s own `handleAdd`/
 * `handleDuplicate`, so both sides generate ids identically —
 * mirroring how `cloneBlockWithFreshIds` is the one place block ids get
 * (re)assigned.
 *
 * @param props.item - The item value. Returned unchanged for a
 *   non-object-shaped `itemField` — scalars have no `id` slot.
 * @param props.itemField - The array's own `field.items` definition.
 * @returns `item` unchanged (scalar item), or a shallow copy with `id` set
 *   to its existing string id or a fresh `nanoid()`.
 */
export function withArrayItemId<T>(props: { item: T; itemField: AdminField }): T {
  if (!isObjectShapedArrayItem(props.itemField)) return props.item;
  const item = (props.item ?? {}) as Record<string, unknown>;
  return { ...item, id: typeof item.id === "string" ? item.id : nanoid() } as T;
}

/**
 * Recursively backfills a stored `id` onto every object-shaped array item
 * anywhere in `data` — walking `fields` the same shape
 * `getFieldsInputSchema`/`validateFields` already do: into a `group`'s own
 * sub-fields, into an `array`'s items (including a nested `array` of
 * `array`), into each `blocks()` item's own matching block-type fields, into
 * a `keyValue`'s entries, and into a `variant`'s active member's fields
 * (discriminated: the stored discriminator's member; primitive: the member
 * {@link classifyVariantValueKind} resolves the stored value to) — so an
 * array of groups nested inside a block, another group, a keyValue entry, or
 * a variant member gets ids too, not just a top-level array field. Pure:
 * returns a new object, never mutates `data`.
 *
 * Called by `prepareEdit` on `mergedFields`, before the `beforeChange` hook
 * runs — the one place EVERY write (`create`, `update`, the Local API, a
 * project's own Convex mutation calling `prepareEdit` directly) passes
 * through, so a caller that skips `FormArray`'s own id assignment still
 * gets a valid stored id before the write lands. This is WHY the Convex
 * validator accepts `id: v.optional(v.string())` rather than requiring one
 * outright (`validator.ts`'s own doc comment) — optional only for existing,
 * pre-this-step documents; every NEW write is backfilled here regardless.
 *
 * @param props.fields - The field map to walk (a collection's own
 *   top-level fields for the entry call, a block type's own `fields` or a
 *   group's own `fields` for a recursive call).
 * @param props.data - The document (or nested object) to backfill ids into.
 * @returns A new object, structurally identical to `data` except every
 *   object-shaped array item gains an `id` if it lacked one.
 */
export function assignArrayItemIds(props: {
  fields: Record<string, AdminField>;
  data: Record<string, unknown>;
}): Record<string, unknown> {
  const result: Record<string, unknown> = { ...props.data };
  for (const [key, field] of Object.entries(props.fields)) {
    result[key] = backfillFieldValue({ value: result[key], field });
  }
  return result;
}

/**
 * Backfills ids reachable through one field's value — the recursive step
 * {@link assignArrayItemIds} delegates to per field-map entry, generalized
 * to a single `(value, field)` pair so {@link walkVariantValue} can recurse
 * through a `variant()` member's own sub-fields the same way.
 *
 * @returns `props.value` unchanged for a leaf field type or an unmatched
 *   container value; otherwise a new value with every reachable id backfilled.
 */
function backfillFieldValue(props: { value: unknown; field: AdminField }): unknown {
  const { value, field } = props;
  if (field.type === ADMIN_FIELDS.array.type) {
    return backfillArrayValue({ itemField: field.items, value });
  }
  if (field.type === ADMIN_FIELDS.group.type && value && typeof value === "object") {
    return assignArrayItemIds({ fields: field.fields, data: value as Record<string, unknown> });
  }
  if (field.type === ADMIN_FIELDS.blocks.type && Array.isArray(value)) {
    return backfillBlocksValue({ field, value });
  }
  if (field.type === ADMIN_FIELDS.keyValue.type && value && typeof value === "object") {
    const record: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
      record[entryKey] = backfillKeyValueEntry({ valueField: field.value, value: entryValue });
    }
    return record;
  }
  if (field.type === ADMIN_FIELDS.variant.type) {
    return walkVariantValue({ value, field, recurse: backfillFieldValue });
  }
  return value;
}

/**
 * Backfills one array field's own value — the recursive step
 * {@link assignArrayItemIds} delegates array-typed fields to, split out so a
 * nested `array({ items: array({ items: group() }) })` recurses through its
 * own `items` without re-walking a sibling field map.
 *
 * @returns `props.value` unchanged if not an array; otherwise a new array
 *   with every object-shaped item backfilled with an `id`.
 */
function backfillArrayValue(props: { itemField: AdminField; value: unknown }): unknown {
  if (!Array.isArray(props.value)) return props.value;
  const { itemField } = props;
  if (itemField.type === ADMIN_FIELDS.group.type) {
    return props.value.map((item) =>
      withArrayItemId({
        item: assignArrayItemIds({
          fields: itemField.fields,
          data: item as Record<string, unknown>,
        }),
        itemField,
      }),
    );
  }
  if (itemField.type === ADMIN_FIELDS.array.type) {
    return props.value.map((row) => backfillArrayValue({ itemField: itemField.items, value: row }));
  }
  return props.value;
}

/**
 * Backfills ids on a `blocks()` value's items — mapping each stored item to
 * its matching block type and delegating to {@link assignArrayItemIds} for
 * that type's own `fields`. Shared by {@link backfillFieldValue} (a
 * top-level/nested `blocks()`-typed field) and {@link backfillKeyValueEntry}
 * (a `keyValue()` whose `value` is `blocks()`-typed) so the block-type
 * lookup isn't re-derived in both places.
 *
 * @returns A new array with every recognised block's fields backfilled; an
 *   item whose `blockType` matches no block definition is returned unchanged.
 */
function backfillBlocksValue(props: { field: BlocksField; value: unknown[] }): unknown[] {
  const blockDefMap = new Map(props.field.blocks.map((blockDef) => [blockDef.blockType, blockDef]));
  return props.value.map((block) => {
    const blockItem = block as Record<string, unknown>;
    const blockDef = blockDefMap.get(blockItem.blockType as string);
    return blockDef ? assignArrayItemIds({ fields: blockDef.fields, data: blockItem }) : block;
  });
}

/**
 * Backfills ids reachable through one keyValue field's `value` definition —
 * the recursive step `assignArrayItemIds` delegates keyValue-typed fields to,
 * mirroring `backfillArrayValue`'s own per-item-type dispatch but applied to
 * every record ENTRY rather than every array INDEX.
 *
 * @returns `props.value` unchanged for a scalar `valueField`; otherwise a new
 *   value with every reachable object-shaped id backfilled.
 */
function backfillKeyValueEntry(props: { valueField: AdminField; value: unknown }): unknown {
  const { valueField, value } = props;
  if (valueField.type === ADMIN_FIELDS.group.type && value && typeof value === "object") {
    return assignArrayItemIds({ fields: valueField.fields, data: value as Record<string, unknown> });
  }
  if (valueField.type === ADMIN_FIELDS.array.type) {
    return backfillArrayValue({ itemField: valueField.items, value });
  }
  if (valueField.type === ADMIN_FIELDS.blocks.type && Array.isArray(value)) {
    return backfillBlocksValue({ field: valueField, value });
  }
  if (valueField.type === ADMIN_FIELDS.keyValue.type && value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
      result[entryKey] = backfillKeyValueEntry({ valueField: valueField.value, value: entryValue });
    }
    return result;
  }
  return value;
}
