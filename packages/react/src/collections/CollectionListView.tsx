"use client";

import {
  CRUD_ACTIONS,
  isFieldAllowed,
  PERMISSION_SCOPES,
  VERSION_STATUSES,
  vexConvexApi,
  type CollectionListViewProps,
  type CollectionSlug,
  type TDocument,
} from "@vexcms/core";
import { type ColumnDef } from "@tanstack/react-table";
import { RevalidateButton } from "../revalidate/RevalidateButton";
import { VexLink } from "../ui/VexLink";
import { CreateDocumentModal } from "./CreateDocumentModal";
import { useVexConfig } from "../config/VexConfigContext";
import { adminHref } from "../admin/adminHref";
import { getCollectionColumnDefs } from "../fields";
import { useFieldPermissions, usePermission } from "../access";
import { usePaginatedQuery, useVexMutation } from "../hooks";
import { useMemo } from "react";
import { Badge, Button, DataTable } from "../ui";
import { collapseVersionedPairs, StatusBadge } from "../versions";

/**
 * Builds the synthetic "Status" column shown on a versioned collection's
 * list view. Reads two signals off each collapsed row
 * (`collapseVersionedPairs`) rather than a bespoke third flag: the row's own
 * `vex_status` — `"draft"` whenever a draft exists, whether paired with a
 * published row or standing alone — and `hasUnpublishedChanges`, `true`
 * only for a genuine published+draft pair.
 *
 * Three resulting states: a standalone published row (`vex_status !==
 * "draft"`) renders `StatusBadge status="published"` alone; a
 * published+draft pair (`vex_status === "draft" && hasUnpublishedChanges`)
 * renders `StatusBadge status="published"` PLUS an "Unpublished changes"
 * badge — the document IS live, there's just a pending edit; a draft-only
 * row, never published (`vex_status === "draft" && !hasUnpublishedChanges`),
 * renders `StatusBadge status="draft"` alone — it has never gone live, so
 * there is no "unpublished changes" to flag relative to a public version
 * that doesn't exist.
 *
 * Not derived by `getCollectionColumnDefs` — both signals are synthetic,
 * never real collection fields.
 *
 * @returns A `ColumnDef` reading `vex_status`/`hasUnpublishedChanges` off each row.
 */
function buildStatusColumn<
  TData extends TDocument & { hasUnpublishedChanges: boolean },
>(): ColumnDef<TData, boolean> {
  return {
    id: "_status",
    header: "Status",
    accessorFn: (row) => row.hasUnpublishedChanges,
    cell: ({ row }) => {
      const doc = row.original;
      const isDraftOnly =
        doc.vex_status === VERSION_STATUSES.draft.key && !doc.hasUnpublishedChanges;
      return (
        <div className="flex items-center gap-1.5">
          <StatusBadge
            status={isDraftOnly ? VERSION_STATUSES.draft.key : VERSION_STATUSES.published.key}
          />
          {doc.hasUnpublishedChanges ? (
            <Badge variant="secondary">Unpublished changes</Badge>
          ) : null}
        </div>
      );
    },
  };
}

/**
 * The field name backing a column, read off TanStack's `accessorKey`.
 * `undefined` for the select/actions columns, which carry no field and must
 * never be filtered by read permission.
 *
 * @param column - One TanStack column definition.
 * @returns The backing field name, or `undefined` when the column has none.
 */
function columnFieldKey(column: ColumnDef<TDocument, unknown>): string | undefined {
  return "accessorKey" in column ? String(column.accessorKey) : undefined;
}

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
 * @param props - View props.
 * @param props.collection - The slug of the collection to list, resolved
 *   from `useVexConfig()` — the single provenance for collection config.
 * @param props.initialData - Pre-fetched documents from the server (for SSR).
 * @returns The collection data table, or a not-found message when
 *   `collection` does not resolve against the current config.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 *
 * @example
 * ```tsx
 * <CollectionListView collection="posts" initialData={serverDocs} />
 * ```
 *
 * On a versioned collection (`collection.versions.drafts`), requests both
 * rows of an in-progress pair — and any draft-only row that has never been
 * published — via `drafts: true` (gated on `readDrafts`), and collapses
 * each logical document to one row via `collapseVersionedPairs`. The public
 * read path is unaffected: it never requests drafts and never sees a draft
 * row, paired or standalone.
 */
export function CollectionListView<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDoc extends TDocument = TDocument,
>(props: CollectionListViewProps<TCollectionSlug, TDoc>) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collection);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  const numItems = Math.max(
    collection.admin.table.serverPageSize,
    collection.admin.table.defaultPageSize,
  );
  const isVersioned = collection.versions.drafts;
  const pagination = usePaginatedQuery({
    query: {
      collection: collection.slug,
      // Always sent for a versioned collection: `find` itself falls back to the
      // published-only read for a caller without `readDrafts`, so these args
      // match `NextAdminPage`'s server prefetch exactly for every caller.
      drafts: isVersioned ? true : undefined,
      depth: 1,
      paginationOpts: {
        numItems,
        totalDocs: true,
        cursor: null,
      },
    },
    initialData: props.initialData,
    clientPageSize: collection.admin.table.defaultPageSize,
  });

  const rows = useMemo(
    () =>
      isVersioned ? collapseVersionedPairs({ documents: pagination.results }) : pagination.results,
    [pagination.results, isVersioned],
  );

  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.read,
    // Deliberately no `data`: a column is shown or hidden for the whole
    // table, so the question is "is this field denied for EVERY document",
    // not "for this one" — `scope: "any"` answers exactly that.
    scope: PERMISSION_SCOPES.any,
  });

  const columns = useMemo(() => {
    const fieldColumns = getCollectionColumnDefs({ collection }).filter((column) => {
      const key = columnFieldKey(column);
      return key === undefined || isFieldAllowed(fieldPermissions, key);
    });
    return isVersioned
      ? ([buildStatusColumn(), ...fieldColumns] as typeof fieldColumns)
      : fieldColumns;
  }, [collection, fieldPermissions, isVersioned]);

  const removeMutation = useVexMutation({
    collection: collection.slug,
    // A bulk delete affects N documents, so it sends one change per row. The
    // rows are already loaded here, and a deleted document cannot be re-read
    // server-side — which is why the pre-delete state travels in `before`.
    getChanges: ({ args }) =>
      args.ids.flatMap((id) => {
        const row = pagination.results.find((doc) => doc._id === id);
        return row === undefined ? [] : [{ before: row }];
      }),
    mutationFn: vexConvexApi.remove,
    operation: "remove",
  });

  // An arrow keeps the `if (!collection) return` narrowing above; a nested
  // `function` declaration would not.
  const handleBulkDelete = async (selectedIds: string[]) => {
    await removeMutation.mutateAsync({ ids: selectedIds, collection: collection.slug });
  };

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
    <div className="relative">
      <CreateDocumentModal collection={collection.slug} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-y-2 pt-4">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground" suppressHydrationWarning>
            {pagination.isPending
              ? "Loading…"
              : `${rows.length} document${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {/* Grouped so the header's `justify-between` keeps the title left and
            both controls right, instead of spreading three children apart. */}
        <div className="flex flex-wrap items-center gap-2">
          <RevalidateButton collection={collection.slug} />
          <Button
            nativeButton={false}
            disabled={!canCreate}
            render={
              <VexLink
                href={adminHref({ type: "create", slug: collection.slug }, config.basePath)}
              />
            }
          >
            + New {collection.labels.singular}
          </Button>
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        isDone={pagination.isDone}
        onLoadMore={pagination.loadMore}
        isLoadingMore={pagination.isPending}
        totalCount={pagination.totalDocs}
        enableRowSelection={canDelete}
        enableBulkActions={canDelete}
        entityName={collection.labels.plural.toLowerCase()}
        onBulkDelete={canDelete ? handleBulkDelete : undefined}
        isDeleting={removeMutation.isPending}
      />
    </div>
  );
}
