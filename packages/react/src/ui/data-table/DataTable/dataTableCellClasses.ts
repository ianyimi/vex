import type { Alignment, ListDensity } from "@vexcms/core";
import type { CSSProperties } from "react";

/**
 * Row height per {@link ListDensity} (DESIGN-NOTES.md §1: Comfortable 48px, Compact
 * 36px). `DataTable`'s index/header/body/footer all apply this to every `TableRow`/
 * `TableCell`. Moved out of `@vexcms/core` (temporarily, Phase 1 of the structure
 * refactor — permanently as of Phase 3's `ui/data-table/DataTable/dataTableCellClasses.ts`)
 * because this constant is `@vexcms/react`-only: it has no server-side reader, unlike
 * the rest of `listViewConfigCookies.ts`'s cookie codecs, which `NextAdminPage` also
 * calls.
 */
export const DENSITY_ROW_CLASS: Record<ListDensity, string> = {
  comfortable: "h-12",
  compact: "h-9",
};

/**
 * `ColumnDef.meta`'s actual shape in this package — every `*FieldToColumnDef`
 * factory (`components/fields/<type>/columnDef.tsx`) sets `label`/`align`/
 * `isTitleField`, read back through this local type since the library's own
 * `ColumnMeta` is an empty interface this package never augments. Width no
 * longer lives on `meta` — `getCollectionColumnDefs` now
 * resolves a field's width straight into `ColumnDef.size`, and every render
 * loop in `DataTableHeader`/`DataTableBody` reads it via `liveWidth()`
 * (`useDataTableColumnResize`'s own custom resize state, not TanStack's
 * built-in `columnSizing` — see that hook's own doc comment for why), so
 * resizing and the static per-field default stay the SAME source of truth.
 */
export interface DataTableColumnMeta {
  align?: Alignment;
  label?: string;
}

/** Tailwind text-alignment class per {@link Alignment}, applied to both the header and data cells of a column. */
export const ALIGNMENT_CLASS: Record<Alignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * Resolves one DATA column's fixed pixel width as inline `width`/`minWidth`/
 * `maxWidth` (not a Tailwind class — the value is dynamic, from
 * `useDataTableColumnResize`'s own `liveWidth()`) — `undefined` for the pinned
 * `select`/`actions` columns,
 * which size via their own `SELECTION_CELL_SHARED_CLASS`/`ACTIONS_CELL_SHARED_CLASS`
 * `w-12` instead. Every OTHER real column (never the spacer cell, which renders
 * no width style at all — see its own doc comment below) gets its exact declared
 * width unconditionally, regardless of container width or column count —
 * `table-layout: fixed` under the table's own (unmodified) `width: 100%`
 * (`ui/table.tsx`'s shared default — `DataTable` does NOT override it; an
 * EARLIER `width: auto` override round was superseded: it
 * fixed the 0px-collapse case but broke a DIFFERENT one, a pinned-right group not
 * reaching the frame's own right edge when there was slack) resolves the table's
 * own used width as the GREATER of 100% and the sum of every column's own
 * declared width (confirmed empirically, a real browser, not jsdom): when every
 * real column's declared sum already exceeds the container, the table simply
 * grows past 100% (scrolls horizontally) and every DECLARED column keeps its
 * exact width — only the ONE undeclared spacer column gets squeezed toward 0,
 * never a real column. Called identically from the header, skeleton, and settled
 * body render loops (`DataTableHeader`/`DataTableBody`) so a column's header/
 * skeleton-cell/data-cell rects are always pixel-identical — the Δ0 requirement
 * this whole decision exists for.
 */
export function resolveColumnWidthStyle(
  width: number,
  isSelectColumn: boolean,
  isActionsColumn: boolean,
): CSSProperties | undefined {
  if (isSelectColumn || isActionsColumn) return undefined;
  return { width, minWidth: width, maxWidth: width };
}

/**
 * The sticky offset for a PINNED column — select/actions keep their own
 * hardcoded `left-0`/`right-0` Tailwind classes (unchanged, see
 * `SELECTION_CELL_SHARED_CLASS`/`ACTIONS_CELL_SHARED_CLASS` below — both
 * values happen to always resolve to `0` anyway, since they're always the
 * outermost entry in their own pinning group), but an arbitrary user-pinned
 * DATA column needs a DYNAMIC offset: `column.getStart("left")`
 * (the cumulative width of every pinned-left column before this one,
 * including the `select` column — it's always `columnPinning.left[0]`, so its
 * own 48px is automatically included) or `column.getAfter("right")` (the
 * mirror, including `actions`' own 48px). Returns `undefined` when the column
 * isn't pinned at all.
 */
export function resolvePinnedOffsetStyle(
  pinnedSide: false | "left" | "right",
  getStart: () => number,
  getAfter: () => number,
): CSSProperties | undefined {
  if (pinnedSide === "left") return { left: getStart() };
  if (pinnedSide === "right") return { right: getAfter() };
  return undefined;
}

/**
 * The header row's OWN opaque background — a flat `color-mix()` blend of
 * `--muted` (50%) and `--background` (50%), NOT the translucent
 * `bg-muted/50` `TableHeader` itself uses ("every
 * header cell, sticky ones included, must be opaque with that same
 * color, so scrolled content never shows through" — a translucent
 * background on a STICKY header cell lets horizontally-scrolled content
 * pass underneath it, visible through the alpha blend; a flat, pre-mixed
 * solid color has nothing to blend WITH, so nothing ever shows through
 * regardless of what's scrolled underneath). Applied to every STICKY
 * header cell (`SELECTION_CELL_HEADER_CLASS`/`ACTIONS_CELL_HEADER_CLASS`/
 * `PINNED_DATA_CELL_HEADER_CLASS` below) — an ORDINARY (non-sticky)
 * header cell doesn't need its own copy: nothing is ever positioned
 * BEHIND a non-sticky cell during scroll, so `TableHeader`'s own
 * translucent `bg-muted/50` (applied once, at the `<thead>` level) reads
 * identically there either way. The SAME flat blend `group-hover/row:`
 * already computes for a BODY row's own hover state (see
 * `SELECTION_CELL_BODY_CLASS`'s own doc comment) — reused here as a
 * STATIC (always-on, never hover-gated) header equivalent, so a header
 * cell and a hovered body cell happen to read the exact same color,
 * never a jarring two-tone table.
 */
export const HEADER_OPAQUE_BG_CLASS = "bg-[color-mix(in_oklab,var(--muted)_50%,var(--background)_50%)]";

/**
 * The selection (checkbox) column's own classes, shared by header + body cells — fixed
 * width, zero padding (the checkbox centers itself via a wrapping flex `<div>` in
 * `DataTable`'s `checkboxColumn`, not cell padding), `position: sticky` pinned to the
 * left edge while the table scrolls horizontally, and an always-visible `border-r`
 * divider.
 *
 * **Sticky done right, this time — every prior artifact traced to a SPECIFIC, fixable gap,
 * not to `position: sticky` itself being broken:**
 * - *Row-divider misalignment / detached border* (fix #1/#2): caused by `border-collapse:
 *   collapse` (Tailwind preflight's table default) combined with `position: sticky` on a
 *   cell — collapsed-border painting is computed once across the whole table and doesn't
 *   track a sticky cell's own position. Fixed by the `<Table>` element's own
 *   `border-separate border-spacing-0` below, which takes the whole table OUT of that
 *   model; every header/body cell gets an explicit `"border-b"` since `border-separate`
 *   makes a `<tr>`-level border (`TableRow`'s own `border-b`) not render at all.
 * - *Clipped checkbox / content bleeding through* (fix #4's own abandoned-sticky round):
 *   caused by shipping `position: sticky` with NO explicit width at all, letting the
 *   sticky layout box and the table's own auto-layout column width diverge during scroll.
 *   Fixed by the explicit `w-12 min-w-12 max-w-12` below — the header and body cells are
 *   now byte-identical in width regardless of content, so sticky positioning has nothing
 *   ambiguous to diverge over.
 * - *Asymmetric left/right checkbox padding*: caused by a stale `pr-0` rule
 *   (`ui/table.tsx`'s own `[&:has([role=checkbox])]:pr-0`) zeroing only the RIGHT padding,
 *   left over from when this column had no explicit width — once the column is a fixed
 *   width wider than its content, uneven padding reads as an off-center checkbox. Fixed by
 *   `px-0` here (zeroing BOTH sides) plus a wrapping `flex items-center justify-center` div
 *   around the checkbox itself (in `checkboxColumn`'s `header`/`cell`), which centers
 *   it within the cell's full width regardless of padding.
 * - *Translucent row backgrounds not covering a sticky cell*: `TableRow`'s own
 *   `hover:bg-muted/50` is intentionally translucent so it blends softly with whatever's
 *   under the WHOLE row — but a sticky cell has horizontally-scrolled content passing
 *   underneath it specifically, so a translucent background lets that content show
 *   through. `SELECTION_CELL_BODY_CLASS` below reads the row's hover/selected state via
 *   `group-hover/row:`/`group-data-[state=selected]/row:` (`TableRow` exposes a
 *   `group/row` name) and applies an OPAQUE equivalent on the cell itself: a solid
 *   `color-mix()` of `--muted` and `--background` for hover (computing the same blend
 *   `bg-muted/50` produces, as a flat opaque color instead of a translucent one), and the
 *   already-opaque `bg-muted` directly for `data-[state=selected]` (no mixing needed).
 *   The HEADER variant below is the SAME idea applied to a non-hover-reactive context —
 *   see {@link HEADER_OPAQUE_BG_CLASS}'s own doc comment.
 *
 * `z-20` (not `z-10`) on the HEADER'S OWN selection cell specifically: it is sticky in
 * BOTH directions at once (pinned left via this class, pinned top via `TableHeader`'s own
 * `sticky top-0 z-10`) — the one cell where both dimensions overlap needs to out-rank
 * every plain single-axis sticky element (`z-10`: the rest of the header row) to never get
 * visually overlapped during a diagonal scroll. The BODY cell is `z-[5]`, strictly below the
 * `<thead>`'s `z-10`: with a tie, stacking falls back to DOM order and the later `<tbody>`
 * cell painted OVER the sticky header during vertical scroll (same root
 * cause and fix as `ACTIONS_CELL_BODY_CLASS` and `PINNED_DATA_CELL_BODY_CLASS`).
 */
export const SELECTION_CELL_SHARED_CLASS = "sticky left-0 w-12 min-w-12 max-w-12 border-r px-0";
export const SELECTION_CELL_HEADER_CLASS = `${SELECTION_CELL_SHARED_CLASS} z-20 ${HEADER_OPAQUE_BG_CLASS}`;
export const SELECTION_CELL_BODY_CLASS = `${SELECTION_CELL_SHARED_CLASS} bg-background z-[5] group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--background)_50%)] group-data-[state=highlighted]/row:!bg-[color-mix(in_oklab,var(--primary)_10%,var(--background)_90%)] group-data-[state=selected]/row:bg-muted`;

/** Centers the checkbox within {@link SELECTION_CELL_SHARED_CLASS}'s zero-padding, fixed-width cell — a wrapping `<div>`, not `display: flex` on the `<td>`/`<th>` itself (which would pull it out of the table's own row-height layout). */
export const SELECTION_CHECKBOX_WRAPPER_CLASS = "flex items-center justify-center";

/**
 * The per-row actions (⋯) column's own classes, shared by header + body cells — the mirror
 * image of {@link SELECTION_CELL_SHARED_CLASS}/`_HEADER_CLASS`/`_BODY_CLASS` on the
 * OPPOSITE edge: `sticky right-0` (not `left-0`), `border-l` (not `border-r`, since the
 * divider sits on the side facing the rest of the table), same fixed width/zero-padding/
 * opaque-background-in-every-row-state treatment, built the exact same way for the exact
 * same reasons (see that constant's own doc comment for the full "why" — `border-separate`
 * for a clean sticky border, a fixed width so the sticky layout box can't diverge from the
 * table's own column-width allocation, zero cell padding plus a centering wrapper `<div>`
 * around the trigger instead of relying on padding to center it, and `group-hover/row:`/
 * `group-data-[state=selected]/row:` opaque equivalents so horizontally-scrolled content
 * passing underneath this cell specifically never shows through). The header cell is empty
 * (`ListViewLayout`'s `columnsWithActions` sets `header: ""`) but still gets the same sticky,
 * opaque, same-width treatment so the header row's divider lines up with the body's.
 *
 * The BODY cell's own z-index is `z-[5]` (not `z-10`) — the dots-menu
 * trigger painted ON TOP of the sticky header during vertical scroll instead of
 * disappearing underneath it like the rest of a scrolled row. Root cause: `TableHeader`
 * itself is `sticky top-0 z-10` (below); this cell previously tied that exact value, and
 * with a tie, stacking falls back to DOM order — `<tbody>` rows come after `<thead>`, so
 * the body's actions cell won a tie it should never have been able to win. `z-[5]` is
 * strictly below the header's `z-10` (no tie possible), so the dots menu now scrolls out
 * of view underneath the header exactly like an ordinary non-sticky body cell already does.
 * The HEADER cell keeps `z-20` (unchanged) since it must still out-rank the header row's
 * own `z-10` as a diagonal pin.
 */
export const ACTIONS_CELL_SHARED_CLASS = "sticky right-0 w-12 min-w-12 max-w-12 border-l px-0";
export const ACTIONS_CELL_HEADER_CLASS = `${ACTIONS_CELL_SHARED_CLASS} z-20 ${HEADER_OPAQUE_BG_CLASS}`;
export const ACTIONS_CELL_BODY_CLASS = `${ACTIONS_CELL_SHARED_CLASS} bg-background z-[5] group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--background)_50%)] group-data-[state=highlighted]/row:!bg-[color-mix(in_oklab,var(--primary)_10%,var(--background)_90%)] group-data-[state=selected]/row:bg-muted`;

/**
 * A user-pinned DATA column's own classes — the
 * SAME sticky/opaque/z-index treatment `SELECTION_CELL_*`/`ACTIONS_CELL_*`
 * use (see their own doc comment for the full "why"), generalized to an
 * arbitrary field: no hardcoded `left-0`/`right-0`/`w-12` here (the offset is
 * a DYNAMIC inline style from `column.getStart("left")`/`.getAfter("right")`,
 * the width is this column's own resolved `liveWidth()`, same as any
 * unpinned data column) — only `sticky`/opaque-background/z-index are fixed
 * Tailwind classes. The `border-r`/`border-l` divider is NOT part of this
 * shared class (unlike the selection/actions columns, which always sit at
 * the group's own edge) — it's applied per-cell only at the pinned/unpinned
 * BOUNDARY (the LAST pinned-left column, the FIRST pinned-right column), so
 * several pinned columns in a row don't each draw their own divider.
 */
export const PINNED_DATA_CELL_SHARED_CLASS = "sticky";
export const PINNED_DATA_CELL_HEADER_CLASS = `${PINNED_DATA_CELL_SHARED_CLASS} z-20 ${HEADER_OPAQUE_BG_CLASS}`;
export const PINNED_DATA_CELL_BODY_CLASS = `${PINNED_DATA_CELL_SHARED_CLASS} bg-background z-[5] group-hover/row:bg-[color-mix(in_oklab,var(--muted)_50%,var(--background)_50%)] group-data-[state=highlighted]/row:!bg-[color-mix(in_oklab,var(--primary)_10%,var(--background)_90%)] group-data-[state=selected]/row:bg-muted`;

/**
 * The spacer cell's own class — no declared width (the ONE column
 * `table-layout: fixed` leaves free to absorb slack or squeeze to 0, see
 * {@link resolveColumnWidthStyle}'s own doc comment) — rendered as a plain
 * flowing (NOT sticky) cell in the CENTER/scrollable region, right before
 * the pinned-right group begins — without it, a pinned-right group — `actions` included — just
 * sat wherever the declared columns' own sum happened to end, floating
 * mid-frame with empty space after it instead of flush against the
 * (REVERSAL of an earlier round's own
 * `border-l` drew a SECOND line — the spacer's own, right after the last
 * real data column's own grip/edge, THEN a visible gap, THEN the pinned-
 * right group's own existing `border-l` — where exactly ONE line is wanted. The spacer is deliberately undecorated so it reads as a
 * seamless, borderless CONTINUATION of the last real data column instead
 * of a cell in its own right; the ONE divider at this boundary is the
 * pinned-right group's own `border-l`, unchanged, already unconditional —
 * see {@link resolveCellDividerClass}'s own doc comment for how the
 * generic per-cell rule treats the spacer as a complete non-participant,
 * not a special case needing its own exception anymore) — no own
 * background (an ordinary, non-sticky cell, same as any unpinned data
 * cell — `TableRow`'s own `hover:bg-muted/50`/`data-[state=selected]:
 * bg-muted` already paints through every transparent cell in the row
 * uniformly, confirmed live: this cell, the one before it, and a real data
 * cell all read the exact same computed `background-color` in every row
 * state) — together this reads as a seamless continuation of the
 * preceding column, not a separate dead zone. The settled body loop renders it empty (no real content to
 * show); the SKELETON loop additionally renders a matching `w-full`
 * loading bar inside it, so the loading row's bar visually reaches the
 * pinned group instead of stopping at the preceding column's own declared
 * width. Its own resize grip/handle/highlight — the LAST unpinned
 * column's own, RELOCATED here rather than left at that column's own
 * (now visually meaningless, mid-gap) right edge — is handled separately,
 * see {@link resolveSpacerGripHeader}'s own doc comment.
 */
export const SPACER_CELL_CLASS = "border-b";

/**
 * Finds the index, within a row's own ORDERED header/cell array (already
 * grouped `[...pinned-left, ...center, ...pinned-right]` by TanStack's own
 * column-pinning feature), where the pinned-right group begins — the
 * insertion point for the spacer cell (right before the first pinned-right
 * entry, i.e. the LAST position in the center/scrollable group). `-1` when
 * nothing is pinned right at all (no spacer needed — a table with no
 * `actions` column and no user-pinned-right field, e.g. a non-list-view
 * caller, just keeps today's "no slack absorption" behavior).
 */
export function findRightPinnedInsertIndex<T>(items: T[], getPinned: (item: T) => false | "left" | "right"): number {
  return items.findIndex((item) => getPinned(item) === "right");
}

/**
 * The column whose own resize grip/handle/divider-highlight RELOCATES
 * into the spacer cell, instead of staying at that column's own (now
 * visually meaningless) right edge — the
 * LAST unpinned/center column's own grip sat at ITS OWN declared-width
 * edge, but the spacer (absorbing whatever slack remains before the
 * pinned-right group) could sit anywhere from 0 to hundreds of pixels
 * further right — leaving a visible GAP between the grip the user sees
 * and the actual boundary line (the pinned-right group's own `border-l`)
 * they'd expect it to sit on. Dragging still resizes the SAME column
 * (no new width model) — only the grip/handle/highlight's own
 * RENDER LOCATION moves, from that column's own cell into the spacer's.
 *
 * Returns `undefined` (no relocation) when:
 * - there's no spacer at all (`spacerIndex === -1`, no pinned-right
 *   group);
 * - the FIRST pinned-right entry already draws its OWN grip at this exact
 *   boundary — either it's `actions` (never resizable, but see the next
 *   bullet: the real point is "the pinned side already owns this
 *   divider," `actions` is just the one case where NEITHER side would
 *   own it without relocation) or any real resizable pinned-right DATA
 *   column (e.g. a pinned-right `vex_status`/Status): relocating a
 *   SECOND grip into the spacer here would land it immediately next to
 *   the pinned column's OWN `left-0` grip — two `role="separator"`
 *   elements stacked on the same divider ("one on
 *   the unpinned column's side (does nothing) and one on the pinned
 *   column's side (works)" — confirmed via rects: two separators within
 *   a few px of each other at the boundary). The pinned-right column's
 *   own grip (rendered unconditionally wherever it is, spacer or not)
 *   is the sole owner of this divider now — see
 *   {@link isSuppressedByPinnedRightGrip}, which ALSO keeps the spacer's
 *   own candidate column from drawing an un-relocated grip at its own
 *   (now gap-separated) edge in this same case;
 * - the column immediately before the spacer is ITSELF pinned (left) —
 *   the degenerate case where EVERY data field is pinned left and the
 *   spacer sits directly after the pinned-left group with no center
 *   columns at all: that column already has its own `border-r`/resize
 *   edge exactly at the pinned-left/pinned-right boundary
 *   (`isResizeBoundaryLeft`'s own rule, unchanged), nothing to relocate;
 * - that column's own `columnDef.enableResizing` is explicitly `false` —
 *   there is no grip to relocate for a non-resizable column at all (same
 *   audit as `isResizable`'s own check in each render loop).
 *
 * @param items - The row's own ordered header/cell array.
 * @param spacerIndex - {@link findRightPinnedInsertIndex}'s own result.
 */
export function resolveSpacerGripHeader<
  THeader extends {
    column: {
      id: string;
      getIsPinned: () => false | "left" | "right";
      columnDef: { enableResizing?: boolean };
    };
  },
>(items: THeader[], spacerIndex: number): THeader | undefined {
  if (spacerIndex <= 0) return undefined;
  const boundaryColumn = items[spacerIndex]!.column;
  if (boundaryColumn.id === "actions" || boundaryColumn.columnDef.enableResizing !== false) return undefined;
  const candidate = items[spacerIndex - 1]!;
  if (candidate.column.columnDef.enableResizing === false) return undefined;
  return candidate.column.getIsPinned() === false ? candidate : undefined;
}

/**
 * Whether the column at `index` sits immediately before the first
 * pinned-right column AND that pinned-right column draws its own grip
 * there — both sides of this ONE divider
 * independently rendered a resize grip (and highlight), stacking two
 * `role="separator"` elements on the same boundary; the pinned-right
 * column's own (higher `resolveDividerZIndexClass` tier) painted over
 * the other, which never received a pointer event — "one on the
 * unpinned column's side (does nothing) and one on the pinned column's
 * side (works)". The pinned-right column's own grip
 * (`isResizeBoundaryRight`'s render in each loop) is the sole
 * owner of this divider now; this column suppresses its own entirely —
 * NOT just its relocation into the spacer ({@link resolveSpacerGripHeader}
 * already stopped relocating in this case), its un-relocated own-edge
 * grip too, since that edge is no longer the visual boundary once a
 * spacer is absorbing slack before it.
 *
 * Mirrors `previousDrawsBorderRight`'s "exactly one owner per divider"
 * rule, applied to grips instead of borders, looking FORWARD (`index +
 * 1`) instead of backward — the owner here is the NEXT column, not the
 * previous one, because a right-pinned column's grip sits on its own
 * LEFT edge (inverted drag direction), not its right.
 *
 * @param items - The row's own ordered header/cell array (the spacer
 *   cell is never one of its entries — it's synthesized separately at
 *   render time — so `items[index + 1]` is always the next REAL column,
 *   spacer or no spacer).
 * @param index - The CURRENT column's own index.
 * @param pinnedRightIds - `columnPinning.right` — `pinnedRightIds[0]` is
 *   the first (leftmost, boundary-adjacent) pinned-right column's own id.
 */
export function isSuppressedByPinnedRightGrip(
  items: { column: { id: string; columnDef: { enableResizing?: boolean } } }[],
  index: number,
  pinnedRightIds: string[],
): boolean {
  const next = items[index + 1];
  if (next === undefined || next.column.id !== pinnedRightIds[0]) return false;
  return next.column.id !== "actions" && next.column.columnDef.enableResizing !== false;
}

/**
 * Whether the column immediately BEFORE `index` in `items` (the header/
 * cell array, already pin-grouped by TanStack's own column-pinning
 * feature: `[...pinned-left, ...center, ...pinned-right]`) already draws
 * its OWN `border-r` — the `select` column (always, unconditionally, via
 * `SELECTION_CELL_SHARED_CLASS`) or the LAST left-pinned data column
 * (conditionally, via `isResizeBoundaryLeft`'s own rule in each render
 * loop). `false` for the row's very first cell (`index === 0`,
 * no predecessor to check at all) — {@link resolveCellDividerClass}'s own
 * `isFirst` check already handles that case independently, this function
 * is never even called for it in practice, but stays correct either way.
 *
 * @param items - The row's own ordered header/cell array.
 * @param index - The CURRENT cell's own index — this function inspects
 *   `items[index - 1]`, not `items[index]`.
 * @param pinnedLeftIds - `columnPinning.left` — `pinnedLeftIds.at(-1)` is
 *   the last left-pinned column's own id (which may itself BE `"select"`,
 *   when no data field is pinned left at all — harmless: `select`'s own
 *   unconditional `border-r` already covers that case identically).
 */
export function previousDrawsBorderRight(
  items: { column: { id: string } }[],
  index: number,
  pinnedLeftIds: string[],
): boolean {
  if (index === 0) return false;
  const previousId = items[index - 1]!.column.id;
  return previousId === "select" || previousId === pinnedLeftIds.at(-1);
}

/**
 * Resolves whether a cell draws its OWN left-edge divider (`border-l`) —
 * the ONE helper the header, body, and skeleton render loops all call,
 * replacing three near-identical copies of this logic (developer-
 * reported: with only the EXISTING pin-boundary-specific borders — the
 * `select` column's own `border-r`, the `actions` column's own `border-l`,
 * the last-pinned-left/first-pinned-right boundary pair — two ADJACENT
 * UNPINNED data columns had NO divider between them at all; this gives
 * every pair of adjacent columns exactly ONE line, never doubled, never
 * missing).
 *
 * A cell draws `border-l` UNLESS:
 * - it's the row's very FIRST cell (`isFirst`) — no left neighbour to
 *   divide from at all, the table's own left edge, not an inter-column
 *   boundary;
 * - it's the `select` column (`isSelectColumn`) — never draws its own
 *   left border; its RIGHT edge (`border-r`, unconditional, via
 *   `SELECTION_CELL_SHARED_CLASS`) is what divides it from whatever
 *   comes next, already handled, this function is never even reached for
 *   it in the render loops (guarded before the call);
 * - it's the `actions` column or the FIRST right-pinned data column
 *   (`isFirstRightPinned`) — both already draw their own `border-l`
 *   unconditionally (`ACTIONS_CELL_SHARED_CLASS`) or via the EXISTING
 *   `isResizeBoundaryRight` rule in each loop — this function does NOT
 *   also apply a second, redundant one;
 * - its own LEFT NEIGHBOUR already draws `border-r`
 *   (`previousHasBorderRight`, see {@link previousDrawsBorderRight}) — that
 *   neighbour's own right edge already closes the gap; a second line from
 *   THIS cell's own left edge would double it.
 *
 * The spacer cell is NOT routed through this function at all — it draws
 * NO border of its own (`SPACER_CELL_CLASS` is just `"border-b"`,
 * an EARLIER round's own `border-l` there
 * drew a SECOND line at this boundary — see that constant's own doc
 * comment for the full story). It reads as a borderless continuation of
 * the last real data column before it; the pinned-right group's own
 * EXISTING `border-l` (`isFirstRightPinned`, above) is the only line.
 */
export function resolveCellDividerClass(props: {
  isFirst: boolean;
  isSelectColumn: boolean;
  isActionsColumn: boolean;
  isFirstRightPinned: boolean;
  previousHasBorderRight: boolean;
}): string | undefined {
  if (props.isFirst || props.isSelectColumn || props.isActionsColumn || props.isFirstRightPinned) {
    return undefined;
  }
  return props.previousHasBorderRight ? undefined : "border-l";
}

/**
 * The z-index for a resizable column's own grip/handle/divider-highlight
 * — an UNPINNED column's resize handle painted ON
 * TOP of a sticky (pinned-left/right, selection, actions) cell during
 * horizontal scroll instead of sliding underneath it like the rest of
 * the scrolled content, because its `z-20`/`z-10` was UNCONDITIONAL
 * regardless of the column's own pin state — an unpinned `<TableHead>`/
 * `<TableCell>` has `position: relative` but NO `z-index` of its own, so
 * it creates NO stacking context of its own; a `z-20` CHILD inside it
 * (the handle) therefore competes directly against OTHER cells' z-index
 * at the shared row-level stacking context — including sticky cells
 * elsewhere in the SAME row, which it could outrank depending on DOM
 * order during scroll.
 *
 * A PINNED column's own `<TableHead>`/`<TableCell>` is `position: sticky`
 * WITH an explicit `z-index` (10 body / 20 header, unchanged, `*_HEADER_
 * CLASS`/`*_BODY_CLASS` constants above) — `position: sticky` ALWAYS
 * creates its own new stacking context, regardless of the z-index value,
 * so a pinned column's own handle/highlight — however it's numbered —
 * is already fully ISOLATED inside that cell's own context; it can never
 * leak out to compete with another cell at all. The EXISTING `z-20`
 * (handle) / `z-10` (highlight) stay exactly as they were for a pinned
 * column, safe regardless.
 *
 * For an UNPINNED column, both layers drop to deliberately LOW, explicit
 * values (`z-[2]`/`z-[1]`) — below EVERY sticky cell's own `z-10`/`z-20`
 * at the shared stacking-context level, so an unpinned column's grip/
 * handle/highlight always slides underneath a sticky cell during scroll,
 * never over it — while still keeping the handle (`z-[2]`) above its own
 * highlight (`z-[1]`), the SAME relative ordering the pinned case has
 * (`z-20` above `z-10`), just renumbered into the unpinned scale.
 *
 * @param isPinned - Whether THIS column itself is pinned left or right
 *   (`column.getIsPinned() !== false`) — not whether some OTHER column in
 *   the row is.
 * @param layer - Which element is asking: the interactive handle (header
 *   only) or the highlight bar (every row).
 */
export function resolveDividerZIndexClass(isPinned: boolean, layer: "handle" | "highlight"): string {
  if (isPinned) return layer === "handle" ? "z-20" : "z-10";
  return layer === "handle" ? "z-[2]" : "z-[1]";
}
