"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";
import { VexDocument } from "@vexcms/core";
import { useMemo, useState } from "react";
import { Checkbox } from "../checkbox";
import { Button } from "../button";
import { BulkDeleteModal } from "./DeleteManyModal";

/**
 * Props for DataTable component.
 *
 * @typeParam TData - Row data type (must have `_id` field for selection)
 *
 * **Defaults:**
 * - `isDone`: true
 * - `isLoadingMore`: false
 * - `enableRowSelection`: false
 * - `enableBulkActions`: false
 * - `entityName`: "items"
 * - `isDeleting`: false
 * - `isLoading`: false
 */
export interface DataTableProps<TData extends { _id: string }> {
  /** Array of data to display in table rows. */
  data: TData[];

  /** TanStack Table column definitions. */
  columns: ColumnDef<TData>[];

  // Load More pagination

  /**
   * Whether all results have been loaded.
   * When `true`, Load More button is hidden.
   */
  isDone?: boolean;

  /**
   * Callback when Load More button is clicked.
   * Parent should fetch next page and append to data.
   */
  onLoadMore?: () => void;

  /**
   * Whether Load More query is in flight.
   * Shows loading state on button.
   */
  isLoadingMore?: boolean;

  /**
   * Total count of documents across all pages.
   *
   * - `number` when count succeeded
   * - `null` when collection has >32k documents
   * - `undefined` when count not requested
   *
   * Used to show "All X items loaded" message.
   */
  totalCount?: number | null;

  // Features

  /** Enable checkbox column for row selection. */
  enableRowSelection?: boolean;

  /**
   * Enable bulk action bar when rows are selected.
   * Requires `enableRowSelection=true` to work.
   */
  enableBulkActions?: boolean;

  // Bulk actions

  /**
   * Entity name for UI labels (e.g., "posts", "files").
   * Used in bulk delete modal: "Delete 5 posts?"
   */
  entityName?: string;

  /**
   * Callback when bulk delete is confirmed.
   * Receives array of selected document IDs.
   */
  onBulkDelete?: (selectedIds: string[]) => Promise<void>;

  /**
   * Whether bulk delete mutation is in flight.
   * Disables bulk action buttons during deletion.
   */
  isDeleting?: boolean;

  // Loading

  /**
   * Whether initial data is loading.
   * Shows loading skeleton in table body.
   */
  isPending?: boolean;
}

/**
 * Generic data table component with Load More pagination, row selection, and bulk actions.
 *
 * Built on TanStack Table. Parent component provides accumulated results and Load More handler.
 * Displays checkbox column when selection enabled, bulk action bar when items selected,
 * and Load More button when more results available.
 *
 * @typeParam TData - Row data type (must have `_id` field for selection)
 * @param props - Component props
 * @returns Data table UI
 *
 * @example
 * ```tsx
 * // Define columns
 * const columns: ColumnDef<Post>[] = [
 *   { accessorKey: "title", header: "Title" },
 *   { accessorKey: "author", header: "Author" },
 * ];
 *
 * // Use with pagination hook
 * const pagination = usePaginatedCollection({
 *   collection: "posts",
 *   initialNumItems: 100,
 * });
 *
 * const handleBulkDelete = async (ids: string[]) => {
 *   await removeMutation.mutateAsync({ ids });
 *   // Invalidate queries to refresh
 * };
 *
 * <DataTable
 *   data={pagination.results}
 *   columns={columns}
 *   isDone={pagination.isDone}
 *   onLoadMore={() => pagination.loadMore(100)}
 *   isLoadingMore={pagination.isLoading}
 *   totalCount={pagination.totalCount}
 *   enableRowSelection={true}
 *   enableBulkActions={true}
 *   onBulkDelete={handleBulkDelete}
 *   isDeleting={removeMutation.isPending}
 *   entityName="posts"
 * />
 * ```
 *
 * @see {@link react/src!usePaginatedQuery} - Hook for managing pagination state
 * @see DataTableBulkActions - Bulk action bar component (exported for callers to
 *   render themselves; not yet wired into this component's own selection UI).
 * @see {@link BulkDeleteModal} - Confirmation modal component
 */
export function DataTable<TData extends VexDocument>({
  data,
  columns: baseColumns,

  isDone = true,
  onLoadMore,
  isLoadingMore = false,
  totalCount,

  enableRowSelection,
  enableBulkActions,

  entityName = "items",
  onBulkDelete,
  isDeleting = false,
}: DataTableProps<TData>) {
  // Row selection state (TanStack Table)
  const [rowSelection, setRowSelection] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Add checkbox column if row selection enabled
  const columns = useMemo(() => {
    if (!enableRowSelection) return baseColumns;

    const checkboxColumn: ColumnDef<TData> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    };

    return [checkboxColumn, ...baseColumns];
  }, [baseColumns, enableRowSelection]);

  const table = useReactTable({
    data,
    columns,

    // Row selection
    enableRowSelection,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,

    // Core
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original._id);

  async function handleBulkDelete() {
    const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original._id);
    if (!onBulkDelete || selectedIds.length === 0) return;
    await onBulkDelete(selectedIds);
    setRowSelection({});
    setDeleteModalOpen(false);
  }

  return (
    <div className="grid place-items-center overflow-x-auto rounded-md border">
      {/* Bulk actions bar */}
      {/* {enableBulkActions && selectedIds.length > 0 && ( */}
      {/*   <DataTableBulkActions */}
      {/*     selectedCount={selectedIds.length} */}
      {/*     onDelete={() => setDeleteModalOpen(true)} */}
      {/*     isDeleting={isDeleting} */}
      {/*   /> */}
      {/* )} */}

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Load More button */}
      {!isDone && (
        <div className="flex justify-center py-4">
          <Button onClick={onLoadMore} variant="outline" isPending={isLoadingMore}>
            Load More
          </Button>
        </div>
      )}

      {/* All loaded message */}
      {isDone && data.length > 0 && (
        <p className="text-muted-foreground py-4 text-center text-sm">
          {totalCount !== null && totalCount !== undefined ? (
            <>
              All {totalCount.toLocaleString()} {entityName} loaded
            </>
          ) : (
            <>
              All {data.length.toLocaleString()} {entityName} loaded
            </>
          )}
        </p>
      )}

      {/* Delete confirmation modal */}
      {enableBulkActions && (
        <BulkDeleteModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          selectedCount={selectedIds.length}
          onConfirm={handleBulkDelete}
          isDeleting={isDeleting}
          entityName={entityName}
        />
      )}
    </div>
  );
}
