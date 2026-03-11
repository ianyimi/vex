"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
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
import { CheckboxField } from "./checkbox-field";

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

function selectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <CheckboxField
        checked={table.getIsAllPageRowsSelected()}
        ref={(el) => {
          if (el) {
            el.indeterminate = table.getIsSomePageRowsSelected();
          }
        }}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <CheckboxField
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        aria-label="Select row"
      />
    ),
    size: 40,
    meta: { align: "center" },
    enableSorting: false,
    enableHiding: false,
  };
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
  /** Override the displayed page index (0-based) without affecting data slicing.
   *  Used for bidirectional pagination where the slice index differs from the display page. */
  displayPageIndex?: number;
  /**
   * Custom link component for client-side navigation (e.g., Next.js Link).
   * Falls back to a plain <a> tag if not provided.
   */
  linkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children: React.ReactNode;
  }>;
  /** Enable row selection with checkboxes. Default: false. */
  enableRowSelection?: boolean;
  /** Controlled row selection state. Keys are row indices, values are booleans. */
  rowSelection?: RowSelectionState;
  /** Callback when row selection changes. */
  onRowSelectionChange?: (selection: RowSelectionState) => void;
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
  displayPageIndex,
  linkComponent: LinkComponent,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const pagination: PaginationState = {
    pageIndex: controlledPageIndex ?? 0,
    pageSize,
  };

  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const handleRowSelectionChange = onRowSelectionChange ?? setInternalRowSelection;

  const allColumns = enableRowSelection ? [selectColumn<TData>(), ...columns] : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    enableRowSelection,
    state: {
      pagination,
      rowSelection,
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(pagination) : updater;
      onPageChange?.(next.pageIndex);
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      handleRowSelectionChange(next);
    },
  });

  const totalPageCount =
    totalCount != null
      ? Math.ceil(totalCount / pageSize)
      : table.getPageCount();
  const currentPage = (displayPageIndex ?? pagination.pageIndex) + 1;

  return (
    <div data-slot="data-table" className="flex flex-col gap-4 min-h-0">
      <div className="rounded-md border min-h-0 flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const colSize = header.column.columnDef.size;
                  return (
                  <TableHead
                    key={header.id}
                    style={colSize != null ? { width: colSize } : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <AlignWrapper
                        align={getAlign(header.column.columnDef.meta)}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </AlignWrapper>
                    )}
                  </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-12">
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
                      const linkClassName =
                        "font-medium text-primary underline-offset-4 hover:underline truncate block";
                      const Link = LinkComponent ?? "a";
                      return (
                        <TableCell key={cell.id}>
                          <AlignWrapper align={align}>
                            <Link href={href} className={linkClassName}>
                              {cellValue}
                            </Link>
                          </AlignWrapper>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={cell.id}>
                        <AlignWrapper align={align}>
                          <span className="truncate block">{cellValue}</span>
                        </AlignWrapper>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={allColumns.length}
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
          <div className="flex-1 text-sm text-muted-foreground">
            {enableRowSelection && Object.keys(rowSelection).length > 0 && (
              <span>
                {Object.keys(rowSelection).length} of {data.length} row(s) selected
              </span>
            )}
          </div>
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
