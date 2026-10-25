import { nanoid } from "nanoid";
import { ADMIN_FIELDS } from "../constants";
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
 * backfill below, and `FormArray`'s client-side id assignment (Step 15) —
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
 * `handleDuplicate` (Step 15), so both sides generate ids identically —
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
 * `array`), and into each `blocks()` item's own matching block-type fields
 * — so an array of groups nested inside a block or another group gets ids
 * too, not just a top-level array field. Pure: returns a new object, never
 * mutates `data`.
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
    const value = result[key];
    if (field.type === ADMIN_FIELDS.array.type) {
      result[key] = backfillArrayValue({ itemField: field.items, value });
    } else if (field.type === ADMIN_FIELDS.group.type && value && typeof value === "object") {
      result[key] = assignArrayItemIds({
        fields: field.fields,
        data: value as Record<string, unknown>,
      });
    } else if (field.type === ADMIN_FIELDS.blocks.type && Array.isArray(value)) {
      result[key] = value.map((block) => {
        const blockItem = block as Record<string, unknown>;
        const blockDef = field.blocks.find((b) => b.blockType === blockItem.blockType);
        return blockDef
          ? assignArrayItemIds({ fields: blockDef.fields, data: blockItem })
          : block;
      });
    }
  }
  return result;
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
