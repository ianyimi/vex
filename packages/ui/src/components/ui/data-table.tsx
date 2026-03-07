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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { cn } from "../../styles/utils";
import { Pagination, PageSizeSelector } from "./pagination";

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
  /** Callback fired when the page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Total document count from the server (enables accurate page count) */
  totalCount?: number;
  /**
   * Custom link component for client-side navigation (e.g., Next.js Link).
   * Falls back to a plain <a> tag if not provided.
   */
  linkComponent?: React.ComponentType<{ href: string; className?: string; children: React.ReactNode }>;
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
  onPageSizeChange,
  totalCount,
  linkComponent: LinkComponent,
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

  return (
    <div data-slot="data-table" className="flex flex-col gap-4 min-h-0">
      <div className="rounded-md border min-h-0 flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-background">
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
                      const linkClassName = "font-medium text-primary underline-offset-4 hover:underline truncate block";
                      const Link = LinkComponent ?? "a";
                      return (
                        <TableCell key={cell.id}>
                          <AlignWrapper align={align}>
                            <Link
                              href={href}
                              className={linkClassName}
                            >
                              {cellValue}
                            </Link>
                          </AlignWrapper>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={cell.id}>
                        <AlignWrapper align={align}>
                          <span className="truncate block">
                            {cellValue}
                          </span>
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
        </table>
      </div>

      {data.length > 0 && (
        <div className="flex items-center px-2 shrink-0">
          <div className="flex-1" />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPageCount}
            onPageChange={(zeroIndexed) => onPageChange?.(zeroIndexed)}
            canLoadMore={canLoadMore}
          />
          <div className="flex-1 flex justify-end">
            {onPageSizeChange && (
              <PageSizeSelector
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable, type DataTableProps };
