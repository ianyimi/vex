"use client";

import { useQuery } from "@tanstack/react-query";
import { type VexDocument } from "@vexcms/core";
import type {
  CollectionConfig,
  CollectionListViewProps,
  CollectionSlug,
} from "@vexcms/core";
import { Button } from "../ui/button";
import { VexLink } from "../ui/VexLink";
import { MODALS } from "../modals/constants";
import { CreateDocumentModal } from "../modals";
import { useVexConfig } from "../../context/VexConfigContext";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { getCollectionColumnDefs } from "../fields";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { find } from "@vexcms/core/client";

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

  const { data: documents = [], isLoading } = useQuery({
    ...find({ collection: props.collection.slug, limit: 100, depth: 1 }),
    initialData: props.initialData,
  });

  return (
    <div>
      <>
        <CreateDocumentModal collection={collection} />
      </>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
          <p
            className="text-sm text-muted-foreground mt-0.5"
            suppressHydrationWarning
          >
            {isLoading
              ? "Loading…"
              : `${documents.length} document${documents.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <VexLink
              href={`/admin/${collection.slug}?${MODALS.createDocument.urlParam}=true`}
            />
          }
        >
          + New {collection.labels.singular}
        </Button>
      </div>

      {documents.length === 0 && !isLoading ? (
        <div className="text-center py-12 border rounded-md text-muted-foreground">
          No {collection.labels.plural.toLowerCase()} yet.{" "}
          <VexLink
            href={`/admin/${collection.slug}/new`}
            className="text-primary hover:underline"
          >
            Create one.
          </VexLink>
        </div>
      ) : (
        <div className="border grid place-items-center rounded-md">
          <CollectionListDataTable
            documents={documents}
            collection={collection}
          />
        </div>
      )}
    </div>
  );
}

function CollectionListDataTable({
  documents,
  collection,
}: {
  documents: VexDocument[];
  collection: CollectionConfig;
}) {
  const columnDefs = getCollectionColumnDefs({ collection });
  const table = useReactTable({
    data: documents,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((hg) => (
          <TableRow key={hg.id}>
            {hg.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
