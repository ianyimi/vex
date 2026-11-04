import { type ColumnDef } from "@tanstack/react-table";
import {
  columnEntryField,
  VERSION_STATUSES,
  VERSION_SYSTEM_FIELDS,
  type ColumnEntry,
  type TDocument,
} from "@vexcms/core";
import { Badge } from "../../../ui";
import { StatusBadge } from "../../../versions";

/**
 * The `vex_status` column's own default pixel width (the
 * per-field default tier, `size: width ?? <default>` in `buildStatusColumn`
 * below) — NOT `FIELD_TYPE_DEFAULT_WIDTH.select` (150px), which is what
 * this column used before this fix and is what caused the bug this
 * constant exists to fix (screenshot-confirmed): at
 * 150px, a row with BOTH badges ("Published" + "Unpublished changes")
 * clipped the second badge mid-word ("Unpublis") at the column's own
 * right edge — not a clean ellipsis, a raw pixel-level clip, since
 * `Badge`'s own `shrink-0` class (the shared `ui/badge.tsx` default,
 * correct for every OTHER caller) kept it at its full intrinsic width,
 * which the table's `overflow: hidden` cell boundary then just cut off
 * wherever it happened to land. Measured live (real browser, not
 * computed from font metrics): "Published" badge ≈73px + "Unpublished
 * changes" badge ≈139px + the wrapping `gap-1.5` (6px) + the cell's own
 * `px-2` padding (8px either side, 16px total) ≈234px — this constant
 * rounds that up to 260px for a comfortable margin (font-rendering/zoom
 * variance across environments), so the DEFAULT (unresized) column needs
 * no truncation at all for the common case. The user can still resize
 * this column narrower than that (fully resizable, see
 * `completeListViewColumnOrder`'s own doc comment on this column's full
 * participation) — `truncate`'s own clean ellipsis on the SECOND badge
 * (see `buildStatusColumn`'s own cell renderer) is the structural safety
 * net for that case, not this default.
 */
const STATUS_COLUMN_DEFAULT_WIDTH = 260;

/**
 * Builds the synthetic "Status" column shown on a versioned collection's
 * list view. Reads two signals off each merged row (`find`/`search`
 * already attach a linked draft's fields onto its published row per page
 * server-side, `collections/mergeDraftCounterparts.ts` — see the
 * `CollectionListView` doc comment) rather than a bespoke third
 * flag: the row's own `vex_status` — `"draft"` whenever a draft exists,
 * whether paired with a published row or standing alone — and
 * `hasUnpublishedChanges`, `true` only for a genuine published+draft pair.
 *
 * Three resulting states: a standalone published row (`vex_status !==
 * "draft"`, `hasUnpublishedChanges` false) renders `StatusBadge
 * status="published"` alone; a published row with a linked draft
 * (`vex_status === "draft"` on the MERGED representative row, but
 * `hasUnpublishedChanges` true) renders `StatusBadge status="published"`
 * PLUS an "Unpublished changes" badge — the document IS live, there's
 * just a pending edit; a standalone draft, never published
 * (`vex_status === "draft"` AND `hasUnpublishedChanges` false — no
 * linked published row), renders `StatusBadge status="draft"` alone.
 * `isDraftOnly` (not `vex_status` alone) is what decides the badge: the
 * merged row's OWN `vex_status` reads `"draft"` for BOTH a draft-only
 * row and a published+draft PAIR (the pairing is what `hasUnpublishedChanges`
 * alone distinguishes), so checking `vex_status` without also checking
 * `hasUnpublishedChanges` incorrectly showed a "Draft" badge for a pair
 * too (a real bug, found live — a pair should read "Published").
 *
 * Full `ColumnEntry` participant (a prior
 * bug: resizing/pinning/hiding/reordering it used to silently
 * no-op, since `id`/no `accessorKey` kept it OUTSIDE this entry-driven
 * model entirely — a resize commit had no entry to write to) — `id`/
 * `accessorKey` are `VERSION_SYSTEM_FIELDS.status.slug` (`"vex_status"`,
 * the SAME key `ListViewFilterBuilder`'s own synthetic status field and
 * every server-side `vex_status` reference already use), `enableHiding:
 * true` (no field-level `admin.enableHiding` source exists for a
 * synthetic column, so this is simply always on — "full participation
 * unless genuinely impossible," and hiding a status badge is never
 * impossible), `size` resolved from `columnEntries`' own entry for
 * `vex_status` (set by `completeListViewColumnOrder`, which now treats
 * `vex_status` as a known field on a versioned collection — see its own
 * doc comment), falling back to {@link STATUS_COLUMN_DEFAULT_WIDTH} (its
 * own doc comment explains the derivation — NOT the generic
 * `FIELD_TYPE_DEFAULT_WIDTH.select` default every other `select`-typed
 * field uses, too narrow for this column's two-badge content).
 * `enableSorting` stays hardcoded `false`, unchanged — no sort affordance
 * was reported broken, and wiring one up would need a server-side
 * sort-field mapping, out of scope here. Reordering/pinning need no
 * special handling in this function at all — both already read purely
 * off `columnEntries`'/`DataTable`'s own generic field-id matching
 * (`resolvedColumnOrder`/`columnPinning` in `DataTable.tsx`), which only
 * needed this column's `id` to actually MATCH its `ColumnEntry.field` to
 * start working.
 *
 * @param columnEntries - The collection's current `ColumnEntry` list (from
 *   `completeListViewColumnOrder`), read for the `vex_status` entry's resized
 *   `size`. `undefined` falls straight through to {@link STATUS_COLUMN_DEFAULT_WIDTH}.
 * @returns The synthetic `vex_status` `ColumnDef`, ready to splice into the
 *   table's column list alongside the field-derived columns.
 */
export function buildStatusColumn<TData extends TDocument & { hasUnpublishedChanges: boolean }>(
  columnEntries: ColumnEntry<string>[] | undefined,
): ColumnDef<TData, boolean> {
  const statusField = VERSION_SYSTEM_FIELDS.status.slug;
  const entry = columnEntries?.find((e) => columnEntryField(e) === statusField);
  const width = entry !== undefined && typeof entry !== "string" ? entry.width : undefined;
  return {
    id: statusField,
    accessorKey: statusField,
    header: "Status",
    enableSorting: false,
    enableHiding: true,
    size: width ?? STATUS_COLUMN_DEFAULT_WIDTH,
    // `meta.label` (not just `header`) — `columnMenuEntries`'s own label
    // resolution (`CollectionListView/index.tsx`'s `columnMenuEntries` useMemo)
    // reads `(c.meta as {label?:string})?.label ?? c.id`, the SAME
    // pattern every real field's `*FieldToColumnDef` factory sets (see
    // `text/columnDef.tsx`'s own `meta: {label: ...}`) — without it the
    // columns menu showed the raw `"vex_status"` id instead of "Status"
    // (found live, via this exact fix's own browser verification).
    meta: { label: "Status" },
    cell: ({ row }) => {
      const doc = row.original;
      const isDraftOnly =
        doc.vex_status === VERSION_STATUSES.draft.key && !doc.hasUnpublishedChanges;
      return (
        <div className="flex min-w-0 items-center gap-1.5">
          <StatusBadge
            status={isDraftOnly ? VERSION_STATUSES.draft.key : VERSION_STATUSES.published.key}
          />
          {doc.hasUnpublishedChanges ? (
            // `min-w-0 shrink` overrides `Badge`'s own shared `shrink-0`
            // (correct for every OTHER caller, wrong here specifically —
            // see `STATUS_COLUMN_DEFAULT_WIDTH`'s own doc comment for the
            // bug this fixes) so THIS badge alone can shrink below its
            // intrinsic content width once the column is narrower than
            // the default — the "Published"/"Draft" badge above keeps
            // the shared default (never shrinks, always fully legible —
            // it's the PRIMARY status, this is only the secondary one).
            // The inner `<span className="truncate">` is what actually
            // ellipses the TEXT once the badge's own pill has shrunk —
            // `text-overflow: ellipsis` needs a block-level/flex-item
            // target, not a raw text node. `title` carries the full
            // phrase as a native tooltip on hover/focus — no extra JS or
            // floating-UI dependency needed for a secondary, non-critical
            // label like this one.
            <Badge variant="outline" className="min-w-0 shrink text-xs" title="Unpublished changes">
              <span className="truncate">Unpublished changes</span>
            </Badge>
          ) : null}
        </div>
      );
    },
  };
}
