import type { AdminDataField, DataFieldType } from "../../fields";
import type { ColumnEntry } from "../types";

/**
 * Pixel width fallback per field type, consulted only when neither the
 * active view's own column entry (`ColumnEntry.width`) nor the field's own
 * `admin.columnWidth` sets one (Decision 48). Narrow for compact value
 * types (`checkbox`/`select`/`date`/`color`/`number`), wide for long-form
 * text (`text`/`textarea`/`richtext`), mid-range for everything else.
 */
export const FIELD_TYPE_DEFAULT_WIDTH: Record<DataFieldType, number> = {
  checkbox: 60,
  select: 150,
  date: 150,
  commitTs: 150,
  color: 100,
  number: 120,
  email: 200,
  url: 200,
  relationship: 200,
  upload: 160,
  array: 200,
  group: 200,
  blocks: 240,
  json: 240,
  text: 240,
  textarea: 280,
  richtext: 320,
};

/** {@link resolveListViewColumnConfig}'s result — one field's fully-resolved column config. */
export interface ResolvedListViewColumnConfig {
  /** Pixel width — `table-layout: fixed`'s CSS width for this column. */
  width: number;
  /** Whether the list table's column header for this field may sort the table. */
  enableSorting: boolean;
  /** Whether this field's column may be hidden from the list table via the columns menu. */
  enableHiding: boolean;
  /** Sticky pin side, or `undefined` when unpinned. */
  pinned?: "left" | "right";
  /** Whether this column is currently hidden. */
  hidden: boolean;
}

/**
 * Resolves ONE field's final column config — width, sort/hide capability,
 * pin side, and visibility — from a single three-tier precedence chain,
 * VIEWS ALWAYS WIN (developer answer, Decision 48): the active view's own
 * resolved column entry for this field (`resolvedColumnEntry`, already the
 * ONE entry `resolveListViewQueryState`'s own URL → active view → collection
 * default chain produced — this function does not re-resolve across
 * sources itself) `?? field.admin.<attr>` (the field's own declared
 * default) `?? ` a global default (`FIELD_TYPE_DEFAULT_WIDTH[fieldDef.type]`
 * for width, `false` for `enableSorting`/`enableHiding` — unreachable in
 * practice since `field.admin.enableSorting`/`.enableHiding` are already
 * always-resolved booleans, kept for type completeness only — `undefined`/
 * `false` for `pinned`/`hidden`, which have no field-level source at all).
 *
 * The EVERY reader of a column's effective config — the columns menu, the
 * header's sort affordance and resize handle, the server prerender — calls
 * this, never re-derives any of it directly off `field.admin.*`.
 *
 * @param props - Input props.
 * @param props.fieldKey - The field's own slug — unused in the resolution
 *   itself (every input besides `fieldDef.type` is already field-specific),
 *   kept for callers that want to label an error/log entry without a
 *   second lookup.
 * @param props.fieldDef - The field's own resolved definition — supplies
 *   `type` (the `FIELD_TYPE_DEFAULT_WIDTH` lookup) and `admin.columnWidth`/
 *   `.enableSorting`/`.enableHiding` (the middle tier).
 * @param props.resolvedColumnEntry - The ONE `ColumnEntry` already resolved
 *   for this field by the caller's own `cols=`/active-view/default chain —
 *   a bare field-slug entry (Decision 11's back-compat shape) carries no
 *   overrides at all, equivalent to `undefined` here.
 * @returns The resolved column config.
 */
export function resolveListViewColumnConfig<TFieldSlug extends string = string>(props: {
  fieldKey: TFieldSlug;
  fieldDef: AdminDataField;
  resolvedColumnEntry: ColumnEntry<TFieldSlug> | undefined;
}): ResolvedListViewColumnConfig {
  const entry =
    props.resolvedColumnEntry !== undefined && typeof props.resolvedColumnEntry !== "string"
      ? props.resolvedColumnEntry
      : undefined;
  const fieldAdmin = props.fieldDef.admin;
  return {
    width: entry?.width ?? fieldAdmin.columnWidth ?? FIELD_TYPE_DEFAULT_WIDTH[props.fieldDef.type],
    enableSorting: entry?.enableSorting ?? fieldAdmin.enableSorting ?? false,
    enableHiding: entry?.enableHiding ?? fieldAdmin.enableHiding ?? false,
    pinned: entry?.pinned,
    hidden: entry?.hidden ?? false,
  };
}
