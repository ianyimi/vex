"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import type { VexCollection, ClientVexConfig } from "@vexcms/core";
import { generateColumns } from "@vexcms/core";
import {
  DataTable,
  Input,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@vexcms/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";
import {
  useQueryState,
  parseAsIndex,
  parseAsStringLiteral,
  parseAsBoolean,
} from "nuqs";
import { Plus, Trash2 } from "lucide-react";
import type { RowSelectionState, ColumnDef } from "@tanstack/react-table";
import { usePaginationLoader } from "../hooks/usePaginationLoader";
import { useBidirectionalPagination } from "../hooks/useBidirectionalPagination";
import { CreateDocumentDialog } from "../components/CreateDocumentDialog";
import {
  DeleteDocumentDialog,
  type DocumentForDeletion,
} from "../components/DeleteDocumentDialog";
import { RowActionsMenu } from "../components/RowActionsMenu";
import { UploadCellPreview } from "../components/UploadCellPreview";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const PAGE_SIZE_STRINGS = PAGE_SIZE_OPTIONS.map(String) as unknown as readonly [
  "10",
  "25",
  "50",
  "100",
];
const STORAGE_KEY = "vex-page-size";

function getStoredPageSize(): string {
  if (typeof window === "undefined") return "10";
  return localStorage.getItem(STORAGE_KEY) ?? "10";
}

export default function CollectionsView({
  config,
  collection,
}: {
  config: ClientVexConfig;
  collection: VexCollection;
}) {
  const router = useRouter();

  const [pageIndex, setPageIndex] = useQueryState(
    "page",
    parseAsIndex.withDefault(0),
  );
  const [searchTerm, setSearchTerm] = useQueryState("q", { defaultValue: "" });
  const [pageSizeStr, setPageSizeStr] = useQueryState(
    "size",
    parseAsStringLiteral(PAGE_SIZE_STRINGS).withDefault(
      getStoredPageSize() as (typeof PAGE_SIZE_STRINGS)[number],
    ),
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Create modal — driven by URL param
  const [createNew, setCreateNew] = useQueryState(
    "createNew",
    parseAsBoolean.withDefault(false),
  );

  // Delete modal — driven by URL param
  const [deleteOpen, setDeleteOpen] = useQueryState(
    "delete",
    parseAsBoolean.withDefault(false),
  );

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Documents staged for deletion
  const [docsToDelete, setDocsToDelete] = useState<DocumentForDeletion[]>([]);

  const pageSize = Number(pageSizeStr);
  const initialFetchSize = Math.max(50, pageSize * 5);

  const handlePageSizeChange = (newSize: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(newSize));
    }
    setPageSizeStr(String(newSize) as (typeof PAGE_SIZE_STRINGS)[number]);
    setPageIndex(0);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const columns = useMemo(() => {
    const cols = generateColumns({ collection, auth: config.auth });
    return cols.map((col) => {
      const meta = col.meta as Record<string, unknown> | undefined;
      if (meta?.type === "upload" && typeof meta.to === "string") {
        const targetSlug = meta.to;
        return {
          ...col,
          cell: (info: any) => {
            const value = info.getValue();
            if (!value || typeof value !== "string") return "";
            return (
              <UploadCellPreview mediaId={value} collectionSlug={targetSlug} />
            );
          },
        };
      }
      return col;
    });
  }, [collection, config.auth]);

  const useAsTitle = collection.admin?.useAsTitle as string | undefined;
  const disableDelete = collection.admin?.disableDelete ?? false;
  const disableCreate = collection.admin?.disableCreate ?? false;
  const searchAvailable = !!useAsTitle;
  const searchIndexName = useAsTitle ? `search_${useAsTitle}` : undefined;
  const isSearching = searchAvailable && debouncedSearch.trim().length > 0;

  // Total document count (reactive, separate from paginated query)
  const countQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.countDocuments, {
      collectionSlug: collection.slug,
    }),
    enabled: !isSearching,
  });
  const totalCount = countQuery.data as number | undefined;

  // Paginated list mode (bidirectional for instant last-page access)
  const {
    documents: listResults,
    tablePageIndex,
    isLoading: listLoading,
    canLoadMore,
    loadMore,
    totalLoaded,
    handlePageChange,
  } = useBidirectionalPagination({
    collectionSlug: collection.slug,
    initialFetchSize,
    pageSize,
    pageIndex,
    totalCount,
    isSearching,
  });

  // Search mode
  const searchQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.searchDocuments, {
      collectionSlug: collection.slug,
      searchIndexName: searchIndexName ?? "",
      searchField: useAsTitle ?? "",
      query: debouncedSearch.trim(),
    }),
    enabled: isSearching,
    placeholderData: keepPreviousData,
  });

  const lastSearchResults = useRef<Record<string, unknown>[]>([]);

  const documents = isSearching
    ? ((searchQuery.data as Record<string, unknown>[]) ??
      lastSearchResults.current)
    : (listResults ?? []);

  if (isSearching && searchQuery.data) {
    lastSearchResults.current = searchQuery.data as Record<string, unknown>[];
  }

  usePaginationLoader({
    pageIndex: tablePageIndex,
    pageSize,
    totalLoaded: isSearching ? documents.length : totalLoaded,
    loadMore: (n) => {
      if (canLoadMore) loadMore(n);
    },
    canLoadMore,
    batchSize: initialFetchSize,
  });

  const isLoading = isSearching ? searchQuery.isPending : listLoading;
  const searchLoading = isSearching && searchQuery.isFetching;

  // Display count: use totalCount for list mode, documents.length for search
  const displayCount = isSearching ? documents.length : totalCount;

  const pluralLabel = collection.labels?.plural ?? collection.slug;
  const singularLabel = collection.labels?.singular ?? collection.slug;

  // Build actions column
  const columnsWithActions: ColumnDef<Record<string, unknown>, unknown>[] =
    useMemo(() => {
      const actionsColumn: ColumnDef<Record<string, unknown>, unknown> = {
        id: "actions",
        header: () => <div className="text-center w-full">Actions</div>,
        size: 50,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const doc = row.original;
          const docId = doc._id as string;
          const docTitle = useAsTitle
            ? (doc[useAsTitle] as string | undefined)
            : undefined;

          return (
            <RowActionsMenu
              onEdit={() => {
                router.push(`${config.basePath}/${collection.slug}/${docId}`);
              }}
              onDelete={() => {
                setDocsToDelete([{ _id: docId, title: docTitle }]);
                setDeleteOpen(true);
              }}
              disableDelete={disableDelete}
              className="w-full grid place-items-center"
            />
          );
        },
      };

      return [...columns, actionsColumn];
    }, [
      columns,
      collection.slug,
      config.basePath,
      disableDelete,
      useAsTitle,
      router,
    ]);

  // Build DocumentForDeletion array from selected rows
  const getSelectedDocuments = useCallback((): DocumentForDeletion[] => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (k) => rowSelection[k],
    );
    return selectedIndices.map((idx) => {
      const doc = documents[Number(idx)];
      return {
        _id: doc._id as string,
        title: useAsTitle ? (doc[useAsTitle] as string | undefined) : undefined,
      };
    });
  }, [rowSelection, documents, useAsTitle]);

  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k],
  ).length;

  return (
    <div className="flex flex-col p-6 h-[calc(100vh-theme(spacing.16))] min-h-0">
      <Breadcrumb className="mb-4 shrink-0">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={config.basePath} />}>
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pluralLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">{pluralLabel}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : isSearching
                ? `${displayCount} result(s)`
                : displayCount != null
                  ? `${displayCount.toLocaleString()} document(s)`
                  : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!disableDelete && selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setDocsToDelete(getSelectedDocuments());
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedCount})
            </Button>
          )}
          {!disableCreate && (
            <Button size="sm" onClick={() => setCreateNew(true)}>
              <Plus className="h-4 w-4" />
              Create {singularLabel}
            </Button>
          )}
        </div>
      </div>

      {searchAvailable && (
        <div className="mb-4 max-w-sm shrink-0">
          <Input
            placeholder={`Search by ${useAsTitle}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageIndex(0);
            }}
            loading={searchLoading}
          />
        </div>
      )}

      <DataTable
        columns={columnsWithActions}
        data={documents as Record<string, unknown>[]}
        basePath={config.basePath}
        collectionSlug={collection.slug}
        emptyMessage={
          isSearching
            ? "No matching documents."
            : `No ${collection.labels?.plural?.toLowerCase() ?? "documents"} yet.`
        }
        canLoadMore={canLoadMore}
        pageSize={pageSize}
        pageIndex={isSearching ? pageIndex : tablePageIndex}
        displayPageIndex={isSearching ? undefined : pageIndex}
        onPageChange={(page: number) => {
          const resolved = handlePageChange(page);
          setPageIndex(resolved);
        }}
        onPageSizeChange={handlePageSizeChange}
        totalCount={isSearching ? undefined : totalCount}
        linkComponent={Link}
        enableRowSelection={!disableDelete}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        isLoading={isLoading}
      />

      {/* Create Document Dialog */}
      {!disableCreate && (
        <CreateDocumentDialog
          open={createNew}
          onClose={() => setCreateNew(false)}
          collection={collection}
          onCreated={({ documentId }) => {
            setCreateNew(false);
            router.push(`${config.basePath}/${collection.slug}/${documentId}`);
          }}
        />
      )}

      {/* Delete Document Dialog */}
      {!disableDelete && (
        <DeleteDocumentDialog
          open={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
            setDocsToDelete([]);
          }}
          documents={docsToDelete}
          collectionSlug={collection.slug}
          singularLabel={singularLabel}
          pluralLabel={pluralLabel}
          onDeleted={() => {
            setRowSelection({});
            setDocsToDelete([]);
          }}
        />
      )}
    </div>
  );
}
