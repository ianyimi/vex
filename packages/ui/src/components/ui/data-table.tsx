"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Base path for link columns (e.g., "/admin") */
  basePath?: string;
  /** Collection slug — used to build edit links for isTitle columns */
  collectionSlug?: string;
  /** Render when the table has no data */
  emptyMessage?: string;
  /** Callback to load more data (called by parent, not DataTable itself) */
  onLoadMore?: () => void;
  /** Whether more data can be loaded from the server */
  canLoadMore?: boolean;
  /** Number of rows per page. Defaults to 10. */
  pageSize?: number;
  /** Callback fired when the page index changes */
  onPageChange?: (pageIndex: number) => void;
}

function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  basePath,
  collectionSlug,
  emptyMessage = "No results.",
  canLoadMore,
  pageSize = 10,
  onPageChange,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  const handlePreviousPage = () => {
    table.previousPage();
    onPageChange?.(table.getState().pagination.pageIndex - 1);
  };

  const handleNextPage = () => {
    table.nextPage();
    onPageChange?.(table.getState().pagination.pageIndex + 1);
  };

  return (
    <div data-slot="data-table" className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const isTitle = (cell.column.columnDef.meta as any)
                      ?.isTitle;
                    const cellValue = flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    );

                    if (isTitle && basePath && collectionSlug) {
                      const docId = row.original._id as string;
                      const href = `${basePath}/${collectionSlug}/${docId}`;
                      return (
                        <TableCell key={cell.id}>
                          <a
                            href={href}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {cellValue}
                          </a>
                        </TableCell>
                      );
                    }

                    return <TableCell key={cell.id}>{cellValue}</TableCell>;
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={handlePreviousPage}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              onClick={handleNextPage}
              disabled={!table.getCanNextPage() && !canLoadMore}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable, type DataTableProps };
