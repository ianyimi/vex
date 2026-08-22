"use client";

import { useMutation } from "@tanstack/react-query";
import {
  CRUD_ACTIONS,
  PERMISSION_SCOPES,
  type MediaCollectionConfig,
  type TDocument,
  type VexMediaDocument,
  type PaginationResult,
  vexConvexApi,
} from "@vexcms/core";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { VexLink } from "../ui/VexLink";
import { MODALS } from "../modals/constants";
import { CreateMediaModal } from "../modals/CreateMediaModal";
import { useVexConfig } from "../../context/VexConfigContext";
import { getCollectionColumnDefs } from "../fields";
import { FilePreview } from "../media/FilePreview";
import { usePaginatedQuery, usePermission } from "../../hooks";
import { DataTable } from "../ui";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Props for the `MediaCollectionListView` component.
 */
export interface MediaCollectionListViewProps<TDoc extends VexMediaDocument = VexMediaDocument> {
  /** The resolved media collection configuration being listed. */
  collection: MediaCollectionConfig;
  /**
   * Pre-fetched documents from the server. Passed as `initialData` to the
   * TanStack Query so the list renders immediately on first load.
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
 * @param props - View props
 * @param props.collection - The media collection configuration to list
 * @param props.initialData - Pre-fetched documents from the server (for SSR)
 * @returns The media data table, or an empty state when no media exists yet.
 *
 * @example
 * ```tsx
 * <MediaCollectionListView collection={imagesCollection} initialData={serverDocs} />
 * ```
 */
export function MediaCollectionListView(props: MediaCollectionListViewProps) {
  const liveConfig = useVexConfig();
  // Prefer the live context collection (updated via Fast Refresh) over the
  // RSC-serialized prop, falling back to the prop if context isn't available.
  const collection =
    liveConfig?.mediaCollections.find((c) => c.slug === props.collection.slug) ?? props.collection;

  const deleteMediaMutation = useMutation({ mutationFn: useConvexMutation(vexConvexApi.remove) });
  async function handleBulkDelete(selectedIds: string[]) {
    await deleteMediaMutation.mutateAsync({ ids: selectedIds, collection: props.collection.slug });
  }

  const numItems = Math.max(
    props.collection.admin.table.serverPageSize,
    props.collection.admin.table.defaultPageSize,
  );
  const pagination = usePaginatedQuery<VexMediaDocument>({
    query: {
      collection: props.collection.slug,
      depth: 1,
      limit: 100,
      paginationOpts: {
        numItems,
        totalDocs: true,
        cursor: null,
      },
    },
    initialData: props.initialData,
    clientPageSize: props.collection.admin.table.defaultPageSize,
  });

  const columns = [
    mediaPreviewColumn(),
    ...getCollectionColumnDefs<VexMediaDocument>({ collection }),
  ];

  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });
  return (
    <div>
      <CreateMediaModal collection={collection} />

      <div className="mb-6 flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm" suppressHydrationWarning>
            {pagination.isPending
              ? "Loading…"
              : `${pagination.results.length} item${pagination.results.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <VexLink href={`/admin/${collection.slug}?${MODALS.uploadMedia.urlParam}=true`} />
          }
        >
          + Upload {collection.labels.singular}
        </Button>
      </div>

      {pagination.results.length === 0 && !pagination.isPending ? (
        <div className="text-muted-foreground rounded-md border py-12 text-center">
          No {collection.labels.plural.toLowerCase()} yet.{" "}
          <VexLink
            href={`/admin/${collection.slug}?${MODALS.uploadMedia.urlParam}=true`}
            className="text-primary hover:underline"
          >
            Upload one.
          </VexLink>
        </div>
      ) : (
        <div className="grid place-items-center rounded-md border">
          <DataTable
            data={pagination.results}
            columns={columns}
            isDone={pagination.isDone}
            onLoadMore={() => pagination.loadMore()}
            isLoadingMore={pagination.isPending}
            totalCount={pagination.totalDocs}
            enableRowSelection
            enableBulkActions
            entityName={props.collection.labels.plural}
            onBulkDelete={canDelete ? handleBulkDelete : undefined}
            isDeleting={deleteMediaMutation.isPending}
            isPending={pagination.isPending}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Builds a leading "preview" column that renders a thumbnail of each media file.
 *
 * Reads the `src` URL from the document; falls back to a placeholder tile when
 * the document has no resolvable image URL.
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
