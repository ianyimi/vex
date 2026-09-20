import type { CollectionSlug, PaginationResult, VexConfig, VexMediaDocument } from "@vexcms/core";

import {
  livePreviewLayoutCookieName,
  livePreviewPanelCookieName,
  readLivePreviewLayoutCookie,
  readLivePreviewPanelCookie,
  vexConvexApi,
} from "@vexcms/core";
import {
  CollectionEditView,
  CollectionListView,
  DashboardView,
  GlobalEditView,
  GlobalsListView,
  MediaCollectionEditView,
  MediaCollectionListView,
} from "@vexcms/react";
import { fetchQuery } from "convex/nextjs";
import { cookies } from "next/headers";

/**
 * VexCMS admin page server component for Next.js.
 *
 * An `async` server component that routes by the `[[...slug]]` catch-all
 * params, prefetches Convex data via `fetchQuery`, and renders the correct
 * view component. Does **not** include a layout wrapper — `NextAdminLayout`
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
 * @param props.config - The resolved server `VexConfig`, typically the default export of
 *   `vex.config.server.ts` — not the client-safe `vex.config.ts`.
 * @param props.params - Next.js 15 async params `{ path?: string[] }`
 * @param props.token - Optional session token forwarded to `fetchQuery` for authenticated reads.
 * @returns The appropriate admin view for the current URL path.
 *
 * @example
 * ```tsx
 * // app/admin/[[...slug]]/page.tsx
 * import { NextAdminPage } from "@vexcms/next/server";
 * import config from "../../../../vex.config.server";
 *
 * export default function AdminPage({
 *   params,
 * }: {
 *   params: Promise<{ path?: string[] }>;
 * }) {
 *   return <NextAdminPage config={config} params={params} />;
 * }
 * ```
 */
export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ path?: string[] }>;
  token?: string;
}) {
  const { path = [] } = await props.params;
  const [collectionSlug, documentId] = path;
  const cookieStore = await cookies();

  if (!collectionSlug) {
    return <DashboardView />;
  }

  if (collectionSlug === "globals") {
    if (!documentId) {
      return <GlobalsListView />;
    }
    const globalConfig = props.config.globals.find((g) => g.slug === documentId);
    if (!globalConfig) {
      return (
        <div>
          <p className="text-muted-foreground p-6">Global &quot;{documentId}&quot; not found.</p>
          <p>TODO: add not found view</p>
        </div>
      );
    }
    const global = await fetchQuery(
      vexConvexApi.globals.get,
      { slug: globalConfig.slug },
      props.token ? { token: props.token } : undefined,
    );
    return (
      <GlobalEditView
        global={globalConfig.slug}
        initialData={global}
        initialPreviewPanelOpen={readLivePreviewPanelCookie({
          cookieValue: cookieStore.get(livePreviewPanelCookieName({ slug: globalConfig.slug }))
            ?.value,
          defaultOpen: globalConfig.admin.livePreview?.defaultOpen ?? false,
        })}
        initialPreviewPanelSize={readLivePreviewLayoutCookie({
          cookieValue: cookieStore.get(livePreviewLayoutCookieName({ slug: globalConfig.slug }))
            ?.value,
        })}
      />
    );
  }

  const collection = props.config.collections.find((c) => c.slug === collectionSlug);
  const mediaCollection = props.config.mediaCollections.find((mc) => mc.slug === collectionSlug);

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

  if (mediaCollection && documentId) {
    const initialData = await fetchQuery(
      vexConvexApi.get,
      { id: documentId, collection: mediaCollection.slug },
      props.token ? { token: props.token } : undefined,
    );
    return (
      <MediaCollectionEditView
        collection={mediaCollection.slug}
        documentId={documentId}
        initialData={initialData as null | VexMediaDocument}
      />
    );
  }

  if (mediaCollection) {
    const numItems = Math.max(
      mediaCollection.admin.table.serverPageSize,
      mediaCollection.admin.table.defaultPageSize,
    );
    const initialData = await fetchQuery(
      vexConvexApi.find,
      {
        collection: collectionSlug as CollectionSlug,
        paginationOpts: { numItems, totalDocs: true, cursor: null },
      },
      props.token ? { token: props.token } : undefined,
    );
    return (
      <MediaCollectionListView
        collection={mediaCollection.slug}
        initialData={initialData as PaginationResult<VexMediaDocument>}
      />
    );
  }

  if (collection && documentId) {
    const initialData = await fetchQuery(
      vexConvexApi.get,
      { id: documentId, collection: collection.slug },
      props.token ? { token: props.token } : undefined,
    );
    return (
      <CollectionEditView
        collection={collection.slug}
        documentId={documentId}
        initialData={initialData}
        initialPreviewPanelOpen={readLivePreviewPanelCookie({
          cookieValue: cookieStore.get(livePreviewPanelCookieName({ slug: collection.slug }))
            ?.value,
          defaultOpen: collection.admin.livePreview?.defaultOpen ?? false,
        })}
        initialPreviewPanelSize={readLivePreviewLayoutCookie({
          cookieValue: cookieStore.get(livePreviewLayoutCookieName({ slug: collection.slug }))
            ?.value,
        })}
      />
    );
  }

  if (!collection) {
    throw new Error("invalid collection slug");
  }

  const numItems = Math.max(
    collection.admin.table.serverPageSize,
    collection.admin.table.defaultPageSize,
  );
  const initialData = await fetchQuery(
    vexConvexApi.findPaginated,
    {
      collection: collectionSlug as CollectionSlug,
      depth: 1,
      paginationOpts: { cursor: null, numItems, totalDocs: true },
    },
    props.token ? { token: props.token } : undefined,
  );
  return <CollectionListView collection={collection.slug} initialData={initialData} />;
}
