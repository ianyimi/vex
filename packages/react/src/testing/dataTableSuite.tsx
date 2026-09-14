import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import type { VexDocument } from "@vexcms/core";

import { DataTable } from "../components/ui/data-table/DataTable";
import { DataTableBulkActions } from "../components/ui/data-table/DataTableBulkActions";
import { BulkDeleteModal, type BulkDeleteModalProps } from "../components/ui/data-table/DeleteManyModal";

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
 * header rendering, Load-More wiring, row-selection checkbox column, and the bulk-actions
 * bar it renders while rows are selected; `DataTableBulkActions`'s count/callback contract;
 * and `DeleteManyModal`'s (`BulkDeleteModal`) confirm/cancel wiring.
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

      it("renders no bulk-actions bar while nothing is selected", () => {
        render(
          <DataTable data={ROWS} columns={COLUMNS} enableRowSelection enableBulkActions onBulkDelete={vi.fn()} />,
        );
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });

      it("selecting a row reveals the bar, and confirming deletes exactly the selected ids", async () => {
        const user = userEvent.setup();
        const onBulkDelete = vi.fn().mockResolvedValue(undefined);
        const { container } = render(
          <DataTable data={ROWS} columns={COLUMNS} enableRowSelection enableBulkActions onBulkDelete={onBulkDelete} />,
        );
        await selectFirstRow(container, user);
        expect(screen.getByText("1 item selected")).toBeInTheDocument();

        // The bar's Delete opens the modal; the modal's own Delete confirms. Both are
        // named "Delete", so scope the second click to the alertdialog.
        await user.click(screen.getByRole("button", { name: "Delete" }));
        const modal = screen.getByRole("alertdialog");
        await user.click(within(modal).getByRole("button", { name: "Delete" }));

        expect(onBulkDelete).toHaveBeenCalledWith(["doc_1"]);
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });

      it("clear drops the selection and hides the bar", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <DataTable data={ROWS} columns={COLUMNS} enableRowSelection enableBulkActions onBulkDelete={vi.fn()} />,
        );
        await selectFirstRow(container, user);
        await user.click(screen.getByRole("button", { name: "Clear" }));
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });

      it("renders no bar without a bulk-delete handler, even with bulk actions enabled", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <DataTable data={ROWS} columns={COLUMNS} enableRowSelection enableBulkActions />,
        );
        await selectFirstRow(container, user);
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
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
