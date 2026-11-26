import { removeVexFields } from "../versions/removeVexFields";
import { CONVEX_SYSTEM_FIELDS } from "../collections/constants";
import { ADMIN_FIELDS, cloneBlockWithFreshIds, getDataFields, walkVariantValue } from "../fields";
import type { AdminField, GenericBlock } from "../fields";

const CONVEX_SYSTEM_FIELD_SLUGS: readonly string[] = Object.values(CONVEX_SYSTEM_FIELDS).map((f) => f.slug);

/**
 * Appends or increments a duplicate suffix on a title: `"Name"` → `"Name (2)"`,
 * `"Name (x)"` → `"Name (x+1)"`. `BigInt`, not `Number`, for the increment — a title duplicated
 * past `Number.MAX_SAFE_INTEGER` times would otherwise silently round. Exported standalone for
 * direct testing — {@link cloneDocumentForDuplicate} is its only production caller.
 *
 * @param title - The source document's current title value.
 * @returns The next duplicate title.
 */
export function nextDuplicateTitle(title: string): string {
  const match = /^(.*) \((\d+)\)$/.exec(title);
  return match ? `${match[1]} (${BigInt(match[2]) + BigInt(1)})` : `${title} (2)`;
}

/**
 * The source document's current title, when `useAsTitle` names a renameable title field — not
 * a Convex system field (`_id`/`_creationTime`/`_updatedAt`) and holding a non-empty string.
 * `undefined` otherwise. {@link cloneDocumentForDuplicate} uses this to decide whether (and
 * what) to rename; a caller displaying the pre-rename title (the duplicate dialog's "copied
 * from" note) reads it here instead of re-deriving the same rule.
 *
 * @param props - Input props.
 * @param props.useAsTitle - The collection's `admin.useAsTitle`.
 * @param props.document - The source document.
 * @returns The current title string, or `undefined` when there is none to rename.
 */
export function resolveDuplicateTitle(props: {
  useAsTitle: string | undefined;
  document: Record<string, unknown>;
}): string | undefined {
  const { useAsTitle, document } = props;
  if (useAsTitle === undefined || CONVEX_SYSTEM_FIELD_SLUGS.includes(useAsTitle)) return undefined;
  const value = document[useAsTitle];
  return typeof value === "string" && value !== "" ? value : undefined;
}

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
  if (field.type === ADMIN_FIELDS.keyValue.type) {
    const recordValue = (value ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(recordValue)) {
      result[entryKey] = regenerateNestedIds({ value: entryValue, field: field.value });
    }
    return result;
  }
  if (field.type === ADMIN_FIELDS.variant.type) {
    return walkVariantValue({ value, field, recurse: regenerateNestedIds });
  }
  return value;
}

/**
 * Builds the payload for a duplicated document: the source document's saved
 * values, with every framework field stripped, every array/block item's
 * `id` regenerated so the clone shares no item identity with the original,
 * and (when `props.useAsTitle` names a renameable title field — see
 * {@link resolveDuplicateTitle}) its title renamed via {@link nextDuplicateTitle}.
 *
 * Only framework fields are stripped — `_id`,
 * `_creationTime`, `updatedAt`, and (versioned collections only) `vex_status`,
 * `vex_publishedAt`, `vex_publishedId`, `vex_activeVersion`. Every other
 * value, including unique fields like a `slug`, copies as-is; a unique-value
 * conflict is left for the create form's own validation to surface.
 *
 * @param props - Input props.
 * @param props.fields - The source collection's resolved `fields` map
 *   (`collection.fields`, not yet flattened).
 * @param props.document - The saved document being duplicated, as returned
 *   from `vexConvexApi.get`/`find` (a `VexDocument`/`VexVersionDocument`).
 * @param props.useAsTitle - The source collection's `admin.useAsTitle`. Omit
 *   to skip the title rename entirely.
 * @returns A plain object: `props.document` minus every framework field,
 *   with a fresh `id` on every array/block item at any nesting depth and its
 *   title renamed when applicable. Ready to pass as `data` to `create()`.
 * @throws {Error} Propagated from `getDataFields` if `props.fields` is
 *   malformed (duplicate field key across tabs) — `props.fields` is assumed
 *   to be an already-validated `collection.fields`.
 */
export function cloneDocumentForDuplicate(props: {
  fields: Record<string, AdminField>;
  document: Record<string, unknown>;
  useAsTitle?: string;
}): Record<string, unknown> {
  const dataFields = getDataFields({ fields: props.fields });
  const stripped = removeVexFields({ doc: props.document, fields: props.fields });

  const cloned: Record<string, unknown> = { ...stripped };
  for (const [key, field] of Object.entries(dataFields)) {
    if (key in cloned) {
      cloned[key] = regenerateNestedIds({ value: cloned[key], field });
    }
  }
  const sourceTitle = resolveDuplicateTitle({ useAsTitle: props.useAsTitle, document: props.document });
  if (sourceTitle !== undefined) {
    cloned[props.useAsTitle as string] = nextDuplicateTitle(sourceTitle);
  }
  return cloned;
}
