import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionListViewProps } from "@vexcms/core";
import { Button } from "~/components/ui/button";
import { VexLink } from "~/components/ui/VexLink";

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
 * @returns <CollectionListView collection={postsCollection} initialData={serverDocs} />
 *
 * @example
 * ```tsx
 * <CollectionListView collection={postsCollection} initialData={serverDocs} />
 * ```
 */
export function CollectionListView(props: CollectionListViewProps) {
  const { data: documents = [], isLoading } = useQuery({
    ...convexQuery(vexConvexApi.list, { collection: props.collection.slug }),
    initialData: props.initialData,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {props.collection.labels.plural}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading…"
              : `${documents.length} document${documents.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<VexLink href={`/admin/${props.collection.slug}/new`} />}
        >
          + New {props.collection.labels.singular}
        </Button>
      </div>

      {documents.length === 0 && !isLoading ? (
        <div className="text-center py-12 border rounded-md text-muted-foreground">
          No {props.collection.labels.plural.toLowerCase()} yet.{" "}
          <VexLink
            href={`/admin/${props.collection.slug}/new`}
            className="text-primary hover:underline"
          >
            Create one.
          </VexLink>
        </div>
      ) : (
        <div className="border grid place-items-center rounded-md">
          <p>add data table here. {documents.length} documents found.</p>
        </div>
      )}
    </div>
  );
}
