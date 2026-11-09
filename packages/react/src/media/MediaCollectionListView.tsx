"use client";

import {
  CRUD_ACTIONS,
  isFieldAllowed,
  PERMISSION_SCOPES,
  type MediaCollectionConfig,
  type MediaCollectionSlug,
  type TDocument,
  type VexMediaDocument,
  type PaginationResult,
  type ResolvedFieldPermissions,
  buildListViewFindQueryArgs,
  vexConvexApi,
} from "@vexcms/core";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery, type UseSuspenseQueryOptions } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Suspense, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { VexLink } from "../ui/VexLink";
import { MODALS } from "../modals/constants";
import { CreateMediaModal } from "./CreateMediaModal";
import { useVexConfig } from "../config/VexConfigContext";
import { adminHref } from "../admin/adminHref";
import { getCollectionColumnDefs } from "../fields";
import { FilePreview } from "./FilePreview";
import { useFieldPermissions, usePermission } from "../access";
import { useVexListQuery, useVexMutation } from "../hooks";
import { DataTable, DataTableBulkActions, DataTableBulkDeleteModal } from "../ui";

/**
 * The field name backing a column, read off TanStack's `accessorKey`.
 * `undefined` for the preview/select/actions columns, which carry no field
 * and must never be filtered by read permission.
 *
 * @param column - One TanStack column definition.
 * @returns The backing field name, or `undefined` when the column has none.
 */
function columnFieldKey(column: ColumnDef<TDocument<VexMediaDocument>, unknown>): string | undefined {
  return "accessorKey" in column ? String(column.accessorKey) : undefined;
}

/**
 * Props for the `MediaCollectionListView` component.
 */
export interface MediaCollectionListViewProps<TDoc extends VexMediaDocument = VexMediaDocument> {
  /** The slug of the media collection being listed, resolved from `useVexConfig()`. */
  collection: MediaCollectionSlug;
  /**
   * Pre-fetched first page (tests, and any caller rendering without going through
   * `NextAdminPage`'s streamed `HydrationBoundary`) — seeds the inner `useSuspenseQuery`
   * directly via TanStack's own `initialData` option, mirroring `CollectionListViewProps.initialData`
   * (`CollectionListView.tsx`). `NextAdminPage`'s own streamed path omits this and relies on the
   * dehydrated cache instead.
   */
  initialData?: PaginationResult<TDoc>;
}

/**
 * Media collection list view.
 *
 * The media counterpart to `CollectionListView`. Renders the same data-table UI
 * (live-fetched via `find` + Convex subscription, server `initialData` for an
 * instant first paint) with two media-specific differences:
 *
 * 1. A leading **preview** column shows a thumbnail of each media file (from the
 *    `src` field), falling back to a placeholder when no URL is present.
 * 2. The create flow opens the media upload modal (an upload dropzone) instead
 *    of a field form, and the header action reads "Upload" rather than "New".
 *
 * Renders the *content area only* — wrap it in `AdminLayout`.
 *
 * Split the same way `CollectionListView` is: this outer half
 * is sync-only (permission/column setup), rendering the real toolbar/table-frame shell
 * immediately; the data-dependent table body is the inner `MediaCollectionListViewData`,
 * mounted inside its own `<Suspense fallback={<DataTable isPending .../>}>` so a
 * server-streamed, un-awaited prefetch resolves via React's own SSR resumption (a plain
 * `useQuery` reading an un-awaited server prefetch would otherwise hydration-mismatch —
 * see `CollectionListView.tsx`'s own doc comment for the full explanation).
 *
 * @param props - View props.
 * @param props.collection - The slug of the media collection to list.
 * @param props.initialData - Pre-fetched documents from the server (for SSR, tests).
 * @returns The media data table, a not-found message, or an empty state.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 *
 * @example
 * ```tsx
 * <MediaCollectionListView collection="images" />
 * ```
 */
export function MediaCollectionListView(props: MediaCollectionListViewProps) {
  const config = useVexConfig();
  const collection = config.mediaCollections.find((c) => c.slug === props.collection);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });

  const columns = useMemo(
    () =>
      [mediaPreviewColumn(), ...getCollectionColumnDefs<VexMediaDocument>({ collection })].filter(
        (column) => {
          const key = columnFieldKey(column);
          return key === undefined || isFieldAllowed(fieldPermissions, key);
        },
      ),
    [collection, fieldPermissions],
  );

  const canCreate = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.create,
    scope: PERMISSION_SCOPES.any,
  });
  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });

  return (
    <div>
      <CreateMediaModal collection={collection.slug} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-y-2 pt-4">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
        </div>
        <Button
          nativeButton={false}
          disabled={!canCreate}
          render={
            <VexLink
              href={`${adminHref({ type: "collection", slug: collection.slug }, config.basePath)}?${MODALS.uploadMedia.urlParam}=true`}
            />
          }
        >
          + Upload {collection.labels.singular}
        </Button>
      </div>

      <Suspense
        fallback={
          // Real loading state, not a separate skeleton file: the SAME `DataTable` the
          // settled content renders, with `isPending` driving its own real skeleton rows/
          // footer — same columns (same pattern as `CollectionListView.tsx`).
          <div className="grid place-items-center rounded-md border">
            <DataTable data={[]} columns={columns} isPending isDone={false} enableRowSelection={canDelete} />
          </div>
        }
      >
        <MediaCollectionListViewData
          collection={collection}
          columns={columns}
          fieldPermissions={fieldPermissions}
          canCreate={canCreate}
          canDelete={canDelete}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          initialData={props.initialData}
        />
      </Suspense>
    </div>
  );
}

/**
 * The data-dependent inner half of {@link MediaCollectionListView}'s split (see its own doc
 * comment, and `CollectionListView.tsx`'s `CollectionListViewData` sibling this mirrors).
 *
 * Seeds a `useSuspenseQuery` under the SAME `convexQuery(vexConvexApi.findPaginated, ...)`
 * key `NextAdminPage.tsx`'s media-list branch prefetches server-side (byte-for-byte,
 * via the shared `buildListViewFindQueryArgs` builder), so the dehydrated cache entry is
 * actually found — then hands its settled data to `useVexListQuery` as `initialData`,
 * which keeps the live Convex subscription (`usePaginatedQuery`) going for Load More /
 * real-time updates after the first paint.
 *
 * @param props - The resolved media collection, table columns, permissions, and
 *   selection/creation props lifted from {@link MediaCollectionListView}.
 * @returns The `DataTable` rendering the current page of media documents.
 */
function MediaCollectionListViewData(props: {
  collection: MediaCollectionConfig;
  columns: ColumnDef<TDocument<VexMediaDocument>, unknown>[];
  fieldPermissions: ResolvedFieldPermissions;
  canCreate: boolean;
  canDelete: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  initialData?: PaginationResult<VexMediaDocument>;
}) {
  const { collection } = props;
  const config = useVexConfig();
  const numItems = Math.max(collection.admin.view.state.serverPageSize, collection.admin.view.state.pageSize);

  const queryOptions: UseSuspenseQueryOptions<PaginationResult<VexMediaDocument>> = {
    ...(convexQuery(
      vexConvexApi.findPaginated,
      buildListViewFindQueryArgs({
        collection,
        where: undefined,
        sort: undefined,
        drafts: undefined,
        depth: 1,
        numItems,
      }),
    ) as unknown as UseSuspenseQueryOptions<PaginationResult<VexMediaDocument>>),
    ...(props.initialData ? { initialData: props.initialData } : {}),
  };
  const seed = useSuspenseQuery(queryOptions);

  const pagination = useVexListQuery<VexMediaDocument>({
    collection,
    depth: 1,
    pageSize: collection.admin.view.state.pageSize,
    initialData: seed.data,
  });

  // Declared after `pagination` because `getChanges` reads its loaded rows: a
  // deleted document cannot be re-read server-side, so the pre-delete state
  // has to travel with the request.
  const deleteMediaMutation = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args }) =>
      args.ids.flatMap((id) => {
        const row = pagination.results.find((doc) => doc._id === id);
        return row === undefined ? [] : [{ before: row }];
      }),
    mutationFn: vexConvexApi.remove,
    operation: "remove",
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const selectedDocs = useMemo(
    () => pagination.results.filter((doc) => props.selectedIds.includes(doc._id)),
    [pagination.results, props.selectedIds],
  );

  return (
    <>
      <p className="text-muted-foreground mt-0.5 text-sm" suppressHydrationWarning>
        {pagination.isPending
          ? "Loading…"
          : `${pagination.results.length} item${pagination.results.length === 1 ? "" : "s"}`}
      </p>

      {pagination.results.length === 0 && !pagination.isPending ? (
        <div className="text-muted-foreground rounded-md border py-12 text-center">
          No {collection.labels.plural.toLowerCase()} yet.{" "}
          <VexLink
            href={`${adminHref({ type: "collection", slug: collection.slug }, config.basePath)}?${MODALS.uploadMedia.urlParam}=true`}
            className="text-primary hover:underline"
          >
            Upload one.
          </VexLink>
        </div>
      ) : (
        <div className="grid gap-2">
          {props.canDelete && selectedDocs.length > 0 && (
            <DataTableBulkActions
              selectedCount={selectedDocs.length}
              onDelete={() => setDeleteModalOpen(true)}
              onClear={() => props.setSelectedIds([])}
              isDeleting={deleteMediaMutation.isPending}
            />
          )}
          <div className="grid place-items-center rounded-md border">
            <DataTable
              data={pagination.results}
              columns={props.columns}
              isDone={pagination.isDone}
              onLoadMore={() => pagination.loadMore()}
              isLoadingMore={pagination.isPending}
              totalCount={pagination.totalDocs}
              totalDocsCapped={pagination.totalDocsCapped}
              enableRowSelection={props.canDelete}
              selectedIds={props.selectedIds}
              onSelectionChange={props.setSelectedIds}
              isPending={pagination.isPending}
            />
          </div>
          <DataTableBulkDeleteModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            selectedCount={selectedDocs.length}
            entityName={collection.labels.plural}
            isDeleting={deleteMediaMutation.isPending}
            onConfirm={async () => {
              try {
                await deleteMediaMutation.mutateAsync({
                  ids: selectedDocs.map((doc) => doc._id),
                  collection: collection.slug,
                });
              } catch {
                // `deleteMediaMutation`'s own `useVexMutation` `onError`
                // already shows the generic "Request failed" toast —
                // swallowed here only so the rejection never reaches
                // `AlertDialogAction`'s `onClick={onConfirm}` wiring
                // (`DataTableBulkDeleteModal`), which has no catch of its
                // own and would otherwise surface as an unhandled promise
                // rejection. The modal stays open so the user can retry.
                return;
              }
              setDeleteModalOpen(false);
              props.setSelectedIds([]);
            }}
          />
        </div>
      )}
    </>
  );
}

/**
 * Builds a leading "preview" column that renders a thumbnail of each media file.
 *
 * Reads the `src` URL from the document; falls back to a placeholder tile when
 * the document has no resolvable image URL.
 *
 * @returns A TanStack Table column definition rendering the preview thumbnail.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mediaPreviewColumn(): ColumnDef<TDocument<VexMediaDocument>, any> {
  return {
    id: "preview",
    header: "",
    cell: ({ row }) => {
      const src = row.original.src;
      return src ? (
        <div className="relative h-10 w-10">
          <FilePreview mediaDoc={row.original} />
        </div>
      ) : (
        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded text-xs">
          📄
        </div>
      );
    },
  };
}
