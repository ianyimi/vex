"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  getDataFields,
  VERSION_STATUSES,
  type AdminDataField,
  type CollectionConfig,
  type VexWhereNode,
} from "@vexcms/core";
import { Badge, Button, ScrollSection } from "../../../../ui";
import { DataTableResponsiveMenu } from "../../../../ui/data-table/DataTableResponsiveMenu";
import { useIsMobile } from "../../../../hooks/use-mobile";
import { useCanReadField } from "../../../../access";
import {
  applyListFilterOp,
  fromListViewFilterGroups,
  listFilterOpOf,
  toListViewFilterGroups,
  type ListViewFilterOp,
  type ListViewFilterGroup,
  type ListViewFilterLeaf,
} from "../listViewFilterGroups";
import { LIST_VIEW_FILTER_STATUS_FIELD_KEY, listViewFilterOpsForFieldType } from "../listViewFilterOperators";
import { isFilterRowComplete, ListViewFilterRow, type DraftFilterRow } from "./ListViewFilterRow";

/** One OR-ed group of AND-ed {@link DraftFilterRow}s — the builder's own draft shape, mirroring {@link ListViewFilterGroup} but with an explicit per-row editor op. */
interface DraftFilterGroup {
  readonly rows: readonly DraftFilterRow[];
}

/**
 * Converts a {@link ListViewFilterGroup}s (from `toListViewFilterGroups`) into the builder's own {@link DraftFilterGroup}s, reading each leaf's editor-level op via `listFilterOpOf` exactly once, at the seam between "stored" and "draft" — never re-derived again while the row lives in draft state (see {@link DraftFilterRow}'s own doc).
 * @param groups - The stored DNF groups from `toListViewFilterGroups(props.where)`.
 * @returns The equivalent draft groups, one draft row per leaf, each carrying its own editor-level `op`.
 */
function toDraftGroups(groups: readonly ListViewFilterGroup<string>[]): readonly DraftFilterGroup[] {
  return groups.map((group) => ({
    rows: group.rows.map((leaf) => ({ field: leaf.field, op: listFilterOpOf({ leaf }), value: leaf.value })),
  }));
}

/**
 * The stored {@link ListViewFilterLeaf} for a {@link DraftFilterRow} — the inverse of {@link toDraftGroups}'s per-leaf conversion, applied only when a row is complete and about to reach `onWhereChange` (never while the row is still being edited, so an in-progress `isEmpty`→`gte` switch never round-trips through the stored shape mid-edit). Delegates to `applyListFilterOp`, which only reads `leaf.field`/`leaf.value` — the placeholder `op` below is always overwritten.
 * @param row - The draft row to convert, read for its `field`/`op`/`value`.
 * @returns The stored leaf `applyListFilterOp` derives for `row.op`.
 */
function toStoredFilterLeaf(row: DraftFilterRow): ListViewFilterLeaf<string> {
  return applyListFilterOp({
    leaf: { field: row.field, op: "eq", value: row.value } as unknown as ListViewFilterLeaf<string>,
    op: row.op,
  });
}

/**
 * The "nothing entered yet" value for a field type's filter input — `handleFieldChange`'s reset when the field itself changes, and `handleUpdateOp`'s reset when an op switch crosses the value/no-value boundary either direction (a stale value from a different op, or from `isEmpty`/`isNotEmpty`'s `undefined`, must never survive into an op that means something different).
 * @param type - The data field's type (e.g. `"number"`, `"checkbox"`, `"date"`).
 * @returns `0` for `"number"`, `false` for `"checkbox"`, `undefined` for `"date"`, otherwise `""`.
 */
function emptyFilterValueForType(type: string): unknown {
  if (type === "number") return 0;
  if (type === "checkbox") return false;
  if (type === "date") return undefined;
  return "";
}

/**
 * The `VexWhereNode` a set of draft groups currently applies — complete
 * rows only, incomplete rows and empty groups dropped. Shared by
 * `applyDraft` (the real `onWhereChange` call) and the draft-resync
 * effect's own "is this `where` change just an echo of what WE already
 * applied" check, so both always agree on exactly what "complete" means.
 * @param groups - The draft groups currently shown in the builder.
 * @returns The `VexWhereNode` equivalent of `groups` with incomplete rows and empty groups filtered out, or `undefined` if no group has any complete row.
 */
function computeAppliedWhere(groups: readonly DraftFilterGroup[]): VexWhereNode<string> | undefined {
  const appliedGroups = groups
    .map((group) => ({ rows: group.rows.filter((row) => isFilterRowComplete(row)).map(toStoredFilterLeaf) }))
    .filter((group) => group.rows.length > 0);
  return fromListViewFilterGroups({ groups: appliedGroups });
}

/** Props the `list.filters` slot's contributions receive — none of its own (list builtins take no props of their own), matching `list.toolbar`'s `ListViewToolbarSlotProps`. The eye toggle and chip row that used to be threaded through here moved OUT to `ListViewToolbar`'s own direct `ListViewFilterChips`/`ListViewFilterVisibilityToggle` rendering — chips are always inline in the toolbar row now, between the Filter trigger and the eye, never through this slot. */
export type ListViewFiltersSlotProps = Record<string, never>;

/** Props for {@link ListViewFilterBuilder}. */
export interface ListViewFilterBuilderProps {
  /** The collection the list view renders — its data fields populate the field picker. */
  collection: CollectionConfig;
  /**
   * The list's current filter, in plain `VexWhereNode` form — the
   * URL `filter` param, or a saved-view's `state.where`. Always the
   * USER's own filter: a config view's hidden `where` is
   * composed server-side and never reaches this prop.
   */
  where: VexWhereNode<string> | undefined;
  /** Replaces `where` wholesale — the caller (`listView/ListViewFiltersAction.tsx`, backed by `useListViewUrlState`'s `setFilter`) owns persistence. Called only with the APPLIED where — see "live apply" below. `null` means the user's edit reduced the filter to zero conditions (distinct from `undefined` — "Clear all"/removing the last row on a view with its own saved filter must not silently re-inherit it); `applyDraft` only emits `null` when `props.where` was non-empty BEFORE this specific edit, never as a no-op echo of an already-empty filter. */
  onWhereChange: (where: VexWhereNode<string> | undefined | null) => void;
}

/**
 * The groups-of-rows editor rendered by the `vex.list.filters` built-in
 * (`listView/ListViewFiltersAction.tsx`) for a DNF `where`: AND
 * rows within a group, OR between groups, applied live as each row becomes
 * complete. Renders read-only when `props.where` is not in that normal
 * form (`toListViewFilterGroups` returns `null`), e.g. a config-authored `admin.views`
 * entry's hidden filter leaking into view state as a hand-written tree.
 *
 * Wraps its own trigger — a "Filter" `Button` with an active-condition
 * count badge (the eye/crossed-eye chip-visibility toggle that used to be
 * a grouped sibling here moved OUT, to `ListViewToolbar`'s own
 * `ListViewFilterVisibilityToggle`, rendered AFTER the chip row itself — this
 * component has no awareness of chip visibility at all any more) — and
 * overlay, via `DataTableResponsiveMenu`: a `Popover` on wider
 * containers, a bottom `Sheet` below `768px` (`useIsMobile` decides
 * overlay CONTENT only: the choice is made once, while the
 * overlay is already closed, so it never shifts first paint — this
 * matches `DataTableColumnsMenu`'s and
 * `ListViewToolbar`'s own ⋯ overflow's identical mechanism). `ListViewFiltersAction`
 * stays a thin prop-forwarding wrapper with nothing of its own to render.
 *
 * Maintains its own `draftGroups` state, seeded from `toListViewFilterGroups(props.where)`
 * and resynced whenever `props.where` changes from OUTSIDE this component
 * (view switch, Reset, URL navigation) — never on every keystroke, or
 * typing a value would fight the external resync.
 *
 * @param props - {@link ListViewFilterBuilderProps}.
 * @returns The filter builder trigger and overlay.
 */
export function ListViewFilterBuilder(props: ListViewFilterBuilderProps): ReactNode {
  const dnf = useMemo(() => toListViewFilterGroups({ where: props.where }), [props.where]);
  const [draftGroups, setDraftGroups] = useState<readonly DraftFilterGroup[]>(() =>
    toDraftGroups(dnf?.groups ?? []),
  );
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const canReadField = useCanReadField({ resource: props.collection.slug });
  const dataFields = useMemo(() => {
    const base = getDataFields({ fields: props.collection.fields });
    const readable = Object.fromEntries(Object.entries(base).filter(([key]) => canReadField(key)));
    // `vex_status` is a SYSTEM field
    // — hidden unless the field-permission map grants it, same "hidden
    // unless listed" default every data field already gets, never
    // unconditionally offered just because the collection has drafts.
    if (!props.collection.versions.drafts || !canReadField(LIST_VIEW_FILTER_STATUS_FIELD_KEY)) {
      return readable;
    }
    const statusField: AdminDataField = {
      type: "select",
      label: "Status",
      options: Object.values(VERSION_STATUSES).map((status) => ({
        label: status.labels.singular,
        value: status.key,
      })),
    } as AdminDataField;
    return { ...readable, [LIST_VIEW_FILTER_STATUS_FIELD_KEY]: statusField };
  }, [props.collection, canReadField]);

  /**
   * Resyncs `draftGroups` from `props.where` — **bug fix, developer-
   * reported:** the prior version skipped only on REFERENCE equality
   * against the `where` this component itself last sent. `onWhereChange`
   * round-trips through `urlState.setFilter`'s URL update; the `where`
   * that comes back can be a NEW object even when nothing actually
   * changed, which this effect then (mis)read as an EXTERNAL change and
   * fully overwrote `draftGroups` with — silently dropping any OTHER
   * still-incomplete row or OR group the user hadn't finished yet (e.g.
   * completing one group's row while a second, newly-added group was
   * still empty).
   *
   * Two-part fix:
   * 1. Skip entirely when `props.where` is SEMANTICALLY (not referentially)
   *    identical to what the CURRENT `draftGroups` would itself apply
   *    ({@link computeAppliedWhere}) — covers every round-trip echo of our
   *    own apply, however many object identities it churns through.
   * 2. Otherwise — a GENUINE external change (chip removal, Clear all, a
   *    config/saved view taking over, URL navigation) — MERGE rather than
   *    replace: every group that's fully complete is refreshed straight
   *    from the new `where` (it's either untouched or IS the thing that
   *    changed); any group that still has an incomplete row is preserved
   *    exactly as the user left it, since an incomplete row can never be
   *    part of `computeAppliedWhere`'s output either way — it cannot be
   *    what changed.
   */
  useEffect(() => {
    if (dnf === null) return;
    const appliedNow = computeAppliedWhere(draftGroups);
    // `VexWhereNode` is always a plain, serializable tree (no functions,
    // no `Date`s) — `JSON.stringify` is a sufficient semantic comparison
    // here, and already treats `isEmpty`/`isNotEmpty`'s `value: undefined`
    // leaf the same with or without the key present, matching how
    // Convex's own wire encoding already drops it.
    if (JSON.stringify(appliedNow) === JSON.stringify(props.where)) return;
    const incompleteGroups = draftGroups.filter((group) =>
      group.rows.some((row) => !isFilterRowComplete(row)),
    );
    setDraftGroups([...toDraftGroups(dnf.groups), ...incompleteGroups]);
  }, [props.where, dnf]);

  function applyDraft(nextGroups: readonly DraftFilterGroup[]): void {
    setDraftGroups(nextGroups);
    const applied = computeAppliedWhere(nextGroups);
    // `undefined` here means EITHER "still empty, nothing to clear" (a
    // true no-op — e.g. seeding a fresh, empty draft on open) OR "the
    // user just removed the last condition" (a genuine explicit clear) —
    // distinguished by whether `props.where` (the filter BEFORE this
    // edit) was itself non-empty.
    props.onWhereChange(applied ?? (props.where !== undefined ? null : undefined));
  }

  const hasReadableFields = Object.keys(dataFields).length > 0;

  /**
   * Builds a fresh, incomplete row for the first readable field — shared by `handleAddGroup`/`handleAddRow` (explicit "Add…" clicks) and `handleOpenChange` (opening the filter builder already shows one empty row, no click needed).
   * @returns A new row seeded with the first readable field and its first offered operator, or `undefined` when the collection has no readable data field to seed.
   */
  function buildNewRow(): DraftFilterRow | undefined {
    const firstFieldKey = Object.keys(dataFields)[0];
    if (firstFieldKey === undefined) return undefined;
    const firstOp = listViewFilterOpsForFieldType({ type: dataFields[firstFieldKey]!.type, field: firstFieldKey })[0];
    return { field: firstFieldKey, op: firstOp ?? "eq", value: "" };
  }

  function handleAddGroup(): void {
    const newRow = buildNewRow();
    if (newRow === undefined) return;
    applyDraft([...draftGroups, { rows: [newRow] }]);
  }

  function handleAddRow(groupIndex: number): void {
    const newRow = buildNewRow();
    if (newRow === undefined) return;
    applyDraft(
      draftGroups.map((group, i) => (i === groupIndex ? { rows: [...group.rows, newRow] } : group)),
    );
  }

  /**
   * Opens/closes the overlay. On OPEN, with no existing filter (`dnf` is a
   * real DNF tree, never `null`'s read-only branch, and `draftGroups` is
   * still empty), seeds one incomplete row immediately — opening the
   * filter builder with no filters shows one empty row ready
   * to edit, no "Add filter" click needed. Seeded and `setOpen` together
   * in the same handler so React batches them: the overlay never paints
   * the old empty-state "Add filter" button first. The seeded row stays
   * incomplete (`value: ""`) until filled, so `applyDraft` excludes it from
   * `onWhereChange` — opening the builder alone never changes the query or
   * URL. "Add filter"/"OR conditions" remain for every row/group beyond
   * this first one.
   * @param next - The overlay's next open state, from the `Popover`'s own `onOpenChange`.
   */
  function handleOpenChange(next: boolean): void {
    if (next && dnf !== null && draftGroups.length === 0) {
      const newRow = buildNewRow();
      if (newRow !== undefined) applyDraft([{ rows: [newRow] }]);
    }
    setOpen(next);
  }

  function handleRemoveRow(groupIndex: number, rowIndex: number): void {
    const nextGroups = draftGroups
      .map((group, i) =>
        i === groupIndex ? { rows: group.rows.filter((_row, j) => j !== rowIndex) } : group,
      )
      .filter((group) => group.rows.length > 0);
    applyDraft(nextGroups);
  }

  function handleUpdateRow(groupIndex: number, rowIndex: number, patch: Partial<DraftFilterRow>): void {
    applyDraft(
      draftGroups.map((group, i) => {
        if (i !== groupIndex) return group;
        return {
          rows: group.rows.map((row, j) => (j === rowIndex ? { ...row, ...patch } : row)),
        };
      }),
    );
  }

  function handleFieldChange(groupIndex: number, rowIndex: number, nextKey: string): void {
    const nextType = dataFields[nextKey]?.type ?? "text";
    // A stale value/op typed for the PREVIOUS field must never be sent
    // under the new field — reset both whenever the field changes, the op
    // to the new field's OWN first offered operator (never a hardcoded
    // "eq" — a date field doesn't even offer one, see
    // `listViewFilterOpsForFieldType`).
    const nextOp = listViewFilterOpsForFieldType({ type: nextType, field: nextKey })[0] ?? "eq";
    handleUpdateRow(groupIndex, rowIndex, {
      field: nextKey,
      op: nextOp,
      value: emptyFilterValueForType(nextType),
    });
  }

  /**
   * Applies an operator `Select` change —
   * sets `row.op` directly rather than round-tripping through the STORED
   * `{op, value}` shape (see {@link DraftFilterRow}'s own doc for exactly
   * how that round trip silently discarded or relabelled the user's pick).
   * The row's VALUE survives the switch only when both the old and new op
   * are in the same "needs a value" class — crossing that boundary either
   * direction (into or out of `isEmpty`/`isNotEmpty`) resets it via
   * {@link emptyFilterValueForType}, so a stale value never reaches an op
   * it was never entered for.
   * @param groupIndex - Index of the OR-group containing the row.
   * @param rowIndex - Index of the row within that group.
   * @param nextOp - The operator just picked in the row's operator `Select`.
   */
  function handleUpdateOp(groupIndex: number, rowIndex: number, nextOp: ListViewFilterOp): void {
    applyDraft(
      draftGroups.map((group, i) => {
        if (i !== groupIndex) return group;
        return {
          rows: group.rows.map((row, j) => {
            if (j !== rowIndex) return row;
            const wasValueless = row.op === "isEmpty" || row.op === "isNotEmpty";
            const willBeValueless = nextOp === "isEmpty" || nextOp === "isNotEmpty";
            const value =
              wasValueless === willBeValueless
                ? row.value
                : emptyFilterValueForType(dataFields[row.field]?.type ?? "text");
            return { ...row, op: nextOp, value };
          }),
        };
      }),
    );
  }

  const activeCount = draftGroups.reduce(
    (count, group) => count + group.rows.filter((row) => isFilterRowComplete(row)).length,
    0,
  );

  // Just the "Filter" button — the eye/crossed-eye chip-visibility toggle
  // moved OUT of this component entirely (further developer revision,
  // same day as the fixed-grid row layout): chips now always render
  // INLINE in `ListViewToolbar`'s own row, between this trigger and the eye
  // (`[Filter] [chips…] [eye]`), which a filter builder rendering its own
  // eye button could never produce — only the toolbar, which already
  // renders the chips directly, can place the eye AFTER them. See
  // `ListViewFilterChips.tsx`'s `ListViewFilterVisibilityToggle` for the toggle
  // itself.
  const filterTriggerButton = (
    <Button variant="outline" size="default" icon="ListFilter">
      Filter
      {activeCount > 0 && (
        <Badge variant="secondary" className="ml-1">
          {activeCount}
        </Badge>
      )}
    </Button>
  );

  let body: ReactNode;
  if (dnf === null) {
    body = (
      <div className="flex flex-col gap-2 rounded-sm border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <p>This filter comes from a config view and can&apos;t be edited here.</p>
        <pre className="overflow-x-auto rounded-sm bg-background p-2 text-xs">
          {JSON.stringify(props.where, null, 2)}
        </pre>
      </div>
    );
  } else if (draftGroups.length === 0) {
    body = (
      <Button variant="outline" size="sm" icon="Plus" onClick={handleAddGroup} disabled={!hasReadableFields}>
        Add filter
      </Button>
    );
  } else {
    body = (
      <div className="flex flex-col gap-3">
        {draftGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && (
              <div className="my-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                OR
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
            <div className="flex flex-col gap-2 rounded-sm border border-border p-2">
              {group.rows.map((row, rowIndex) => (
                <ListViewFilterRow
                  key={rowIndex}
                  dataFields={dataFields}
                  row={row}
                  isMobile={isMobile}
                  onFieldChange={(key) => handleFieldChange(groupIndex, rowIndex, key)}
                  onOpChange={(op) => handleUpdateOp(groupIndex, rowIndex, op)}
                  onValueChange={(value) => handleUpdateRow(groupIndex, rowIndex, { value })}
                  onRemove={() => handleRemoveRow(groupIndex, rowIndex)}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                icon="Plus"
                onClick={() => handleAddRow(groupIndex)}
                disabled={!hasReadableFields}
              >
                AND condition
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" icon="Plus" onClick={handleAddGroup} disabled={!hasReadableFields}>
          OR conditions
        </Button>
      </div>
    );
  }

  return (
    <DataTableResponsiveMenu
      trigger={filterTriggerButton}
      title="Filter"
      align="start"
      open={open}
      onOpenChange={handleOpenChange}
      className="w-[520px]"
    >
      <ScrollSection maxHeight={400}>{body}</ScrollSection>
    </DataTableResponsiveMenu>
  );
}
