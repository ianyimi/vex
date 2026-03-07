"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { cn } from "../../styles/utils";

import React from "react";

function getAlign(meta: unknown): string | undefined {
  return (meta as any)?.align;
}

function AlignWrapper({
  align,
  children,
}: {
  align: string | undefined;
  children: React.ReactNode;
}) {
  if (!align || align === "left") return <>{children}</>;
  return (
    <div
      className={cn(
        "flex w-full",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
      )}
    >
      {children}
    </div>
  );
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Base path for link columns (e.g., "/admin") */
  basePath?: string;
  /** Collection slug — used to build edit links for isTitle columns */
  collectionSlug?: string;
  /** Render when the table has no data */
  emptyMessage?: string;
  /** Whether more data can be loaded from the server */
  canLoadMore?: boolean;
  /** Number of rows per page. Defaults to 10. */
  pageSize?: number;
  /** Controlled page index (0-based) */
  pageIndex?: number;
  /** Callback fired when the page index changes */
  onPageChange?: (pageIndex: number) => void;
  /** Total document count from the server (enables accurate page count) */
  totalCount?: number;
}

function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  basePath,
  collectionSlug,
  emptyMessage = "No results.",
  canLoadMore,
  pageSize = 10,
  pageIndex: controlledPageIndex,
  onPageChange,
  totalCount,
}: DataTableProps<TData>) {
  const pagination: PaginationState = {
    pageIndex: controlledPageIndex ?? 0,
    pageSize,
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    state: {
      pagination,
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      onPageChange?.(next.pageIndex);
    },
  });

  const totalPageCount =
    totalCount != null
      ? Math.ceil(totalCount / pageSize)
      : table.getPageCount();
  const currentPage = pagination.pageIndex + 1;

  const handlePreviousPage = () => {
    table.previousPage();
  };

  const handleNextPage = () => {
    table.nextPage();
  };

  const isNextDisabled =
    totalCount != null
      ? currentPage >= totalPageCount
      : !table.getCanNextPage() && !canLoadMore;

  return (
    <div data-slot="data-table" className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <AlignWrapper align={getAlign(header.column.columnDef.meta)}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </AlignWrapper>
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
                    const meta = cell.column.columnDef.meta as any;
                    const isTitle = meta?.isTitle;
                    const align = getAlign(meta);
                    const cellValue = flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    );

                    if (isTitle && basePath && collectionSlug) {
                      const docId = row.original._id as string;
                      const href = `${basePath}/${collectionSlug}/${docId}`;
                      return (
                        <TableCell key={cell.id}>
                          <AlignWrapper align={align}>
                            <a
                              href={href}
                              className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                              {cellValue}
                            </a>
                          </AlignWrapper>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={cell.id}>
                        <AlignWrapper align={align}>
                          {cellValue}
                        </AlignWrapper>
                      </TableCell>
                    );
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
            Page {currentPage} of {totalPageCount}
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
              disabled={isNextDisabled}
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
