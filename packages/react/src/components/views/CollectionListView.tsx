"use client";

import {
  vexConvexApi,
  type CollectionConfig,
  type CollectionListViewProps,
  type CollectionSlug,
} from "@vexcms/core";
import { Button } from "../ui/button";
import { VexLink } from "../ui/VexLink";
import { MODALS } from "../modals/constants";
import { CreateDocumentModal } from "../modals";
import { useVexConfig } from "../../context/VexConfigContext";
import { getCollectionColumnDefs } from "../fields";
import { usePaginatedQuery } from "../../hooks";
import { useMemo } from "react";
import { DataTable } from "../ui";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";

/**
 * Collection list view component.
 *
 * Renders a data table of all documents in a collection. Fetches live data
 * internally via `vexConvexApi.list` (TanStack Query + Convex subscription).
 * `initialData` from `VexAdminPage`'s server-side `fetchQuery` ensures the
 * list renders immediately on first load with no loading flash.
 *
 * This component renders the *content area only* — wrap it in `AdminLayout`.
 *
 * @param props - View props
 * @param props.collection - The collection configuration to list
 * @param props.initialData - Pre-fetched documents from the server (for SSR)
 * @returns The collection data table — header row with document count and "New" button, then a bordered table of all documents.
 *
 * @example
 * ```tsx
 * <CollectionListView collection={postsCollection} initialData={serverDocs} />
 * ```
 */
export function CollectionListView<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TSlug extends CollectionSlug = CollectionSlug,
>(props: CollectionListViewProps<TFieldMeta, TCollectionMeta, TSlug>) {
  const liveConfig = useVexConfig();
  // Prefer the live context collection (updated via Fast Refresh) over the
  // RSC-serialized prop, falling back to the prop if context isn't available.
  const collection =
    (liveConfig?.collections.find(
      (c) => c.slug === props.collection.slug,
    ) as CollectionConfig<TSlug>) ?? props.collection;

  const numItems = Math.max(
    props.collection.admin.table.serverPageSize,
    props.collection.admin.table.defaultPageSize,
  );
  const pagination = usePaginatedQuery({
    query: {
      collection: props.collection.slug,
      depth: 1,
      paginationOpts: {
        numItems,
        totalDocs: true,
        cursor: null,
      },
    },
    initialData: props.initialData,
    clientPageSize: props.collection.admin.table.defaultPageSize,
  });

  const columns = useMemo(() => {
    return getCollectionColumnDefs({ collection });
  }, [collection]);

  const removeMutation = useMutation({ mutationFn: useConvexMutation(vexConvexApi.remove) });

  async function handleBulkDelete(selectedIds: string[]) {
    await removeMutation.mutateAsync({ ids: selectedIds, collection: collection.slug });
  }

  return (
    <div className="relative">
      <CreateDocumentModal collection={collection} />
      <div className="mb-6 flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm" suppressHydrationWarning>
            {pagination.isPending
              ? "Loading…"
              : `${pagination.results.length} document${pagination.results.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <VexLink href={`/admin/${collection.slug}?${MODALS.createDocument.urlParam}=true`} />
          }
        >
          + New {collection.labels.singular}
        </Button>
      </div>

      <DataTable
        data={pagination.results}
        columns={columns}
        isDone={pagination.isDone}
        onLoadMore={pagination.loadMore}
        isLoadingMore={pagination.isPending}
        totalCount={pagination.totalDocs}
        enableRowSelection={true}
        enableBulkActions={true}
        entityName={collection.labels.plural.toLowerCase()}
        onBulkDelete={handleBulkDelete}
        isDeleting={removeMutation.isPending}
      />
    </div>
  );
}
