"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { GripVertical } from "lucide-react";
import { columnEntryField, type ColumnEntry, type ListDensity } from "@vexcms/core";
import { Button } from "../button";
import { Checkbox } from "../checkbox";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { ScrollSection } from "../ScrollSection";
import type { ActionPlacement } from "../ActionsMenu";
import { DndProvider } from "../dnd/DndProvider";
import { Droppable } from "../dnd/Droppable";
import { Draggable } from "../dnd/Draggable";
import { DragHandle } from "../dnd/DragHandle";
import { DataTableResponsiveMenu } from "./DataTableResponsiveMenu";

/**
 * One column's static display metadata, as resolved from a collection's
 * ALREADY read-access-filtered columns (see
 * `CollectionListView`'s `columnMenuEntries` memo, which is this prop's
 * source) for {@link DataTableColumnsMenu}. Every READABLE column gets an
 * entry now (widened from "hideable columns only") — a
 * non-hideable field still participates in drag-reordering/pinning, it
 * just can't be hidden. Unordered, and carries no width/pin/hidden state
 * of its own — that LIVE state is `columns: ColumnEntry[]` ({@link
 * DataTableColumnsMenuProps}), looked up by `field` here.
 *
 * @typeParam TFieldSlug - The collection's field slugs.
 */
export interface DataTableColumn<TFieldSlug extends string = string> {
  /** The field key this entry toggles/reorders/pins. */
  field: TFieldSlug;
  /** The column's display label. */
  label: string;
  /** Whether this column can be hidden (`admin.enableHiding === true`). `false` renders a disabled, permanently-checked checkbox — still draggable/pinnable. */
  hideable: boolean;
}

/**
 * Props for {@link DataTableColumnsMenu}.
 *
 * @typeParam TFieldSlug - The collection's field slugs.
 */
export interface DataTableColumnsMenuProps<TFieldSlug extends string = string> {
  /** Every readable column's static label/hideable metadata (widened from "hideable only"), unordered; display order/visibility/pin state comes from `columns`. */
  columnMenuEntries: DataTableColumn<TFieldSlug>[];
  /** The active view's FULL column list — every one of the collection's own data fields, exactly once, in display order, each a {@link ColumnEntry} (possibly carrying `width`/`pinned`/`hidden` overrides). Drives the row sequence, checkbox, AND pin-control state here. */
  columns: ColumnEntry<TFieldSlug>[];
  /** Replaces the full `columns` array after a drag-reorder, checkbox toggle, or pin-control change — the ONE setter for every interaction this menu offers (resizing is NOT controlled from here, only from the header's own drag handle). */
  onColumnsChange: (columns: ColumnEntry<TFieldSlug>[]) => void;
  /** Whether a saved view is currently active — when `false`, a session-only notice is shown. */
  hasActiveView?: boolean;
  /** The current density preference — owned by `CollectionListView`/`useListViewContext()`, cookie-backed, never this component's own state. */
  density: ListDensity;
  /** Replaces the density preference; the caller both updates its own state and writes it into the consolidated `vex-admin` cookie (`writeListViewDensityCookie`) so the next server render matches with no flash. */
  onDensityChange: (density: ListDensity) => void;
  /**
   * Which surface this render is for (mirrors the edit view's
   * `placement` convention): `"inline"` (default) for the toolbar's own
   * `DataTableResponsiveMenu` trigger, `"menu"` for a labeled section
   * folded into `ListViewToolbar`'s ⋯ overflow menu.
   */
  placement?: ActionPlacement;
}

/**
 * Reads a {@link ColumnEntry}'s own `pinned` side, or `undefined` for a
 * bare-slug entry (no overrides at all, equivalent to unpinned).
 */
function entryPinned<TFieldSlug extends string>(entry: ColumnEntry<TFieldSlug>): "left" | "right" | undefined {
  return typeof entry === "string" ? undefined : entry.pinned;
}

/** Reads a {@link ColumnEntry}'s own `hidden` flag, defaulting to `false` (visible) for a bare-slug entry or an object entry that never set it. */
function entryHidden<TFieldSlug extends string>(entry: ColumnEntry<TFieldSlug>): boolean {
  return typeof entry === "string" ? false : (entry.hidden ?? false);
}

/**
 * Applies a drag/keyboard reorder — `from`/`to` are indices WITHIN the
 * READABLE subsequence only (`readableFields`, the rows this menu
 * actually renders and `@hello-pangea/dnd` reports indices against) —
 * back onto the FULL column list, which may additionally
 * include unreadable fields this viewer never sees a row for. An
 * unreadable field keeps its original absolute position (AND its own
 * entry, untouched) — only the readable fields shift among themselves, in
 * their new relative order, each carrying its own `width`/`pinned`/
 * `hidden` overrides along with it (a reorder never touches those).
 *
 * Exported for direct unit testing — the fiddly index-translation logic
 * shouldn't only be exercised through a simulated drag gesture, which
 * this repo's `ui/dnd` tests don't attempt (see `DragHandle.test.tsx`:
 * structural assertions only, no simulated `@hello-pangea/dnd` gesture).
 *
 * @param props - Input props.
 * @param props.columns - The full column list before this reorder.
 * @param props.readableFields - The readable subsequence, in ITS current
 *   (pre-reorder) order — i.e. `columns` filtered down to what this menu
 *   rendered a row for.
 * @param props.from - The dragged row's index within `readableFields`.
 * @param props.to - Its drop index within `readableFields`.
 * @returns The new full column list, or `props.columns` unchanged when
 *   `from === to` or either index is out of range.
 */
export function reorderColumns<TFieldSlug extends string = string>(props: {
  columns: ColumnEntry<TFieldSlug>[];
  readableFields: TFieldSlug[];
  from: number;
  to: number;
}): ColumnEntry<TFieldSlug>[] {
  if (props.from === props.to) return props.columns;
  const byField = new Map(props.columns.map((entry) => [columnEntryField(entry), entry]));
  const movedFields = [...props.readableFields];
  const [liftedField] = movedFields.splice(props.from, 1);
  if (liftedField === undefined) return props.columns;
  movedFields.splice(props.to, 0, liftedField);
  const movedSet = new Set(props.readableFields);
  let cursor = 0;
  return props.columns.map((entry) => {
    const field = columnEntryField(entry);
    if (!movedSet.has(field)) return entry;
    return byField.get(movedFields[cursor++]!)!;
  });
}

/**
 * A dropdown of checkboxes toggling which `enableHiding` columns are
 * visible in the list table, a 3-state pin control (left/none/right)
 * per column, plus a Density toggle.
 *
 * Column visibility, pin, AND density are all purely controlled — density
 * is read from a cookie on the server
 * (`parseListViewConfigCookies`) and owned by `CollectionListView`, the same
 * split live preview's panel-open state already uses
 * (`readLivePreviewPanelCookie`/`writeLivePreviewPanelCookie`) — a
 * component-local store can't be read before hydration, so the density the
 * server rendered and the density the client mounts with could otherwise
 * differ for one frame.
 *
 * `placement="inline"` (default) renders through {@link DataTableResponsiveMenu}
 * (a `Popover` at `useIsMobile() === false`, a bottom `Sheet` below 768px) —
 * its own "Columns" label hides itself below `@xl/list` via a
 * plain CSS class on its own `<span>`; `placement="menu"` renders the
 * identical checkbox/pin/density body as a labeled section for `ListViewToolbar`'s
 * ⋯ overflow — both forms share the exact same body JSX.
 *
 * @param props - Component props. See {@link DataTableColumnsMenuProps}.
 * @returns The columns control, or `null` when `columnMenuEntries` is empty.
 */
export function DataTableColumnsMenu<TFieldSlug extends string = string>(
  props: DataTableColumnsMenuProps<TFieldSlug>,
): ReactNode {
  if (props.columnMenuEntries.length === 0) return null;

  const metaByField = new Map(props.columnMenuEntries.map((column) => [column.field, column]));
  // `props.columns` is the FULL order — restricted here to
  // the readable subset this menu actually shows a row for, in that same
  // relative order. A field absent from `props.columnMenuEntries`
  // (unreadable) never gets a row, but still occupies a slot (and its own
  // entry) in `props.columns` itself — `handleReorder`/`handleCheckedChange`/
  // `handlePinChange` below all preserve its absolute position untouched.
  const orderedColumns = props.columns
    .map((entry) => {
      const meta = metaByField.get(columnEntryField(entry));
      return meta === undefined ? undefined : { meta, entry };
    })
    .filter((row): row is { meta: DataTableColumn<TFieldSlug>; entry: ColumnEntry<TFieldSlug> } => row !== undefined);

  function handleReorder(from: number, to: number) {
    props.onColumnsChange(
      reorderColumns({
        columns: props.columns,
        readableFields: orderedColumns.map((row) => row.meta.field),
        from,
        to,
      }),
    );
  }

  function handleCheckedChange(field: TFieldSlug, checked: boolean) {
    const visibleFields = orderedColumns.filter((row) => !entryHidden(row.entry)).map((row) => row.meta.field);
    if (!checked && visibleFields.length === 1 && visibleFields.includes(field)) return;
    props.onColumnsChange(
      props.columns.map((entry) =>
        columnEntryField(entry) !== field
          ? entry
          : typeof entry === "string"
            ? { field: entry, hidden: !checked }
            : { ...entry, hidden: !checked },
      ),
    );
  }

  /** The 3-state pin control's own toggle: clicking the side a column is ALREADY pinned to unpins it; clicking the other side switches to it. */
  function handlePinChange(field: TFieldSlug, side: "left" | "right") {
    props.onColumnsChange(
      props.columns.map((entry) => {
        if (columnEntryField(entry) !== field) return entry;
        const current = entryPinned(entry);
        const next = current === side ? undefined : side;
        if (typeof entry === "string") {
          return next === undefined ? entry : { field: entry, pinned: next };
        }
        if (next === undefined) {
          const { pinned: _pinned, ...rest } = entry;
          return rest;
        }
        return { ...entry, pinned: next };
      }),
    );
  }

  // A non-hideable field's row still gets a working drag handle (Decision
  // 47) but its checkbox is permanently disabled+checked — `cursor-default`
  // instead of `cursor-pointer` so it doesn't visually LOOK clickable
  // (Base UI's own `disabled:cursor-not-allowed`/`disabled:opacity-50`
  // already style the checkbox element itself; this just keeps the
  // wrapping `<label>`'s own affordance consistent with it).
  function rowLabelClassName(column: DataTableColumn<TFieldSlug>): string {
    return `flex flex-1 items-center gap-2 px-1 py-1.5 text-sm ${column.hideable ? "cursor-pointer" : "cursor-default"}`;
  }

  // Developer-reported follow-up: the pin buttons worked, but their
  // icons never SHOWED which side (if any) a column was actually pinned
  // to — the `secondary`/`ghost` variant swap alone read as too subtle.
  // Two changes: (1) `PanelLeft`/`PanelRight` (the SAME icon pairing
  // `ui/sidebar.tsx`'s own collapse toggle already uses for "which side
  // panel/pin" — both ALREADY valid `IconName`s, that type is literally
  // `keyof typeof import("lucide-react").icons`, the library's own FULL
  // icon map, not a curated subset needing regeneration) instead of
  // `ArrowLeftToLine`/`ArrowRightToLine` — a clearer "pinned panel" visual
  // metaphor than a generic arrow-to-line glyph. (2) The icon itself
  // (not just the button's own background) recolors: `text-primary` for
  // the side a column IS pinned to, `text-muted-foreground` otherwise —
  // `className` flows through `Button`'s own `cn(buttonVariants(...))`
  // call, so it wins over the `ghost`/`secondary` variant's own (unset/
  // inherited) text color via the SAME `tailwind-merge` conflict
  // resolution every other override in this codebase relies on.
  function pinControl(row: { meta: DataTableColumn<TFieldSlug>; entry: ColumnEntry<TFieldSlug> }): ReactNode {
    const pinned = entryPinned(row.entry);
    return (
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          variant={pinned === "left" ? "secondary" : "ghost"}
          size="icon-xs"
          icon="PanelLeft"
          className={pinned === "left" ? "text-primary" : "text-muted-foreground"}
          aria-pressed={pinned === "left"}
          aria-label={pinned === "left" ? `Unpin ${row.meta.label}` : `Pin ${row.meta.label} left`}
          onClick={() => handlePinChange(row.meta.field, "left")}
        />
        <Button
          type="button"
          variant={pinned === "right" ? "secondary" : "ghost"}
          size="icon-xs"
          icon="PanelRight"
          className={pinned === "right" ? "text-primary" : "text-muted-foreground"}
          aria-pressed={pinned === "right"}
          aria-label={pinned === "right" ? `Unpin ${row.meta.label}` : `Pin ${row.meta.label} right`}
          onClick={() => handlePinChange(row.meta.field, "right")}
        />
      </div>
    );
  }

  const body = (
    <>
      {/*
       * `height={240}` (NOT `maxHeight`):
       * `maxHeight` alone clamps `ScrollArea.Root`'s own rendered box
       * correctly (confirmed live — the Root measures exactly 240px), but
       * its `ScrollArea.Viewport` child sizes itself via `height: 100%`
       * (`size-full`), and a percentage height only resolves against an
       * ancestor with a DEFINITE `height` — `max-height` alone leaves the
       * ancestor's own height formally `auto` for that purpose, so the
       * Viewport fell back to its CONTENT's natural height (confirmed
       * live: 1508px for ~20 draggable rows) instead of the intended
       * 240px, letting every row overflow the popover uncapped. Plain
       * `height` is always definite, so the Viewport's `100%` resolves
       * correctly and `overflow-y: scroll` (already set) takes over. The
       * list is always exactly 240px tall now (not "240px or shorter").
       */}
      {/*
       * Follow-up: the `mb-4`-only fix above
       * still left a visible gap ABOVE the divider — `PopoverContent` (and,
       * in the mobile `placement="menu"` embedded form, its own `gap-2`
       * wrapper) is a flex column whose `gap-N` applies between EVERY
       * direct child, including `ScrollSection` and the divider below it;
       * flex siblings never collapse margins, so that structural gap
       * ADDED to whatever margin either element declared, however small.
       * Wrapping `ScrollSection` + the divider together in ONE plain
       * `flex flex-col` div (default 0 gap) makes them a SINGLE child from
       * the surrounding column's perspective — its OWN gap-N still applies
       * on the OUTSIDE of this wrapper (above `ScrollSection`, below the
       * divider), but no longer BETWEEN them — the only way to get a
       * literal ~0px boundary without hardcoding a negative margin tied to
       * one specific ancestor's gap value (which would be WRONG by a
       * different amount in the `gap-2` embedded context).
       */}
      <div className="flex flex-col">
        {props.hasActiveView === false && (
          <p className="mr-3 px-2 pt-1.5 pb-2 text-xs text-muted-foreground">
            Column changes last until you close this tab. Save a view to keep them.
          </p>
        )}
        <ScrollSection height={240}>
          <DndProvider>
            <Droppable
              id="data-table-columns"
              onReorder={handleReorder}
              // `renderClone` portals the ACTIVELY-DRAGGED row to
              // `document.body`:
              // `@hello-pangea/dnd` positions the dragged item with `position:
              // fixed`, computed relative to the nearest ancestor with a CSS
              // `transform` — not the viewport — when one exists in between
              // (the DEFAULT CSS behavior, not a library bug). This menu
              // renders inside `DataTableResponsiveMenu`'s `PopoverContent`
              // (Base UI `Popover.Positioner`, which anchors via `transform`),
              // so without a clone portaled OUTSIDE that ancestor, the dragged
              // item both jumps to a fixed pointer offset while dragging AND
              // glitches on drop (the library's own return-to-rest animation
              // math is thrown off by the same transformed ancestor). Portaling
              // to `document.body` — which has no transform ancestor — is
              // `@hello-pangea/dnd`'s own documented fix for exactly this class
              // of bug ("Portals, transforms, and other CSS challenges").
              // `ArrayField`/`BlocksField` never hit this: they render inline
              // in the form, never inside a transformed Popover/Dialog.
              renderClone={(provided, _snapshot, rubric) => {
                const row = orderedColumns.find((r) => r.meta.field === rubric.draggableId);
                if (row === undefined) return null;
                return createPortal(
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="flex items-center gap-1 rounded-sm border bg-popover shadow-md"
                  >
                    <div className="ml-1 shrink-0 cursor-grabbing" {...provided.dragHandleProps}>
                      <GripVertical size={16} />
                    </div>
                    <label className={rowLabelClassName(row.meta)}>
                      <Checkbox
                        aria-label={row.meta.label}
                        checked={!entryHidden(row.entry)}
                        disabled={!row.meta.hideable}
                      />
                      {row.meta.label}
                    </label>
                    {pinControl(row)}
                  </div>,
                  document.body,
                );
              }}
            >
              {/*
               * `pr-3` reserves a gutter
               * matching `ScrollBar`'s own `w-2.5` track width (+ its `p-px`
               * padding) — the Base UI `ScrollArea`'s scrollbar is an OVERLAY,
               * absolutely positioned at the Viewport's own right edge rather
               * than reserving space in normal flow, so without this the thumb
               * painted directly over the pin-right buttons (the row's own
               * rightmost content). Static, not conditional on whether the
               * list actually overflows 240px — the popover's width is fixed
               * (`w-72`, `PopoverContent`'s own default) either way, so this
               * never shifts anything whether or not scrolling kicks in.
               */}
              <div data-slot="columns-menu-rows" className="flex flex-col gap-1 pr-3 pb-2">
                {orderedColumns.map((row, index) => (
                  <Draggable key={row.meta.field} id={row.meta.field} index={index}>
                    <div className="flex items-center gap-1 rounded-sm hover:bg-muted">
                      <DragHandle className="ml-1" />
                      <label className={rowLabelClassName(row.meta)}>
                        <Checkbox
                          aria-label={row.meta.label}
                          checked={!entryHidden(row.entry)}
                          disabled={!row.meta.hideable}
                          onCheckedChange={(checked) => handleCheckedChange(row.meta.field, !!checked)}
                        />
                        {row.meta.label}
                      </label>
                      {pinControl(row)}
                    </div>
                  </Draggable>
                ))}
              </div>
            </Droppable>
          </DndProvider>
        </ScrollSection>
        {/*
         * `mr-3`: the row list's own
         * `pr-3` (above) reserves a 12px gutter for the `ScrollBar`
         * OVERLAY, so whenever the column list actually overflows 240px
         * (the common case — this collection's columns, `testimonials`,
         * already need it), the rows' own rightmost content stops 12px
         * SHORT of the popover's padded edge while the divider/"Density"
         * section below (no gutter of their own) still ran flush to it —
         * a visible ~12px jog where the divider's right end, and the
         * radio labels below it, poked out past the row list's own right
         * edge. Matching the SAME `mr-3` here keeps every section's right
         * edge flush with one another regardless of whether that frame's
         * list happens to be scrollable.
         */}
        <div className="mr-3 h-px bg-border" />
        {/*
         * Density lives inside the SAME gap-free wrapper as the list and divider so the
         * divider sits exactly midway: the row list's own `pb-2` (inside the scroll content)
         * above it, this section's matching `pt-2` below.
         */}
        <div className="mr-3 flex flex-col gap-2 px-2 pt-2 pb-1">
        <p className="text-xs font-medium text-muted-foreground">Density</p>
        <RadioGroup
          value={props.density}
          onValueChange={(value) => props.onDensityChange(value as ListDensity)}
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="comfortable" aria-label="Comfortable" /> Comfortable
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="compact" aria-label="Compact" /> Compact
          </label>
        </RadioGroup>
        </div>
      </div>
    </>
  );

  if (props.placement === "menu") {
    return (
      <div className="flex flex-col gap-2 border-t pt-2 first:border-t-0 first:pt-0">
        <p className="px-2 text-xs font-medium text-muted-foreground">Columns</p>
        {body}
      </div>
    );
  }

  return (
    <DataTableResponsiveMenu
      trigger={
        <Button variant="outline" size="default" aria-label="Columns" icon="Columns3">
          <span className="hidden @xl/list:inline">Columns</span>
        </Button>
      }
      title="Columns"
    >
      {body}
    </DataTableResponsiveMenu>
  );
}
