import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import type { VexDocument } from "@vexcms/core";

import { DataTable } from "../components/ui/data-table/DataTable";
import { DataTableBulkActions } from "../components/ui/data-table/DataTableBulkActions";
import { BulkDeleteModal, type BulkDeleteModalProps } from "../components/ui/data-table/DeleteManyModal";
import { useTableSelection } from "../hooks";
import type { UseTableSelectionReturn } from "../hooks/useTableSelection";

/** One member per `ui/data-table` file this suite covers. */
export type DataTableSuiteMember =
  | "DataTable"
  | "DataTableBulkActions"
  | "DeleteManyModal";

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
 * header rendering, Load-More wiring, and row-selection checkbox column;
 * `DataTableBulkActions`'s selection summary wired to a real `useTableSelection`; and
 * `DeleteManyModal`'s (`BulkDeleteModal`) confirm/cancel wiring.
 *
 * @param options - Which members to run; defaults to all three.
 */
export function runDataTableSuite(options?: DataTableSuiteOptions): void {
  const only = options?.only ?? [
    "DataTable",
    "DataTableBulkActions",
    "DeleteManyModal",
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

      it("hides Load More when isDone, shows it and forwards clicks to onLoadMore otherwise", async () => {
        const user = userEvent.setup();
        const onLoadMore = vi.fn();
        const { rerender } = render(
          <DataTable data={ROWS} columns={COLUMNS} isDone={false} onLoadMore={onLoadMore} />,
        );
        await user.click(screen.getByRole("button", { name: "Load More" }));
        expect(onLoadMore).toHaveBeenCalledTimes(1);

        rerender(<DataTable data={ROWS} columns={COLUMNS} isDone />);
        expect(screen.queryByRole("button", { name: "Load More" })).not.toBeInTheDocument();
      });

      it("shows the all-loaded message using totalCount when given, else data.length", () => {
        const { rerender } = render(
          <DataTable data={ROWS} columns={COLUMNS} isDone totalCount={42} entityName="posts" />,
        );
        expect(screen.getByText(/All 42 posts loaded/)).toBeInTheDocument();

        rerender(<DataTable data={ROWS} columns={COLUMNS} isDone entityName="posts" />);
        expect(screen.getByText(`All ${ROWS.length} posts loaded`)).toBeInTheDocument();
      });

      it("adds a checkbox column only when enableRowSelection is true, and toggling one checks it", async () => {
        const user = userEvent.setup();
        const { rerender, container } = render(<DataTable data={ROWS} columns={COLUMNS} />);
        expect(screen.queryAllByRole("checkbox")).toHaveLength(0);

        rerender(<DataTable data={ROWS} columns={COLUMNS} enableRowSelection />);
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
        await user.click(hiddenInputs[1]!);
        expect(checkboxes[1]).toBeChecked();
      });

      // `DataTable`'s own bulk-delete trigger is unreachable through its rendered UI —
      // `DataTableBulkActions` is only ever imported by this file in a commented-out
      // block (DataTable.tsx:227-233, matching its own `@see` JSDoc: "not yet wired
      // into this component's own selection UI"), and nothing else ever calls
      // `setDeleteModalOpen(true)`. `handleBulkDelete`'s logic and `BulkDeleteModal`'s
      // own confirm/cancel wiring are each covered directly by their own describe
      // blocks below instead of through this unreachable path.
    });
  }

  if (only.includes("DataTableBulkActions")) {
    describe("DataTableBulkActions", () => {
      /**
       * Runs a real `useTableSelection` through zero or more mutating `steps`, each in
       * its own `act()` — `toggleRow`/`toggleInverseMode` close over `mode` from the
       * render that created them, so two calls batched into one `act()` would both see
       * the pre-update `mode` and only the last write would win — then renders
       * `DataTableBulkActions` against the resulting state.
       *
       * @param steps - Mutating calls against the live selection, applied in order.
       * @returns The final selection state, an `onDelete` spy, and `rerender` for
       *   re-rendering after further state changes.
       */
      function renderWithSelection(
        ...steps: Array<(selection: UseTableSelectionReturn) => void>
      ) {
        const hook = renderHook(() => useTableSelection({ totalCount: ROWS.length }));
        for (const step of steps) {
          act(() => step(hook.result.current));
        }
        const onDelete = vi.fn();
        const view = render(
          <DataTableBulkActions selection={hook.result.current} onDelete={onDelete} />,
        );
        return { hook, onDelete, rerender: view.rerender };
      }

      it("renders nothing when no rows are selected", () => {
        renderWithSelection();
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });

      it("pluralizes the selection count and shows the (all in table) qualifier in all mode", () => {
        renderWithSelection((selection) => selection.toggleSelectAll());
        expect(screen.getByText(`${ROWS.length} items selected`)).toBeInTheDocument();
        expect(screen.getByText("(all in table)")).toBeInTheDocument();
      });

      it("shows the (inverse mode) qualifier for exactly one excluded item", () => {
        renderWithSelection(
          (selection) => selection.toggleInverseMode(),
          (selection) => selection.toggleRow("doc_1"),
        );
        expect(screen.getByText("(inverse mode)")).toBeInTheDocument();
      });

      it("calls onDelete when Delete is clicked and clearSelection when Clear is clicked", async () => {
        const user = userEvent.setup();
        const { hook, onDelete, rerender } = renderWithSelection((s) => s.selectPage(["doc_1"]));
        await user.click(screen.getByRole("button", { name: /Delete/ }));
        expect(onDelete).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", { name: /Clear/ }));
        // `clearSelection` updated the hook's OWN state, not the already-rendered
        // component's props — re-render with the fresh `hook.result.current` to see it.
        rerender(<DataTableBulkActions selection={hook.result.current} onDelete={onDelete} />);
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });

      it("disables both buttons while isDeleting is true", () => {
        const { result } = renderHook(() => useTableSelection({ totalCount: ROWS.length }));
        act(() => result.current.selectPage(["doc_1"]));
        render(<DataTableBulkActions selection={result.current} onDelete={vi.fn()} isDeleting />);
        expect(screen.getByRole("button", { name: /Delete/ })).toBeDisabled();
        expect(screen.getByRole("button", { name: /Clear/ })).toBeDisabled();
      });
    });
  }

  if (only.includes("DeleteManyModal")) {
    describe("DeleteManyModal (BulkDeleteModal)", () => {
      /**
       * Renders `BulkDeleteModal` open, with three selected "posts" by default.
       *
       * @param props - Per-test overrides applied over the shared defaults.
       * @returns The `onOpenChange` and `onConfirm` spies passed to the modal.
       */
      function renderModal(props: Partial<BulkDeleteModalProps> = {}) {
        const onOpenChange = vi.fn();
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        render(
          <BulkDeleteModal
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
