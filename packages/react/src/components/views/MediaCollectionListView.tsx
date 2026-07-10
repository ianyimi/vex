"use client";

import { useQuery } from "@tanstack/react-query";
import type { MediaCollectionConfig, TDocument, VexDocument, VexMediaDocument } from "@vexcms/core";
import { find } from "@vexcms/core/client";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { VexLink } from "../ui/VexLink";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table";
import { MODALS } from "../modals/constants";
import { CreateMediaModal } from "../modals/CreateMediaModal";
import { useVexConfig } from "../../context/VexConfigContext";
import { getCollectionColumnDefs } from "../fields";
import { FilePreview } from "../media/FilePreview";

/**
 * Props for the `MediaCollectionListView` component.
 */
export interface MediaCollectionListViewProps<TDoc extends VexDocument = VexDocument> {
  /** The resolved media collection configuration being listed. */
  collection: MediaCollectionConfig;
  /**
   * Pre-fetched documents from the server. Passed as `initialData` to the
   * TanStack Query so the list renders immediately on first load.
   */
  initialData?: TDoc[];
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
 * 2. The create flow opens {@link CreateMediaModal} (an upload dropzone) instead
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

  const { data: documents = [], isLoading } = useQuery({
    ...find({ collection: props.collection.slug, limit: 100, depth: 1 }),
    initialData: props.initialData,
  });

  return (
    <div>
      <CreateMediaModal collection={collection} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
          <p className="text-sm text-muted-foreground mt-0.5" suppressHydrationWarning>
            {isLoading
              ? "Loading…"
              : `${documents.length} item${documents.length === 1 ? "" : "s"}`}
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

      {documents.length === 0 && !isLoading ? (
        <div className="text-center py-12 border rounded-md text-muted-foreground">
          No {collection.labels.plural.toLowerCase()} yet.{" "}
          <VexLink
            href={`/admin/${collection.slug}?${MODALS.uploadMedia.urlParam}=true`}
            className="text-primary hover:underline"
          >
            Upload one.
          </VexLink>
        </div>
      ) : (
        <div className="border grid place-items-center rounded-md">
          <MediaCollectionDataTable documents={documents} collection={collection} />
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
        <div className="w-10 h-10 relative">
          <FilePreview mediaDoc={row.original} />
        </div>
      ) : (
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">
          📄
        </div>
      );
    },
  };
}

function MediaCollectionDataTable({
  documents,
  collection,
}: {
  documents: VexMediaDocument[];
  collection: MediaCollectionConfig;
}) {
  const columnDefs = [
    mediaPreviewColumn(),
    ...getCollectionColumnDefs<VexMediaDocument>({ collection }),
  ];
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
                {flexRender(header.column.columnDef.header, header.getContext())}
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
