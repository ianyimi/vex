import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import type { VexDocument } from "@vexcms/core";

import { DataTable, isInteractiveRowTarget } from "../ui/data-table/DataTable";
import { DataTableBulkActions } from "../ui/data-table/DataTableBulkActions";
import { DataTableBulkDeleteModal, type DataTableBulkDeleteModalProps } from "../ui/data-table/DataTableBulkDeleteModal";

/** One member per `ui/data-table` file this suite covers. */
export type DataTableSuiteMember =
  | "DataTable"
  | "DataTableBulkActions"
  | "DataTableBulkDeleteModal";

/** Options for {@link runDataTableSuite}. */
export interface DataTableSuiteOptions {
  /** Which members to run. Defaults to all three. */
  only?: DataTableSuiteMember[];
}

/** A minimal document shape every fixture row in this suite satisfies. */
interface Row extends VexDocument {
  title: string;
}

/** Three rows, three distinct titles — enough to exercise selection and rendering without noise. */
const ROWS: Row[] = [
  { _id: "doc_1", _creationTime: 1, title: "First post" },
  { _id: "doc_2", _creationTime: 2, title: "Second post" },
  { _id: "doc_3", _creationTime: 3, title: "Third post" },
];

/** The single-column `ColumnDef` every `DataTable` render in this suite uses. */
const COLUMNS: ColumnDef<Row>[] = [{ accessorKey: "title", header: "Title" }];

/**
 * Runs the shared contract for `ui/data-table`'s three components: `DataTable`'s row/
 * header rendering, Load-More wiring, row-selection checkbox column, and the
 * `onSelectionChange` callback it reports selection through; `DataTableBulkActions`'s
 * count/callback contract; and `DataTableBulkDeleteModal`'s (`DataTableBulkDeleteModal`) confirm/cancel wiring.
 *
 * @param options - Which members to run; defaults to all three.
 */
export function runDataTableSuite(options?: DataTableSuiteOptions): void {
  const only = options?.only ?? [
    "DataTable",
    "DataTableBulkActions",
    "DataTableBulkDeleteModal",
  ];

  afterEach(() => cleanup());

  if (only.includes("DataTable")) {
    describe("DataTable", () => {
      it("renders the header label and every row's cell", () => {
        render(<DataTable data={ROWS} columns={COLUMNS} />);
        expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
        for (const row of ROWS) {
          expect(screen.getByRole("cell", { name: row.title })).toBeInTheDocument();
        }
      });

      it("applies the column's meta.align to both the header cell and every row's data cell", () => {
        const alignedColumns: ColumnDef<Row>[] = [
          { accessorKey: "title", header: "Title", meta: { align: "right" } },
        ];
        render(<DataTable data={ROWS} columns={alignedColumns} />);

        expect(screen.getByRole("columnheader", { name: "Title" })).toHaveClass("text-right");
        for (const row of ROWS) {
          expect(screen.getByRole("cell", { name: row.title })).toHaveClass("text-right");
        }
      });

      // Regression: the header-rendering loop used `header.column.getCanSort()`
      // to decide whether to render `DataTableSortHeader`, but `useReactTable`'s
      // OWN `enableSorting: false` table option (deliberate — VexCMS sorts via
      // `sort`/`onSortChange`, never TanStack's internal `SortingState`) makes
      // `getCanSort()` return `false` for EVERY column regardless of its own
      // `columnDef.enableSorting` — silently hiding the sort button on every
      // column that set `enableSorting: true` (`getCollectionColumnDefs`'s
      // `resolveListViewColumnConfig`-sourced value), including every `commitTs`/`date`
      // field an app explicitly opts into sorting.
      it("renders a clickable sort button for a column whose own columnDef sets enableSorting: true, and reports clicks via onSortChange", async () => {
        const user = userEvent.setup();
        const onSortChange = vi.fn();
        const sortableColumns: ColumnDef<Row>[] = [
          { accessorKey: "title", header: "Title", enableSorting: true, meta: { label: "Title" } },
        ];
        render(<DataTable data={ROWS} columns={sortableColumns} onSortChange={onSortChange} />);

        const sortButton = screen.getByRole("button", { name: "Title" });
        await user.click(sortButton);
        expect(onSortChange).toHaveBeenCalledWith({ field: "title", order: "asc" });
      });

      it("renders plain, unclickable header text for a column whose columnDef leaves enableSorting unset or false", () => {
        render(<DataTable data={ROWS} columns={COLUMNS} onSortChange={vi.fn()} />);
        expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Title/ })).not.toBeInTheDocument();
      });

      // Polish review WARN: a sortable `<th>` must report its own sort state
      // via `aria-sort` (WAI-ARIA grid convention — on the header CELL
      // itself, not the inner sort button), not just a visual icon.
      it("sets aria-sort on a sortable column's header: none when unsorted/not the active field, ascending/descending when it IS the active field", () => {
        const sortableColumns: ColumnDef<Row>[] = [
          { accessorKey: "title", header: "Title", enableSorting: true, meta: { label: "Title" } },
        ];
        const { rerender } = render(
          <DataTable data={ROWS} columns={sortableColumns} onSortChange={vi.fn()} />,
        );
        expect(screen.getByRole("columnheader", { name: "Title" })).toHaveAttribute("aria-sort", "none");

        rerender(
          <DataTable
            data={ROWS}
            columns={sortableColumns}
            sort={{ field: "title", order: "asc" }}
            onSortChange={vi.fn()}
          />,
        );
        expect(screen.getByRole("columnheader", { name: "Title" })).toHaveAttribute("aria-sort", "ascending");

        rerender(
          <DataTable
            data={ROWS}
            columns={sortableColumns}
            sort={{ field: "title", order: "desc" }}
            onSortChange={vi.fn()}
          />,
        );
        expect(screen.getByRole("columnheader", { name: "Title" })).toHaveAttribute("aria-sort", "descending");
      });

      it("omits aria-sort entirely on a non-sortable column's header", () => {
        render(<DataTable data={ROWS} columns={COLUMNS} onSortChange={vi.fn()} />);
        expect(screen.getByRole("columnheader", { name: "Title" })).not.toHaveAttribute("aria-sort");
      });

      it("every sortable column reports aria-sort=none while search is active (sort parked) — even one that was the active sort field a moment ago", () => {
        const sortableColumns: ColumnDef<Row>[] = [
          { accessorKey: "title", header: "Title", enableSorting: true, meta: { label: "Title" } },
        ];
        const { rerender } = render(
          <DataTable
            data={ROWS}
            columns={sortableColumns}
            sort={{ field: "title", order: "asc" }}
            onSortChange={vi.fn()}
          />,
        );
        expect(screen.getByRole("columnheader", { name: "Title" })).toHaveAttribute("aria-sort", "ascending");

        // `ListViewLayout.tsx`'s own `sort={urlState.q ? undefined : urlState.sort}`
        // is what actually parks it — simulated here directly on the prop,
        // same as `sortDisabled` below (the visual/interactive half of the
        // same park, asserted separately above by `DataTableSortHeader`'s
        // own "Sorted by relevance" text, not re-asserted here).
        rerender(
          <DataTable
            data={ROWS}
            columns={sortableColumns}
            sort={undefined}
            sortDisabled
            onSortChange={vi.fn()}
          />,
        );
        expect(screen.getByRole("columnheader", { name: "Title" })).toHaveAttribute("aria-sort", "none");
      });

      // Developer-reported: with only the pin-boundary-specific borders
      // (`select`'s own `border-r`, `actions`' own `border-l`, the last-
      // pinned-left/first-pinned-right boundary pair), two ADJACENT
      // UNPINNED data columns had NO divider between them at all — one 1px
      // line between EVERY pair of adjacent columns, never doubled, never
      // missing (`resolveCellDividerClass`'s own doc comment in
      // `DataTable.tsx`).
      describe("column dividers (resolveCellDividerClass)", () => {
        const dividerColumns: ColumnDef<Row>[] = [
          { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
          { id: "fieldB", header: "Field B", cell: () => "b", size: 150, enableHiding: true },
          { id: "fieldC", header: "Field C", cell: () => "c", size: 150, enableHiding: true },
          { id: "fieldD", header: "Field D", cell: () => "d", size: 150, enableHiding: true },
          { id: "actions", header: "", cell: () => "⋯", enableHiding: false },
        ];
        const pinnedEntries = [
          { field: "fieldA", pinned: "left" as const },
          "fieldB",
          "fieldC",
          { field: "fieldD", pinned: "right" as const },
        ];

        it("the select column's own border-r is the ONLY divider against the first (pinned-left) column — no border-l doubling it", () => {
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              enableRowSelection
              selectedIds={[]}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          expect(screen.getByRole("columnheader", { name: "Field A" })).not.toHaveClass("border-l");
        });

        it("no doubled divider at the pinned-left/center boundary — the last pinned-left column's own border-r is the only line, the next (center) column draws no border-l", () => {
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              enableRowSelection
              selectedIds={[]}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          expect(screen.getByRole("columnheader", { name: "Field A" })).toHaveClass("border-r");
          expect(screen.getByRole("columnheader", { name: "Field B" })).not.toHaveClass("border-l");
        });

        it("draws a NEW divider between two adjacent UNPINNED center columns (the reported gap)", () => {
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              enableRowSelection
              selectedIds={[]}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          expect(screen.getByRole("columnheader", { name: "Field C" })).toHaveClass("border-l");
        });

        it("the first right-pinned column's own border-l (existing boundary rule) isn't duplicated by the generic rule, and the spacer before it draws NO border of its own (an earlier round's spacer border-l drew a SECOND line at this boundary)", () => {
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              enableRowSelection
              selectedIds={[]}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          expect(screen.getByRole("columnheader", { name: "Field D" })).toHaveClass("border-l");
          const spacer = document.querySelector('th[aria-hidden="true"]');
          expect(spacer).not.toBeNull();
          expect(spacer).not.toHaveClass("border-l");
          expect(spacer).not.toHaveClass("border-r");
        });

        it("the very first cell in the row draws no leading border-l when row selection is disabled (no select column, no left neighbour at all)", () => {
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          expect(screen.getByRole("columnheader", { name: "Field A" })).not.toHaveClass("border-l");
        });

        it("every data cell in a settled body row mirrors the SAME divider placement as its own header cell", () => {
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              enableRowSelection
              selectedIds={[]}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          const cells = screen.getAllByRole("cell", { name: "c" });
          expect(cells[0]).toHaveClass("border-l");
        });

        // Follow-up: the LAST unpinned column's own
        // resize grip sat at ITS OWN declared-width edge, but the spacer
        // (absorbing whatever slack remains before the pinned-right
        // group) could sit anywhere further right — a visible gap
        // between the grip and the TRUE boundary line. A later
        // bug (below, "no duplicate grip at the
        // pinned-right boundary") found that relocating the grip here
        // ALWAYS, even when the pinned-right boundary column is itself
        // resizable (like `fieldD`), landed a SECOND grip right next to
        // that column's own — so relocation into the spacer now only
        // happens when the boundary column does NOT already draw its
        // own (the `actions`-only case, covered separately below);
        // `fieldD` is real and resizable, so it owns this divider
        // directly and fieldC's grip is suppressed entirely, not
        // relocated.
        it("does not relocate into the spacer when the pinned-right boundary column is itself resizable — it already owns this divider", () => {
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              enableRowSelection
              selectedIds={[]}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          // fieldC (the last unpinned column before the spacer) draws no grip at
          // all — not at its own edge, not relocated — fieldD (pinned right, real,
          // resizable) already owns this divider via its own left-0 grip.
          const fieldCHeader = screen.getByRole("columnheader", { name: "Field C" });
          expect(fieldCHeader.querySelector('[role="separator"]')).toBeNull();

          const spacer = document.querySelector('th[aria-hidden="true"]')!;
          expect(spacer.querySelector('[role="separator"]')).toBeNull();

          const fieldDHeader = screen.getByRole("columnheader", { name: "Field D" });
          const ownHandle = fieldDHeader.querySelector('[role="separator"]');
          expect(ownHandle).not.toBeNull();
          expect(ownHandle).toHaveAttribute("aria-label", "Resize fieldD column");
        });

        it("dragging fieldD's own grip resizes fieldD, not the suppressed fieldC", async () => {
          const onColumnEntriesChange = vi.fn();
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              enableRowSelection
              selectedIds={[]}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={onColumnEntriesChange}
            />,
          );
          const fieldDHeader = screen.getByRole("columnheader", { name: "Field D" });
          const ownHandle = fieldDHeader.querySelector('[role="separator"]')!;
          ownHandle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, clientX: 100 }));
          document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 60 }));
          document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: 60 }));
          expect(onColumnEntriesChange).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ field: "fieldD", width: 190 })]),
          );
        });

        describe("resize handle value range", () => {
          const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
          const originalResizeObserver = globalThis.ResizeObserver;

          afterEach(() => {
            if (originalClientWidth) Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth);
            else Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
            globalThis.ResizeObserver = originalResizeObserver;
          });

          function stubContainerWidth(width: { value: number }): void {
            Object.defineProperty(HTMLElement.prototype, "clientWidth", {
              configurable: true,
              get: () => width.value,
            });
          }

          function renderFieldD(onColumnEntriesChange = vi.fn()) {
            render(
              <DataTable
                data={ROWS}
                columns={dividerColumns}
                enableRowSelection
                selectedIds={[]}
                columnEntries={pinnedEntries}
                onColumnEntriesChange={onColumnEntriesChange}
              />,
            );
            return screen.getByRole("columnheader", { name: "Field D" }).querySelector('[role="separator"]')!;
          }

          it("exposes the width as aria-valuenow, 60 as aria-valuemin and the unmeasured default 960 as aria-valuemax", () => {
            const handle = renderFieldD();
            expect(handle).toHaveAttribute("aria-valuenow", "150");
            expect(handle).toHaveAttribute("aria-valuemin", "60");
            expect(handle).toHaveAttribute("aria-valuemax", "960");
          });

          it("derives aria-valuemax from 90% of the measured table container width", () => {
            stubContainerWidth({ value: 1000 });
            const handle = renderFieldD();
            expect(handle).toHaveAttribute("aria-valuemax", "900");
          });

          it("recomputes aria-valuemax when the table container resizes", () => {
            const width = { value: 1000 };
            stubContainerWidth(width);
            const callbacks: ResizeObserverCallback[] = [];
            globalThis.ResizeObserver = class {
              constructor(callback: ResizeObserverCallback) {
                callbacks.push(callback);
              }
              observe() {}
              unobserve() {}
              disconnect() {}
            } as unknown as typeof ResizeObserver;
            const handle = renderFieldD();
            width.value = 500;
            act(() => {
              for (const callback of callbacks) callback([], {} as ResizeObserver);
            });
            expect(handle).toHaveAttribute("aria-valuemax", "450");
          });

          it("End commits the maximum width and Home commits the 60px minimum", () => {
            stubContainerWidth({ value: 1000 });
            const onColumnEntriesChange = vi.fn();
            const handle = renderFieldD(onColumnEntriesChange);
            fireEvent.keyDown(handle, { key: "End" });
            expect(onColumnEntriesChange).toHaveBeenLastCalledWith(
              expect.arrayContaining([expect.objectContaining({ field: "fieldD", width: 900 })]),
            );
            fireEvent.keyDown(handle, { key: "Home" });
            expect(onColumnEntriesChange).toHaveBeenLastCalledWith(
              expect.arrayContaining([expect.objectContaining({ field: "fieldD", width: 60 })]),
            );
          });

          it("a drag past the maximum commits the maximum, not the raw pointer width", () => {
            stubContainerWidth({ value: 400 });
            const onColumnEntriesChange = vi.fn();
            const handle = renderFieldD(onColumnEntriesChange);
            handle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, clientX: 600 }));
            document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 0 }));
            document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: 0 }));
            expect(onColumnEntriesChange).toHaveBeenCalledWith(
              expect.arrayContaining([expect.objectContaining({ field: "fieldD", width: 360 })]),
            );
          });
        });

        it("when there's no pinned-right group at all (no spacer), the last column's own grip stays at its own edge, unrelocated", () => {
          const unpinnedOnlyColumns: ColumnDef<Row>[] = [
            { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
            { id: "fieldB", header: "Field B", cell: () => "b", size: 150, enableHiding: true },
          ];
          render(<DataTable data={ROWS} columns={unpinnedOnlyColumns} />);
          expect(document.querySelector('th[aria-hidden="true"]')).toBeNull();
          const fieldBHeader = screen.getByRole("columnheader", { name: "Field B" });
          expect(fieldBHeader.querySelector('[role="separator"]')).not.toBeNull();
        });

        // Developer-reported follow-up: relocating the last-unpinned-
        // column's grip into the spacer, right next to `actions`' own
        // `border-l`, visually read as "the actions column has a resize
        // handle" — `actions` is NEVER resizable. No real pinned-right
        // DATA column in this fixture (just `actions`), so there's
        // nothing to flush the grip against anyway.
        it("does NOT relocate the last unpinned column's grip when the pinned-right group is EXCLUSIVELY the actions column (nothing ends up adjacent to actions)", () => {
          const actionsOnlyColumns: ColumnDef<Row>[] = [
            { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
            { id: "fieldB", header: "Field B", cell: () => "b", size: 150, enableHiding: true },
            { id: "fieldC", header: "Field C", cell: () => "c", size: 150, enableHiding: true },
            { id: "actions", header: "", cell: () => "⋯", enableHiding: false },
          ];
          render(<DataTable data={ROWS} columns={actionsOnlyColumns} />);
          const actionsHeader = screen.getByRole("columnheader", { name: "" });
          expect(actionsHeader.querySelector('[role="separator"]')).toBeNull();

          const spacer = document.querySelector('th[aria-hidden="true"]');
          expect(spacer?.querySelector('[role="separator"]')).toBeFalsy();

          // fieldC (the last unpinned column) keeps its OWN edge grip instead.
          const fieldCHeader = screen.getByRole("columnheader", { name: "Field C" });
          expect(fieldCHeader.querySelector('[role="separator"]')).not.toBeNull();
        });

        it("a real pinned-right data column owns the divider directly even when actions is ALSO pinned right after it (not just the actions-only case)", () => {
          render(
            <DataTable
              data={ROWS}
              columns={dividerColumns}
              enableRowSelection
              selectedIds={[]}
              columnEntries={pinnedEntries}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          const spacer = document.querySelector('th[aria-hidden="true"]')!;
          expect(spacer.querySelector('[role="separator"]')).toBeNull();
          const fieldDHeader = screen.getByRole("columnheader", { name: "Field D" });
          expect(fieldDHeader.querySelector('[role="separator"]')).toHaveAttribute(
            "aria-label",
            "Resize fieldD column",
          );
        });

        // Developer-reported audit: `isResizable` only ever excluded
        // `select`/`actions` — a column whose own `columnDef.enableResizing`
        // is explicitly `false` (a standard TanStack `ColumnDef` option)
        // still got a grip.
        it("never renders a grip for a column whose own enableResizing is false", () => {
          const columnsWithNonResizable: ColumnDef<Row>[] = [
            { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
            { id: "fieldB", header: "Field B", cell: () => "b", size: 150, enableResizing: false, enableHiding: true },
          ];
          render(<DataTable data={ROWS} columns={columnsWithNonResizable} />);
          expect(
            screen.getByRole("columnheader", { name: "Field B" }).querySelector('[role="separator"]'),
          ).toBeNull();
          // fieldA stays resizable — the audit scopes to the ONE column that opted out.
          expect(
            screen.getByRole("columnheader", { name: "Field A" }).querySelector('[role="separator"]'),
          ).not.toBeNull();
        });

        it("suppresses the preceding column's grip entirely (no relocation either) even with NO actions column at all — a real pinned-right data field alone already owns the boundary", () => {
          const pinnedRightNoActions: ColumnDef<Row>[] = [
            { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
            { id: "fieldB", header: "Field B", cell: () => "b", size: 150, enableHiding: true },
            { id: "fieldC", header: "Field C", cell: () => "c", size: 150, enableHiding: true },
          ];
          render(
            <DataTable
              data={ROWS}
              columns={pinnedRightNoActions}
              columnEntries={["fieldA", "fieldB", { field: "fieldC", pinned: "right" as const }]}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          const fieldBHeader = screen.getByRole("columnheader", { name: "Field B" });
          expect(fieldBHeader.querySelector('[role="separator"]')).toBeNull();
          const spacer = document.querySelector('th[aria-hidden="true"]')!;
          expect(spacer.querySelector('[role="separator"]')).toBeNull();
          const fieldCHeader = screen.getByRole("columnheader", { name: "Field C" });
          expect(fieldCHeader.querySelector('[role="separator"]')).toHaveAttribute(
            "aria-label",
            "Resize fieldC column",
          );
        });

        it("does not relocate a non-resizable column's own (non-existent) grip into the spacer, even when it's the column right before a real pinned-right group", () => {
          const nonResizableBeforePinned: ColumnDef<Row>[] = [
            { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
            { id: "fieldB", header: "Field B", cell: () => "b", size: 150, enableResizing: false, enableHiding: true },
            { id: "fieldC", header: "Field C", cell: () => "c", size: 150, enableHiding: true },
          ];
          render(
            <DataTable
              data={ROWS}
              columns={nonResizableBeforePinned}
              columnEntries={["fieldA", "fieldB", { field: "fieldC", pinned: "right" as const }]}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          const spacer = document.querySelector('th[aria-hidden="true"]');
          expect(spacer?.querySelector('[role="separator"]')).toBeFalsy();
        });
      });

      // Developer-reported: an unpinned (or pinned-left) column immediately
      // before the pinned-right group, and the pinned-right group's own
      // first column, each independently rendered a resize grip — TWO
      // `role="separator"` elements stacked on the SAME divider. The
      // pinned-right column's own (higher `resolveDividerZIndexClass`
      // tier) painted over the other, which never received a pointer
      // event — "one on the unpinned column's side (does nothing) and one
      // on the pinned column's side (works)". `isSuppressedByPinnedRightGrip`
      // (`DataTable.tsx`) makes the pinned-right column's own grip the
      // SOLE owner of this divider — mirrors `resolveCellDividerClass`'s
      // existing "exactly one owner" rule for borders, applied to grips.
      describe("exactly one resize grip per divider, never doubled at a pinned boundary (isSuppressedByPinnedRightGrip)", () => {
        const boundaryColumns: ColumnDef<Row>[] = [
          { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
          { id: "fieldB", header: "Field B", cell: () => "b", size: 150, enableHiding: true },
          { id: "fieldC", header: "Field C", cell: () => "c", size: 150, enableHiding: true },
        ];

        it("the pinned-right boundary has exactly one grip, not two — the preceding unpinned column's own grip is suppressed", () => {
          render(
            <DataTable
              data={ROWS}
              columns={boundaryColumns}
              columnEntries={["fieldA", "fieldB", { field: "fieldC", pinned: "right" as const }]}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          // fieldB sits immediately before fieldC (pinned right) — its own
          // grip is suppressed entirely, not relocated to the spacer either.
          expect(
            screen.getByRole("columnheader", { name: "Field B" }).querySelector('[role="separator"]'),
          ).toBeNull();
          expect(document.querySelector('th[aria-hidden="true"] [role="separator"]')).toBeNull();
          // fieldA's own grip (the fieldA↔fieldB divider, unrelated to the
          // pinned-right boundary) is untouched; fieldC (the pinned-right
          // boundary column) is the SOLE owner of the fieldB↔fieldC
          // divider — exactly one grip there, not two.
          const allSeparators = screen.getAllByRole("separator");
          expect(allSeparators.map((s) => s.getAttribute("aria-label"))).toEqual([
            "Resize fieldA column",
            "Resize fieldC column",
          ]);
        });

        it("the mirror pinned-LEFT boundary still has exactly one grip (unaffected, no regression) — the pinned-left column's own grip, on its own right edge, is already the sole owner", () => {
          render(
            <DataTable
              data={ROWS}
              columns={boundaryColumns}
              columnEntries={[{ field: "fieldA", pinned: "left" as const }, "fieldB", "fieldC"]}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          const allSeparators = screen.getAllByRole("separator");
          // One grip per divider: fieldA↔fieldB (fieldA's own, on its right
          // edge — pinned-left columns are NOT inverted, same side as an
          // unpinned column) and fieldB↔fieldC (fieldB's own) — NEVER
          // doubled at the fieldA↔fieldB pinned-left boundary specifically.
          // fieldC's own grip (trailing, at the table's own right edge —
          // unrelated to pin boundaries, pre-existing behavior for any
          // last resizable column) is the third.
          expect(allSeparators).toHaveLength(3);
          expect(allSeparators.map((s) => s.getAttribute("aria-label"))).toEqual([
            "Resize fieldA column",
            "Resize fieldB column",
            "Resize fieldC column",
          ]);
        });

        it("the degenerate case — a pinned-left column directly followed by a pinned-right column, no center column at all — still has exactly one grip at that shared boundary", () => {
          const twoColumnFixture: ColumnDef<Row>[] = [
            { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
            { id: "fieldC", header: "Field C", cell: () => "c", size: 150, enableHiding: true },
          ];
          render(
            <DataTable
              data={ROWS}
              columns={twoColumnFixture}
              columnEntries={[
                { field: "fieldA", pinned: "left" as const },
                { field: "fieldC", pinned: "right" as const },
              ]}
              onColumnEntriesChange={vi.fn()}
            />,
          );
          const allSeparators = screen.getAllByRole("separator");
          expect(allSeparators).toHaveLength(1);
          expect(allSeparators[0]).toHaveAttribute("aria-label", "Resize fieldC column");
        });

        it("dragging the pinned-right column's own grip resizes IT, never the suppressed preceding column", () => {
          const onColumnEntriesChange = vi.fn();
          render(
            <DataTable
              data={ROWS}
              columns={boundaryColumns}
              columnEntries={["fieldA", "fieldB", { field: "fieldC", pinned: "right" as const, width: 150 }]}
              onColumnEntriesChange={onColumnEntriesChange}
            />,
          );
          const handle = screen.getByRole("separator", { name: "Resize fieldC column" });
          // Pinned-right columns resize inverted (drag LEFT to grow, anchored
          // to the frame's right edge) — same mechanics the live "Status"
          // column repro confirmed (80px left drag → +80px width).
          handle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, clientX: 200 }));
          document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 120 }));
          document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: 120 }));
          expect(onColumnEntriesChange).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ field: "fieldC", width: 230 })]),
          );
          expect(onColumnEntriesChange).not.toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ field: "fieldB" })]),
          );
        });
      });

      // Developer-reported: the resize handle itself is invisible until
      // hovered/focused/dragged, giving no indication a column is
      // resizable at all — a small, ALWAYS-VISIBLE grip mark fixes that,
      // deliberately a single isolated element/class (`RESIZE_GRIP_CLASS`
      // in `DataTable.tsx`) so a later removal is trivial.
      it("renders an always-visible grip mark on a resizable column's header, with no hover/focus/drag needed", () => {
        const sortableColumns: ColumnDef<Row>[] = [
          { accessorKey: "title", header: "Title", enableSorting: false, meta: { label: "Title" } },
        ];
        render(<DataTable data={ROWS} columns={sortableColumns} />);
        const handle = screen.getByRole("separator", { name: "Resize Title column" });
        const grip = handle.querySelector("div[aria-hidden='true']");
        expect(grip).not.toBeNull();
      });

      // Developer-reported: "so it's clear which line moves" — hovering/
      // focusing/dragging ONE column's resize handle must highlight that
      // SAME column's divider in EVERY row (header + every body row), not
      // just the header's own handle.
      it("hovering a column's resize handle activates the SAME column's divider highlight in both the header and a settled body row", async () => {
        const user = userEvent.setup();
        const sortableColumns: ColumnDef<Row>[] = [
          { accessorKey: "title", header: "Title", enableSorting: false, meta: { label: "Title" } },
        ];
        render(<DataTable data={ROWS} columns={sortableColumns} />);
        const handle = screen.getByRole("separator", { name: "Resize Title column" });

        const headerCell = screen.getByRole("columnheader", { name: "Title" });
        const bodyCell = screen.getAllByRole("cell", { name: ROWS[0]!.title })[0]!;
        const headerHighlight = headerCell.querySelector("div[data-active]")!;
        const bodyHighlight = bodyCell.querySelector("div[data-active]")!;
        expect(headerHighlight).toHaveAttribute("data-active", "false");
        expect(bodyHighlight).toHaveAttribute("data-active", "false");

        await user.hover(handle);
        expect(headerHighlight).toHaveAttribute("data-active", "true");
        expect(bodyHighlight).toHaveAttribute("data-active", "true");

        await user.unhover(handle);
        expect(headerHighlight).toHaveAttribute("data-active", "false");
        expect(bodyHighlight).toHaveAttribute("data-active", "false");
      });

      // Developer-reported: an UNPINNED column's grip/handle/highlight
      // painted OVER a sticky (pinned/select/actions) cell during
      // horizontal scroll instead of sliding underneath it — a deliberate
      // low z-index (`z-[1]`/`z-[2]`) for an unpinned column, the
      // EXISTING higher one (`z-10`/`z-20`, safe — `position: sticky`
      // always isolates its own stacking context) for a pinned one.
      it("gives an UNPINNED column's resize handle a LOW z-index, below a PINNED column's own (which keeps its existing z-20)", () => {
        const dividerColumns: ColumnDef<Row>[] = [
          { id: "fieldA", header: "Field A", cell: () => "a", size: 150, enableHiding: true },
          { id: "fieldB", header: "Field B", cell: () => "b", size: 150, enableHiding: true },
        ];
        render(
          <DataTable
            data={ROWS}
            columns={dividerColumns}
            columnEntries={[{ field: "fieldA", pinned: "left" as const }, "fieldB"]}
            onColumnEntriesChange={vi.fn()}
          />,
        );
        const pinnedHandle = screen.getByRole("separator", { name: "Resize fieldA column" });
        const unpinnedHandle = screen.getByRole("separator", { name: "Resize fieldB column" });
        expect(pinnedHandle).toHaveClass("z-20");
        expect(unpinnedHandle).toHaveClass("z-[2]");
      });

      it("hides the Load button when isDone, shows it and forwards clicks to onLoadMore otherwise", async () => {
        const user = userEvent.setup();
        const onLoadMore = vi.fn();
        const { rerender } = render(
          <DataTable data={ROWS} columns={COLUMNS} isDone={false} onLoadMore={onLoadMore} pageSize={25} />,
        );
        await user.click(screen.getByRole("button", { name: "Load 25 more" }));
        expect(onLoadMore).toHaveBeenCalledTimes(1);

        rerender(<DataTable data={ROWS} columns={COLUMNS} isDone />);
        expect(screen.queryByRole("button", { name: "Load 25 more" })).not.toBeInTheDocument();
      });

      it("shows the capped-count footer status line and 'That's everything' once done", () => {
        const { rerender } = render(
          <DataTable data={ROWS} columns={COLUMNS} isDone totalCount={42} />,
        );
        expect(screen.getByText(/Showing 3 of 42/)).toBeInTheDocument();
        expect(screen.getByText("That's everything")).toBeInTheDocument();

        rerender(<DataTable data={ROWS} columns={COLUMNS} isDone totalDocsCapped totalCount={1000} />);
        expect(screen.getByText(/Showing 3 of 1,000\+/)).toBeInTheDocument();

        rerender(<DataTable data={ROWS} columns={COLUMNS} isDone />);
        expect(screen.getByText(`Showing ${ROWS.length}`)).toBeInTheDocument();
      });

      it("adds a checkbox column only when enableRowSelection is true, and reflects the controlled selectedIds prop", async () => {
        const user = userEvent.setup();
        const { rerender, container } = render(<DataTable data={ROWS} columns={COLUMNS} />);
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);

        rerender(<DataTable data={ROWS} columns={COLUMNS} enableRowSelection selectedIds={[]} />);
        // Header "select all" + one per row.
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes).toHaveLength(ROWS.length + 1);
        // Base UI's visible `role="checkbox"` span handles clicks via a `PointerEvent`
        // jsdom doesn't implement — same gap `checkbox/Input.test.tsx` documents. Drive
        // the interaction through the hidden native `<input type="checkbox">` instead,
        // which the visible span's own `aria-checked` state does reflect.
        const hiddenInputs = container.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]',
        );
        expect(hiddenInputs).toHaveLength(ROWS.length + 1);
        expect(checkboxes[1]).not.toBeChecked();

        // A controlled component: toggling the native input reports the change but does not
        // check itself — only passing the new `selectedIds` back checks it.
        await user.click(hiddenInputs[1]!);
        expect(checkboxes[1]).not.toBeChecked();
        rerender(
          <DataTable data={ROWS} columns={COLUMNS} enableRowSelection selectedIds={["doc_1"]} />,
        );
        expect(screen.getAllByRole("checkbox")[1]).toBeChecked();
      });

      it("names the select-all header checkbox and names each row checkbox by its row id", () => {
        render(<DataTable data={ROWS} columns={COLUMNS} enableRowSelection selectedIds={[]} />);
        expect(screen.getByRole("checkbox", { name: "Select all rows" })).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Select row doc_1" })).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Select row doc_2" })).toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Select row doc_3" })).toBeInTheDocument();
      });

      /**
       * Selects the first data row through the hidden native `<input type="checkbox">` —
       * the same jsdom `PointerEvent` gap the checkbox-column test above documents.
       *
       * @param container - The rendered `DataTable`'s container.
       * @param user - The `userEvent` session to click with.
       */
      async function selectFirstRow(container: HTMLElement, user: UserEvent) {
        const hiddenInputs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        await user.click(hiddenInputs[1]!);
      }

      it("calls onSelectionChange with the row's _id when toggled", async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        const { container } = render(
          <DataTable
            data={ROWS}
            columns={COLUMNS}
            enableRowSelection
            selectedIds={[]}
            onSelectionChange={onSelectionChange}
          />,
        );
        await selectFirstRow(container, user);
        expect(onSelectionChange).toHaveBeenLastCalledWith(["doc_1"]);
      });

      it("keyed by _id: a selectedIds entry for a row no longer in data renders no checked row and is dropped on the next real toggle", async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        const { container, rerender } = render(
          <DataTable
            data={ROWS.slice(0, 1)}
            columns={COLUMNS}
            enableRowSelection
            selectedIds={["doc_1", "doc_3"]}
            onSelectionChange={onSelectionChange}
          />,
        );
        // `doc_3` isn't in `data` — it renders no row, so there is nothing stale to show
        // checked at the wrong index; `doc_1`'s own row renders checked correctly.
        expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 data row
        expect(screen.getAllByRole("checkbox")[1]).toBeChecked();

        rerender(
          <DataTable
            data={ROWS}
            columns={COLUMNS}
            enableRowSelection
            selectedIds={["doc_1", "doc_3"]}
            onSelectionChange={onSelectionChange}
          />,
        );
        // Deselecting `doc_1` reports the remaining selection, `doc_3` included — this
        // table has no opinion on whether `doc_3` is still a real row; `ListViewLayout`'s own
        // `selectedDocs` filter (and each built-in's own post-mutation cleanup) is what
        // keeps a caller's `selectedIds` from outliving a deleted row.
        await selectFirstRow(container, user);
        expect(onSelectionChange).toHaveBeenLastCalledWith(["doc_3"]);
      });

      it("spreads getRowProps onto each row's <tr>, including onDoubleClick (this prop was declared but never wired at all)", () => {
        const onPointerEnter = vi.fn();
        const onDoubleClick = vi.fn();
        render(
          <DataTable
            data={ROWS}
            columns={COLUMNS}
            getRowProps={(row) => ({
              onPointerEnter: () => onPointerEnter(row._id),
              onDoubleClick: () => onDoubleClick(row._id),
            })}
          />,
        );
        const firstDataRow = screen.getAllByRole("row")[1]!; // [0] is the header row
        fireEvent.pointerEnter(firstDataRow);
        fireEvent.doubleClick(firstDataRow);
        expect(onPointerEnter).toHaveBeenCalledWith("doc_1");
        expect(onDoubleClick).toHaveBeenCalledWith("doc_1");
      });

      it("sets data-state=\"highlighted\" on the row matching highlightedRowId, cleared when it no longer matches", () => {
        const { rerender } = render(
          <DataTable data={ROWS} columns={COLUMNS} highlightedRowId="doc_1" />,
        );
        const rows = screen.getAllByRole("row").slice(1); // drop the header row
        expect(rows[0]).toHaveAttribute("data-state", "highlighted");
        expect(rows[1]).not.toHaveAttribute("data-state");

        rerender(<DataTable data={ROWS} columns={COLUMNS} highlightedRowId={undefined} />);
        expect(screen.getAllByRole("row").slice(1)[0]).not.toHaveAttribute("data-state");
      });

      it("selected takes precedence over highlighted — a row both selected and highlighted reports data-state=\"selected\"", () => {
        render(
          <DataTable
            data={ROWS}
            columns={COLUMNS}
            enableRowSelection
            selectedIds={["doc_1"]}
            onSelectionChange={() => {}}
            highlightedRowId="doc_1"
          />,
        );
        const firstDataRow = screen.getAllByRole("row")[1]!;
        expect(firstDataRow).toHaveAttribute("data-state", "selected");
      });

      describe("isInteractiveRowTarget", () => {
        it("is true for a button, a link, an input, or a [role=checkbox], and anything nested inside one", () => {
          const button = document.createElement("button");
          const span = document.createElement("span");
          button.appendChild(span);
          const link = document.createElement("a");
          const input = document.createElement("input");
          const checkboxRole = document.createElement("div");
          checkboxRole.setAttribute("role", "checkbox");

          expect(isInteractiveRowTarget(button)).toBe(true);
          expect(isInteractiveRowTarget(span)).toBe(true); // nested inside the button
          expect(isInteractiveRowTarget(link)).toBe(true);
          expect(isInteractiveRowTarget(input)).toBe(true);
          expect(isInteractiveRowTarget(checkboxRole)).toBe(true);
        });

        it("is false for a plain cell element, and for null", () => {
          const cell = document.createElement("td");
          expect(isInteractiveRowTarget(cell)).toBe(false);
          expect(isInteractiveRowTarget(null)).toBe(false);
        });
      });
    });
  }

  if (only.includes("DataTableBulkActions")) {
    describe("DataTableBulkActions", () => {
      /**
       * Renders the bar with spies for both callbacks.
       *
       * @param props - Per-test overrides; `selectedCount` defaults to 1.
       * @returns The `onDelete` and `onClear` spies.
       */
      function renderBar(props: { selectedCount?: number; isDeleting?: boolean } = {}) {
        const onDelete = vi.fn();
        const onClear = vi.fn();
        render(
          <DataTableBulkActions
            selectedCount={props.selectedCount ?? 1}
            onDelete={onDelete}
            onClear={onClear}
            isDeleting={props.isDeleting}
          />,
        );
        return { onDelete, onClear };
      }

      it("renders nothing when selectedCount is 0", () => {
        renderBar({ selectedCount: 0 });
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });

      it("singularizes at 1 and pluralizes above", () => {
        const { rerender } = render(
          <DataTableBulkActions selectedCount={1} onDelete={vi.fn()} onClear={vi.fn()} />,
        );
        expect(screen.getByText("1 item selected")).toBeInTheDocument();
        rerender(<DataTableBulkActions selectedCount={3} onDelete={vi.fn()} onClear={vi.fn()} />);
        expect(screen.getByText("3 items selected")).toBeInTheDocument();
      });

      it("calls onDelete from Delete and onClear from Clear", async () => {
        const user = userEvent.setup();
        const { onDelete, onClear } = renderBar();
        await user.click(screen.getByRole("button", { name: "Delete" }));
        expect(onDelete).toHaveBeenCalledTimes(1);
        await user.click(screen.getByRole("button", { name: "Clear" }));
        expect(onClear).toHaveBeenCalledTimes(1);
      });

      it("disables both buttons while isDeleting is true", () => {
        renderBar({ isDeleting: true });
        expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
      });
    });
  }

  if (only.includes("DataTableBulkDeleteModal")) {
    describe("DataTableBulkDeleteModal (DataTableBulkDeleteModal)", () => {
      /**
       * Renders `DataTableBulkDeleteModal` open, with three selected "posts" by default.
       *
       * @param props - Per-test overrides applied over the shared defaults.
       * @returns The `onOpenChange` and `onConfirm` spies passed to the modal.
       */
      function renderModal(props: Partial<DataTableBulkDeleteModalProps> = {}) {
        const onOpenChange = vi.fn();
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        render(
          <DataTableBulkDeleteModal
            open
            onOpenChange={onOpenChange}
            selectedCount={3}
            onConfirm={onConfirm}
            entityName="posts"
            {...props}
          />,
        );
        return { onOpenChange, onConfirm };
      }

      it("titles and describes the confirmation with the selected count and entity name", () => {
        renderModal();
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(screen.getByText("Delete 3 posts?")).toBeInTheDocument();
        expect(screen.getByText(/permanently delete/)).toBeInTheDocument();
      });

      it("singularizes entityName in the title when selectedCount is 1", () => {
        renderModal({ selectedCount: 1 });
        expect(screen.getByText("Delete 1 post?")).toBeInTheDocument();
      });

      it("calls onConfirm when the destructive action is clicked", async () => {
        const user = userEvent.setup();
        const { onConfirm } = renderModal();
        await user.click(screen.getByRole("button", { name: "Delete" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });

      it("calls onOpenChange(false) when Cancel is clicked, without calling onConfirm", async () => {
        const user = userEvent.setup();
        const { onOpenChange, onConfirm } = renderModal();
        await user.click(screen.getByRole("button", { name: "Cancel" }));
        // Base UI's `Dialog.Close` calls `onOpenChange(false, eventDetails)` — only the
        // first argument is this component's own contract.
        expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
        expect(onConfirm).not.toHaveBeenCalled();
      });

      it("disables both actions and relabels the destructive action while isDeleting", () => {
        renderModal({ isDeleting: true });
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
      });
    });
  }
}
