"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import type { AnyVexCollection, ClientVexConfig } from "@vexcms/core";
import { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "@vexcms/core";
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
  FilePreview,
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
import { CreateMediaDialog } from "../components/CreateMediaDialog";
import {
  DeleteDocumentDialog,
  type DocumentForDeletion,
} from "../components/DeleteDocumentDialog";
import { RowActionsMenu } from "../components/RowActionsMenu";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const PAGE_SIZE_STRINGS = PAGE_SIZE_OPTIONS.map(String) as unknown as readonly [
  "10",
  "25",
  "50",
  "100",
];
const STORAGE_KEY = "vex-page-size";

const STANDARD_MEDIA_FIELDS = new Set([
  ...LOCKED_MEDIA_FIELDS,
  ...OVERRIDABLE_MEDIA_FIELDS,
]);

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getStoredPageSize(): string {
  if (typeof window === "undefined") return "10";
  return localStorage.getItem(STORAGE_KEY) ?? "10";
}

export default function MediaCollectionsView({
  config,
  collection,
}: {
  config: ClientVexConfig;
  collection: AnyVexCollection;
}) {
  const router = useRouter();
  const thumbnailSize = (collection.config.admin as any)?.thumbnailSize ?? 40;

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
  const [createNew, setCreateNew] = useQueryState(
    "createNew",
    parseAsBoolean.withDefault(false),
  );
  const [deleteOpen, setDeleteOpen] = useQueryState(
    "delete",
    parseAsBoolean.withDefault(false),
  );
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
  const disableDelete = collection.config.admin?.disableDelete ?? false;
  const disableCreate = collection.config.admin?.disableCreate ?? false;
  const searchAvailable = !!useAsTitle;
  const searchIndexName = useAsTitle ? `search_${useAsTitle}` : undefined;
  const isSearching = searchAvailable && debouncedSearch.trim().length > 0;

  // Build media-specific columns
  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(() => {
    const cols: ColumnDef<Record<string, unknown>>[] = [];

    // Preview thumbnail column
    cols.push({
      id: "preview",
      header: "Preview",
      size: thumbnailSize + 16,
      meta: { noTruncate: true },
      enableSorting: false,
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <FilePreview
            url={doc.url as string}
            mimeType={(doc.mimeType as string) || "application/octet-stream"}
            alt={(doc.filename as string) || ""}
            size={thumbnailSize}
          />
        );
      },
    });

    // Filename column (title link)
    cols.push({
      accessorKey: "filename",
      header: "Filename",
      meta: { isTitle: true },
    });

    // Type column
    cols.push({
      accessorKey: "mimeType",
      header: "Type",
    });

    // Size column with formatted bytes
    cols.push({
      accessorKey: "size",
      header: "Size",
      cell: (info) => {
        const value = info.getValue();
        if (typeof value !== "number") return "";
        return formatBytes(value);
      },
    });

    // Custom fields (non-standard, non-hidden)
    const fields = collection.config.fields as Record<string, any>;
    for (const [name, field] of Object.entries(fields)) {
      if (STANDARD_MEDIA_FIELDS.has(name)) continue;
      if (field._meta?.admin?.hidden) continue;
      cols.push({
        accessorKey: name,
        header: field._meta?.label ?? name,
      });
    }

    return cols;
  }, [collection, thumbnailSize]);

  const countQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.countDocuments, {
      collectionSlug: collection.slug,
    }),
    enabled: !isSearching,
  });
  const totalCount = countQuery.data as number | undefined;

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
  const displayCount = isSearching ? documents.length : totalCount;
  const pluralLabel = collection.config.labels?.plural ?? collection.slug;
  const singularLabel = collection.config.labels?.singular ?? collection.slug;

  // Actions column
  const columnsWithActions: ColumnDef<Record<string, unknown>, unknown>[] =
    useMemo(() => {
      const actionsColumn: ColumnDef<Record<string, unknown>, unknown> = {
        id: "actions",
        header: "Actions",
        size: 50,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const doc = row.original;
          const docId = doc._id as string;
          const docTitle = (doc.filename as string) || undefined;

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
            />
          );
        },
      };

      return [...columns, actionsColumn];
    }, [columns, collection.slug, config.basePath, disableDelete, router]);

  const getSelectedDocuments = useCallback((): DocumentForDeletion[] => {
    const selectedIndices = Object.keys(rowSelection).filter(
      (k) => rowSelection[k],
    );
    return selectedIndices.map((idx) => {
      const doc = documents[Number(idx)];
      return {
        _id: doc._id as string,
        title: (doc.filename as string) || undefined,
      };
    });
  }, [rowSelection, documents]);

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
              Upload {singularLabel}
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
            ? "No matching media."
            : `No ${pluralLabel.toLowerCase()} yet.`
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

      {!disableCreate && (
        <CreateMediaDialog
          open={createNew}
          onClose={() => setCreateNew(false)}
          collection={collection}
          onCreated={({ documentId }) => {
            setCreateNew(false);
            router.push(`${config.basePath}/${collection.slug}/${documentId}`);
          }}
        />
      )}

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
