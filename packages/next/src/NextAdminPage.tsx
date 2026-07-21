import { fetchQuery } from "convex/nextjs";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, VexConfig } from "@vexcms/core";
import {
  DashboardView,
  CollectionListView,
  CollectionEditView,
  MediaCollectionListView,
} from "@vexcms/react";
import { sanitizeConfigForClient } from "@vexcms/core";

/**
 * VexCMS admin page server component for Next.js.
 *
 * An `async` server component that routes by the `[[...slug]]` catch-all
 * params, prefetches Convex data via `fetchQuery`, and renders the correct
 * view component. Does **not** include a layout wrapper — `VexAdminLayout`
 * in `app/admin/layout.tsx` owns the persistent shell.
 *
 * **Route mapping:**
 * | `path` array | View |
 * |---|---|
 * | `[]` or undefined | `DashboardView` |
 * | `[collectionSlug]` | `CollectionListView` with preloaded docs |
 * | `[collectionSlug, "new"]` | `CollectionEditView` (empty form) |
 * | `[collectionSlug, documentId]` | `CollectionEditView` with preloaded doc |
 *
 * @param props - Component props
 * @param props.config - The resolved VexCMS configuration from `vex.config.ts`
 * @param props.params - Next.js 15 async params `{ path?: string[] }`
 * @returns The appropriate admin view for the current URL path.
 *
 * @example
 * ```tsx
 * // app/admin/[[...slug]]/page.tsx
 * import { VexAdminPage } from "@vexcms/next";
 * import config from "../../../../vex.config";
 *
 * export default function AdminPage({
 *   params,
 * }: {
 *   params: Promise<{ path?: string[] }>;
 * }) {
 *   return <VexAdminPage config={config} params={params} />;
 * }
 * ```
 */
export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await props.params;
  const [collectionSlug, documentId] = path;

  // Sanitize config for client components (strips storageAdapters, recursively sanitizes mediaCollections)
  const clientConfig = sanitizeConfigForClient(props.config);

  if (!collectionSlug) {
    return <DashboardView config={clientConfig} />;
  }

  const collection = clientConfig.collections.find((c) => c.slug === collectionSlug);
  const mediaCollection = clientConfig.mediaCollections.find((mc) => mc.slug === collectionSlug);

  if (!collection && !mediaCollection) {
    return (
      <div>
        <p className="text-muted-foreground p-6">
          Collection &quot;{collectionSlug}&quot; not found.
        </p>
        <p>TODO: add not found view</p>
      </div>
    );
  }

  if (collection && documentId) {
    const initialData = await fetchQuery(vexConvexApi.get, {
      id: documentId,
    });
    return (
      <CollectionEditView
        collection={collection}
        documentId={documentId}
        initialData={initialData}
      />
    );
  }

  if (mediaCollection) {
    const initialData = await fetchQuery(vexConvexApi.find, {
      collection: collectionSlug as CollectionSlug,
    });
    return <MediaCollectionListView collection={mediaCollection} initialData={initialData} />;
  }

  if (!collection) {
    throw new Error("invalid collection slug");
  }

  const initialData = await fetchQuery(vexConvexApi.findPaginated, {
    collection: collectionSlug as CollectionSlug,
    depth: 1,
    paginationOpts: {
      cursor: null,
      numItems: collection.admin.table.serverPageSize,
      totalDocs: true,
    },
  });
  return <CollectionListView collection={collection!} initialData={initialData} />;
}
