import type {
  VexApiAuth,
  VexConfig,
  VexMediaDocument,
  VexStoredView,
  VexWhere,
} from "@vexcms/core";
import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";

import {
  ADMIN_COOKIE_NAME,
  adminCollectionCookieName,
  appendLivePreviewParams,
  buildGetArgs,
  buildGlobalGetArgs,
  buildListViewFindQueryArgs,
  buildListViewSearchQueryArgs,
  collectListViewFilterRelationshipValues,
  CRUD_ACTIONS,
  parseListViewUrlState,
  parseListViewConfigCookies,
  parseListViewSkeletonRowCountCookie,
  parseLocalSavedListViewsIndexCookie,
  PERMISSION_SCOPES,
  readLivePreviewLayoutCookie,
  readLivePreviewPanelCookie,
  resolveFieldPermissions,
  resolveListViewQueryState,
  resolveLivePreviewSettings,
  resolveListViewSearchField,
  vexConvexApi,
} from "@vexcms/core";
import { adminHref, VexAuthProvider } from "@vexcms/react";
import {
  AdminNotFound,
  AdminTopNav,
  CollectionEditView,
  CollectionListView,
  CollectionsIndexView,
  DashboardView,
  GlobalEditView,
  GlobalsListView,
  MediaCollectionEditView,
  MediaCollectionListView,
} from "@vexcms/react/admin";
import { dehydrate } from "@tanstack/react-query";
import { fetchQuery } from "convex/nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { HydrationBoundaryClient } from "./HydrationBoundaryClient";
import { convexServerQueryKey, getServerQueryClient } from "./serverQueryClient";

/**
 * Wraps one branch's resolved view content with the shell every `NextAdminPage` branch shares:
 * the branch's own `auth`
 * context, its `HydrationBoundary` (so `AdminTopNav`'s own document-title crumb — a TRUE
 * descendant now, not a layout-level sibling — shares the exact same dehydrated cache the
 * view's own data component reads, required for it to resolve correctly on first paint), the
 * bar itself, and the padded content wrapper (`AdminLayout.tsx`'s `<main>` no longer owns this
 * padding, since the bar needs to render full-bleed, flush with `<main>`'s own edges, to stay
 * visually identical to before the move).
 *
 * Called on EVERY branch, including ones with nothing of their own to prefetch (dashboard,
 * globals list, not-found messages) — `dehydrate()` on an empty/otherwise-unrelated
 * `QueryClient` is harmless, and keeps every branch structurally uniform.
 *
 * @param props.auth - The resolved `{ user, organization }` for this request.
 * @param props.activeSlug - Forwarded to `AdminTopNav` — the active collection/media-collection
 *   slug, or `"globals"` for any globals route, or `undefined` on the dashboard/not-found.
 * @param props.activeDocID - Forwarded to `AdminTopNav` — the active document id (edit routes)
 *   or global slug (global edit), or `undefined` otherwise.
 * @param props.queryClient - This branch's own `getServerQueryClient()` instance (shared with
 *   whatever it already prefetched into, if anything).
 * @param props.children - The branch's own view content.
 * @returns The branch's full return value — `VexAuthProvider` → `HydrationBoundaryClient` →
 *   `AdminTopNav` + padded content wrapper.
 */
function renderAdminShell(props: {
  auth: VexApiAuth;
  activeSlug?: string;
  activeDocID?: string;
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <VexAuthProvider value={props.auth}>
      <HydrationBoundaryClient state={dehydrate(props.queryClient)}>
        <AdminTopNav activeSlug={props.activeSlug} activeDocID={props.activeDocID} />
        {/* `AdminLayout.tsx`'s own `<main>` carries no padding anymore — this wrapper owns
            it instead, so the bar above renders full-bleed against `<main>`'s own edges.
            `flex-1 min-h-0`: `<main>` is now `flex flex-col`
            (`AdminLayout.tsx`) specifically so the bar (fixed ~48px) and this wrapper divide
            its height correctly via flexbox, the same way `<main>` itself divides
            `SidebarInset`'s height with the sidebar. `h-full` (100%) ignored the bar's own
            space entirely — it measured 100% of `<main>`'s FULL height while the bar ALSO
            took space above it, overflowing `<main>`'s own bottom edge by the bar's height
            and creating an unwanted second (page-level) scrollbar. `flex-1 min-h-0` fixes
            this the same way `<main>` itself avoids it: `min-h-0` overrides flexbox's
            default `min-height: auto` (which would otherwise let this item grow to fit its
            own content, i.e. `CollectionEditForm`'s tall `AppForm`, instead of being clamped
            to its allotted share) — required for `AppForm`'s own
            `h-[calc(100%+1.5rem)]` to resolve against a correctly-clamped, definite height.
            A list view's own taller content still scrolls via `<main>`'s own
            `overflow-y-auto` (`overflow: visible` is this div's own default, so it never
            clips taller content, same as before this wrapper existed). */}
        <div className="min-h-0 flex-1 p-6 pt-0">{props.children}</div>
      </HydrationBoundaryClient>
    </VexAuthProvider>
  );
}

/**
 * Resolves a `{ server }` preview URL for first paint.
 *
 * Two things the caller must not have to remember. First, the query only
 * answers for the `{ server }` form — the string and client forms resolve
 * synchronously in the browser and return `null` here, so the iframe falls back
 * to its own resolution. Second, the resolved URL is a plain public URL: it
 * needs `vexLivePreview=1` appended or the preview loads an ordinary page that
 * listens to nothing, which looks like "live preview is broken" with no error
 * anywhere. Appending it here keeps the server path identical to the client one.
 *
 * @param props.args - Query arguments identifying the document or global.
 * @param props.slug - Collection or global slug, for the temp-id params.
 * @param props.token - Auth token forwarded to Convex.
 * @returns The preview-ready URL, or `undefined` when the config resolves in
 * the browser instead.
 */
async function resolveInitialPreviewUrl(props: {
  args: Parameters<typeof fetchQuery<typeof vexConvexApi.livePreviewUrl>>[1];
  slug: string;
  token?: string;
}): Promise<string | undefined> {
  const url = await fetchQuery(
    vexConvexApi.livePreviewUrl,
    props.args,
    props.token ? { token: props.token } : undefined,
  );
  if (!url) return undefined;

  return appendLivePreviewParams({ url, collectionSlug: props.slug });
}

let warnedMissingAuth = false;

/**
 * Warns ONCE, dev-only, when `config.access` is enabled but `NextAdminPage` received no
 * `auth` prop — the caller is about to be treated as anonymous
 * (fail-closed default-deny) rather than allow-all, which can look like "nothing
 * shows up, for no obvious reason" with no other signal. Silent when `access` is absent or
 * `{ enabled: false }` — the allow-all case genuinely needs no `auth` at all, nothing to
 * warn about — and silent in production (an operator's own logging/monitoring is the right
 * place for a real misconfiguration alert there, not a framework `console.warn`).
 *
 * @param props.access - The resolved config's own `access`, or `undefined`.
 * @param props.authPromise - The `authPromise` prop `NextAdminPage` received, or `undefined`.
 */
function warnIfAuthMissing(props: {
  access: VexConfig["access"];
  authPromise: Promise<VexApiAuth> | undefined;
}): void {
  if (props.authPromise !== undefined) return;
  if (!props.access || !props.access.enabled) return;
  if (warnedMissingAuth) return;
  if (process.env.NODE_ENV === "production") return;
  warnedMissingAuth = true;
  console.warn(
    "[vexcms] NextAdminPage: config.access is enabled but no `authPromise` prop was passed. " +
      "Every caller is being treated as anonymous (fail-closed) until you pass " +
      "`authPromise={getUserOrg()}` from your own session source.",
  );
}

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
 * Takes `tokenPromise`/`authPromise`, not resolved values: the
 * caller (`page.tsx`) starts both without awaiting them immediately, so `NextAdminPage`'s own
 * data fetches can begin as soon as `tokenPromise` resolves (what every `fetchQuery` call
 * actually needs) rather than waiting on the slower `authPromise` (which itself depends on
 * the token, plus one more Convex round trip). The caller's own page-level access gate
 * (`canAccessAdminPanel`) should `await authPromise` and redirect BEFORE rendering
 * `NextAdminPage` at all — a generic page-level
 * skeleton rendered while the gate was still in flight made the loading state worse than no
 * gate-level fallback at all: shifts, row-selection spinners showing where real checkboxes
 * belong, skeletons with no matching settled element, content popping in unannounced.
 * `NextAdminPage` streams its own real chrome (title/tabs/toolbar/controls) immediately once
 * rendered and wraps only its OWN data-dependent regions (e.g. table rows) in their own
 * `<Suspense>` boundaries — no page-level fallback needed or wanted.
 *
 * @param props - Component props
 * @param props.config - The resolved server `VexConfig`, typically the default export of
 *   `vex.config.server.ts` — not the client-safe `vex.config.ts`.
 * @param props.params - Next.js 15 async params `{ path?: string[] }`
 * @param props.tokenPromise - The in-flight (or already-resolved) session token (e.g.
 *   `getToken()`), forwarded to every `fetchQuery` call for authenticated reads. Optional —
 *   a project with no auth at all omits it, every `fetchQuery` call runs unauthenticated.
 * @param props.authPromise - The in-flight (or already-resolved — e.g. `Promise.resolve(auth)`
 *   after the caller's own gate already awaited it) server-resolved caller,
 *   OPTIONAL. Wraps the entire return in `VexAuthProvider` and narrows the collection list
 *   route's search field by read permission. Omit it when `config.access` is absent or
 *   disabled — nothing is restricted either way. An `access`-enabled project that omits it is
 *   treated as an anonymous caller (fail-closed) with a one-time dev console warning.
 * @returns The appropriate admin view for the current URL path.
 *
 * @example
 * ```tsx
 * // app/admin/[[...slug]]/page.tsx
 * import { canAccessAdminPanel } from "@vexcms/core";
 * import { NextAdminPage } from "@vexcms/next/server";
 * import { redirect } from "next/navigation";
 * import { getToken, getUserOrg } from "~/auth/server";
 * import config from "../../../../vex.config.server";
 *
 * export default async function AdminPage({
 *   params,
 * }: {
 *   params: Promise<{ path?: string[] }>;
 * }) {
 *   const token = await getToken();
 *   if (!token) redirect("/auth/sign-in?redirectTo=/admin");
 *   const auth = await getUserOrg();
 *   if (
 *     !canAccessAdminPanel({ access: config.access, user: auth.user, organization: auth.organization })
 *   ) {
 *     redirect("/unauthorized");
 *   }
 *   return (
 *     <NextAdminPage
 *       config={config}
 *       params={params}
 *       tokenPromise={Promise.resolve(token)}
 *       authPromise={Promise.resolve(auth)}
 *     />
 *   );
 * }
 * ```
 */
export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ path?: string[] }>;
  /**
   * Next.js's own `searchParams` prop, forwarded by the app route (`AdminPage`). Only the
   * collection list route reads it (`parseListViewUrlState`) — every other
   * route ignores it.
   */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  tokenPromise?: Promise<string | undefined>;
  authPromise?: Promise<VexApiAuth>;
}) {
  const { path = [] } = await props.params;
  const [section, collectionSlug, documentId] = path;
  const cookieStore = await cookies();

  warnIfAuthMissing({ access: props.config.access, authPromise: props.authPromise });
  const token = props.tokenPromise ? await props.tokenPromise : undefined;
  // An unresolved caller is `{ user: null }`, never a
  // wildcard-allow stand-in. `hasPermission`/`resolveFieldPermissions`/`resolveAccessRule`
  // already treat an ABSENT or disabled `access` config as allow-all on their own (each
  // short-circuits on `!access || !access.enabled` before ever reading `user`), so this
  // one fallback is correct for BOTH cases: "no access config at all" (the `user` value
  // below is never consulted) and "access enabled, `auth` omitted" (default-deny
  // denies an anonymous `{ user: null }`, exactly as it would any other unauthenticated
  // caller). Normalized to a promise that ALWAYS resolves (never `undefined`) so every
  // branch below can simply `await authPromise` without its own fallback.
  const authPromise: Promise<VexApiAuth> = props.authPromise ?? Promise.resolve({ user: null });

  if (path.length === 0) {
    const auth = await authPromise;
    return renderAdminShell({
      auth,
      queryClient: getServerQueryClient(),
      children: <DashboardView />,
    });
  }

  if (section !== "collections" && section !== "globals") {
    notFound();
  }

  if (section === "globals") {
    if (!collectionSlug) {
      const auth = await authPromise;
      return renderAdminShell({
        auth,
        activeSlug: "globals",
        queryClient: getServerQueryClient(),
        children: <GlobalsListView />,
      });
    }
    const globalConfig = props.config.globals.find((g) => g.slug === collectionSlug);
    if (!globalConfig) {
      const auth = await authPromise;
      return renderAdminShell({
        auth,
        activeSlug: "globals",
        queryClient: getServerQueryClient(),
        children: (
          <AdminNotFound
            variant="global"
            detail={`Global "${collectionSlug}" doesn't exist.`}
            backHref={adminHref({ type: "globals" }, props.config.basePath)}
            backLabel="Back to globals"
          />
        ),
      });
    }
    const globalQueryClient = getServerQueryClient();
    const globalArgs = buildGlobalGetArgs({ global: globalConfig });
    // Awaited (reverts an earlier
    // un-awaited prefetch for this query specifically): the edit view's own primary document
    // is essential and cheap, so `GlobalEditView` renders the whole form at once from
    // `initialData` below — no whole-form Suspense fallback. Parallelized with
    // `authPromise`/`previewUrlPromise` below (not sequenced after them —
    // this used to `await` here directly, THEN create `previewUrlPromise`
    // afterward, serializing two independent round trips end to end) — same total wait as
    // the un-awaited version cost in practice, since this was always the single slowest
    // piece. Still dehydrated into the cache too (using the SAME already-resolved value as
    // its `queryFn`, so this costs no extra round trip) for parity with every other prefetch
    // this page does and for any live re-subscription `GlobalEditViewData`'s own `useQuery`
    // establishes after mount.
    const globalDocPromise = fetchQuery(
      vexConvexApi.globals.get,
      globalArgs,
      token ? { token } : undefined,
    ).catch(() => null);
    const globalLivePreview = resolveLivePreviewSettings({
      config: props.config.admin.livePreview,
      kind: "global",
      slug: globalConfig.slug,
      admin: globalConfig.admin.livePreview,
    });
    const previewUrlPromise =
      globalLivePreview === undefined
        ? Promise.resolve(undefined)
        : resolveInitialPreviewUrl({
            args: { collection: globalConfig.slug, kind: "global", values: {} },
            slug: globalConfig.slug,
            token,
          });
    const [auth, initialPreviewUrl, globalDoc] = await Promise.all([
      authPromise,
      previewUrlPromise,
      globalDocPromise,
    ]);
    if (!globalDoc) {
      return renderAdminShell({
        auth,
        activeSlug: "globals",
        queryClient: globalQueryClient,
        children: (
          <AdminNotFound
            variant="document"
            detail="This document doesn't exist, or you don't have access to view it."
            backHref={`${props.config.basePath}/globals`}
            backLabel="Back to Globals"
          />
        ),
      });
    }
    // Awaited (same regression class as the `listViews`/media-edit prefetch fixes, polish
    // fixes) — `globalDoc` is already resolved by the `Promise.all` above, so this
    // prefetch's own `queryFn` replays an already-settled value and resolves on the next
    // microtask, but `prefetchQuery`'s own cache-status bookkeeping (marking the entry
    // "success", not "pending") still needs that tick — an un-awaited prefetch here left
    // the raw SSR HTML's dehydrated entry at `status: "pending"` even though `globalDoc`
    // was already known, which `GlobalEditViewData`'s own `useQuery` (same key) would
    // otherwise re-fetch on mount instead of reading the already-resolved value.
    await globalQueryClient
      .prefetchQuery({
        queryKey: convexServerQueryKey(vexConvexApi.globals.get, globalArgs),
        queryFn: () => globalDoc,
      })
      .catch(() => undefined);
    return renderAdminShell({
      auth,
      activeSlug: "globals",
      activeDocID: globalConfig.slug,
      queryClient: globalQueryClient,
      children: (
        <GlobalEditView
          global={globalConfig.slug}
          initialData={globalDoc}
          initialPreviewPanelOpen={
            globalLivePreview !== undefined &&
            readLivePreviewPanelCookie({
              cookieValue: cookieStore.get(ADMIN_COOKIE_NAME)?.value,
              defaultOpen: globalLivePreview.defaultOpen,
            })
          }
          initialPreviewPanelSize={readLivePreviewLayoutCookie({
            cookieValue: cookieStore.get(ADMIN_COOKIE_NAME)?.value,
          })}
          initialPreviewUrl={initialPreviewUrl}
        />
      ),
    });
  }

  if (!collectionSlug) {
    const auth = await authPromise;
    return renderAdminShell({
      auth,
      activeSlug: "collections",
      queryClient: getServerQueryClient(),
      children: <CollectionsIndexView />,
    });
  }

  const collection = props.config.collections.find((c) => c.slug === collectionSlug);
  const mediaCollection = props.config.mediaCollections.find((mc) => mc.slug === collectionSlug);

  if (!collection && !mediaCollection) {
    const auth = await authPromise;
    return renderAdminShell({
      auth,
      activeSlug: collectionSlug,
      queryClient: getServerQueryClient(),
      children: (
        <AdminNotFound
          variant="collection"
          detail={`Collection "${collectionSlug}" doesn't exist.`}
          backHref={adminHref({ type: "collections" }, props.config.basePath)}
          backLabel="Back to collections"
        />
      ),
    });
  }

  if (mediaCollection && documentId) {
    const mediaEditQueryClient = getServerQueryClient();
    const mediaEditArgs = buildGetArgs({ id: documentId, collection: mediaCollection });
    // Awaited (reverts an earlier
    // un-awaited prefetch for this query specifically): the edit view's own primary document
    // is essential and cheap, so `MediaCollectionEditView` renders the whole form at once
    // from `initialData` below — no whole-form Suspense fallback. Parallelized with
    // `authPromise` below (not sequenced after it — this used to
    // `await authPromise` THEN `await fetchQuery(...)` one after the other, serializing two
    // independent round trips end to end). Still dehydrated into the cache too (using the
    // SAME already-resolved value as its `queryFn`, no extra round trip) for parity with
    // every other prefetch this page does and for any live re-subscription
    // `MediaCollectionEditViewData`'s own `useVexDocQuery` establishes.
    const mediaDocPromise = fetchQuery(
      vexConvexApi.get,
      mediaEditArgs,
      token ? { token } : undefined,
    ).catch(() => null) as Promise<VexMediaDocument | null>;
    const [auth, mediaDoc] = await Promise.all([authPromise, mediaDocPromise]);
    if (!mediaDoc) {
      return renderAdminShell({
        auth,
        activeSlug: mediaCollection.slug,
        queryClient: mediaEditQueryClient,
        children: (
          <AdminNotFound
            variant="document"
            detail="This document doesn't exist, or you don't have access to view it."
            backHref={`${props.config.basePath}/collections/${mediaCollection.slug}`}
            backLabel={`Back to ${mediaCollection.labels.plural}`}
          />
        ),
      });
    }
    // Awaited (same regression class as the `listViews` prefetch fix above):
    // `mediaDoc` is already resolved by the
    // `Promise.all` above, so this prefetch's own `queryFn` replays an already-settled
    // value and resolves on the next microtask — but `prefetchQuery`'s own cache-status
    // bookkeeping (marking the entry "success", not "pending") still needs that tick.
    // `AdminTopNavDocCrumb`'s `useSuspenseQuery` reads this EXACT key (`buildGetArgs`) —
    // un-awaited, the raw SSR HTML captured the entry as
    // `status: "pending"` even though `mediaDoc` was already known, so the crumb never
    // showed on first paint (confirmed live via `curl`'d SSR HTML before this fix).
    await mediaEditQueryClient
      .prefetchQuery({
        queryKey: convexServerQueryKey(vexConvexApi.get, mediaEditArgs),
        queryFn: () => mediaDoc,
      })
      .catch(() => undefined);
    return renderAdminShell({
      auth,
      activeSlug: mediaCollection.slug,
      activeDocID: documentId,
      queryClient: mediaEditQueryClient,
      children: (
        <MediaCollectionEditView collection={mediaCollection.slug} documentId={documentId} initialData={mediaDoc} />
      ),
    });
  }

  if (mediaCollection) {
    const numItems = Math.max(
      mediaCollection.admin.view.state.serverPageSize,
      mediaCollection.admin.view.state.pageSize,
    );
    const auth = await authPromise;
    const mediaQueryClient = getServerQueryClient();
    const mediaArgs = buildListViewFindQueryArgs({
      collection: mediaCollection,
      where: undefined,
      sort: undefined,
      drafts: undefined,
      depth: 1,
      numItems,
    });
    // Streamed, not awaited (same shell-streaming pattern as the collection-list branch
    // below): `prefetchQuery` is called SYNCHRONOUSLY, right before `dehydrate()`, so the
    // in-flight promise is captured in the dehydrated cache rather than its (not-yet-
    // resolved) result.
    void mediaQueryClient
      .prefetchQuery({
        queryKey: convexServerQueryKey(vexConvexApi.findPaginated, mediaArgs),
        queryFn: () => fetchQuery(vexConvexApi.findPaginated, mediaArgs, token ? { token } : undefined),
      })
      .catch(() => undefined);
    return renderAdminShell({
      auth,
      activeSlug: mediaCollection.slug,
      queryClient: mediaQueryClient,
      children: <MediaCollectionListView collection={mediaCollection.slug} />,
    });
  }

  if (collection && documentId) {
    const collectionEditQueryClient = getServerQueryClient();
    const collectionEditArgs = buildGetArgs({ id: documentId, collection });
    // Awaited (reverts an earlier
    // un-awaited prefetch for this query specifically): the edit view's own primary document
    // is essential and cheap, so `CollectionEditView` renders the whole form at once from
    // `initialData` below — no whole-form Suspense fallback. Parallelized with
    // `authPromise`/`previewUrlPromise` below (not sequenced after them) — same total wait
    // as the un-awaited version cost in practice, since this was always the single slowest
    // piece. Still dehydrated into the cache too (using the SAME already-resolved value as
    // its `queryFn`, no extra round trip) for parity with every other prefetch this page
    // does and for any live re-subscription `CollectionEditViewData`'s own `useVexDocQuery`
    // establishes. Same args as before (`get` falls back to published-only for a caller
    // without `readDrafts`).
    const collectionDocPromise = fetchQuery(
      vexConvexApi.get,
      collectionEditArgs,
      token ? { token } : undefined,
    ).catch(() => null);
    const collectionLivePreview = resolveLivePreviewSettings({
      config: props.config.admin.livePreview,
      kind: "collection",
      slug: collection.slug,
      admin: collection.admin.livePreview,
    });
    const previewUrlPromise =
      collectionLivePreview === undefined
        ? Promise.resolve(undefined)
        : resolveInitialPreviewUrl({
            args: { collection: collection.slug, kind: "collection", documentId, values: {} },
            slug: collection.slug,
            token,
          });
    const [auth, initialPreviewUrl, currentDocument] = await Promise.all([
      authPromise,
      previewUrlPromise,
      collectionDocPromise,
    ]);
    if (!currentDocument) {
      return renderAdminShell({
        auth,
        activeSlug: collection.slug,
        queryClient: collectionEditQueryClient,
        children: (
          <AdminNotFound
            variant="document"
            detail="This document doesn't exist, or you don't have access to view it."
            backHref={`${props.config.basePath}/collections/${collection.slug}`}
            backLabel={`Back to ${collection.labels.plural}`}
          />
        ),
      });
    }
    // Awaited (same regression class as the `listViews`/media-edit/global-edit prefetch
    // fixes):
    // `currentDocument` is already resolved above, so this prefetch's own `queryFn`
    // replays an already-settled value — but `prefetchQuery`'s own cache-status
    // bookkeeping (marking the entry "success", not "pending") still needs that tick.
    // `AdminTopNavDocCrumb`'s `useSuspenseQuery` reads this EXACT key (`buildGetArgs`) —
    // un-awaited, the raw SSR HTML's dehydrated entry stayed
    // `status: "pending"` even though `currentDocument` was already known, so the crumb
    // never showed on first paint.
    await collectionEditQueryClient
      .prefetchQuery({
        queryKey: convexServerQueryKey(vexConvexApi.get, collectionEditArgs),
        queryFn: () => currentDocument,
      })
      .catch(() => undefined);
    return renderAdminShell({
      auth,
      activeSlug: collection.slug,
      activeDocID: documentId,
      queryClient: collectionEditQueryClient,
      children: (
        <CollectionEditView
          collection={collection.slug}
          documentId={documentId}
          initialData={currentDocument}
          initialPreviewPanelOpen={
            collectionLivePreview !== undefined &&
            readLivePreviewPanelCookie({
              cookieValue: cookieStore.get(adminCollectionCookieName({ collection: collection.slug }))?.value,
              defaultOpen: collectionLivePreview.defaultOpen,
            })
          }
          initialPreviewPanelSize={readLivePreviewLayoutCookie({
            cookieValue: cookieStore.get(adminCollectionCookieName({ collection: collection.slug }))?.value,
          })}
          initialPreviewUrl={initialPreviewUrl}
        />
      ),
    });
  }

  if (!collection) {
    throw new Error("invalid collection slug");
  }

  const params = parseListViewUrlState({
    searchParams: toSearchParams((await props.searchParams) ?? {}),
    collection,
  });

  const [viewSource, viewId] = params.view?.split(":") ?? [];
  const configView =
    viewSource === "config" ? collection.admin.views.find((view) => view.viewId === viewId) : undefined;

  // `listViews` is always needed for the view-tabs UI, so it always
  // starts immediately, needing only `token` (already resolved above) — NOT `authPromise`.
  // `peek` is independent too. Both start here, in parallel with `find`/`search` below —
  // because only a `shared:` view genuinely needs `listViews`'s own RESULT before
  // `find`/`search` can be built (that view's own stored sort/where/pageSize lives in this
  // row); every other case (default, config/preset, local, no view) resolves entirely from
  // in-memory config/URL state. Before this, `find`/`search` waited on `listViews`/`peek`
  // unconditionally — the single biggest sequential hop in a warm reload (perf fix).
  const listViewsPromise = fetchQuery(
    vexConvexApi.listViews,
    { collection: collection.slug },
    token ? { token } : undefined,
  );
  const peekArgs = params.peek === undefined ? undefined : buildGetArgs({ id: params.peek, collection });
  const peekPromise =
    peekArgs === undefined
      ? Promise.resolve(undefined)
      : // Same args as `useVexDocQuery`'s client query inside `ListViewPeek`,
        // so the hydrated peek opens with no re-fetch.
        fetchQuery(vexConvexApi.get, peekArgs, token ? { token } : undefined);

  // Streamed, not awaited — TanStack Query v5 + Next.js App
  // Router streaming: https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr#streaming-with-server-components.
  // Same branch `useVexListQuery` takes: an active search means
  // `findPaginated` is the wrong endpoint entirely, not just the wrong args. A stale
  // `?sort=` link naming a field that no longer leads an index (`UNINDEXED_SORT`) is the
  // common failure here, but anything thrown is dehydrated as a REJECTED query — the
  // client's own `useSuspenseQuery` (same key) re-throws it into `CollectionListViewData`,
  // which the table's own `QueryErrorBoundary` catches and renders `ListViewQueryError` from,
  // with no special-casing needed for "the server's own prefetch failed" vs "the client's
  // later refetch failed" (previously a dehydrated error crashed
  // the whole page instead, since `CollectionListViewData`'s OWN `useSuspenseQuery` for the
  // seed query threw before `useVexListQuery`'s `pagination.error` ever ran).
  const queryClient = getServerQueryClient();

  // Peek re-applied: `ListViewPeek.tsx` now splits into a
  // `useSuspenseVexDocQuery`-driven, `<Suspense>`-wrapped piece — safe to stream un-awaited
  // the same way `findPaginated`/`search` already are, unlike `listViews` (still awaited
  // below until `SavedListViewTabs.tsx`'s own equivalent split lands — reapplying that one too once it does. Only fires when there's an
  // actual peek to prefetch; `ListViewPeek` never mounts `useSuspenseVexDocQuery` at all when
  // `peekId` is undefined (its own outer component returns `null` first), so there's nothing
  // to seed in that case. Reuses the SAME `peekArgs` const the `fetchQuery` above does —
  // two independently-built args objects for what must be the
  // identical TanStack Query key is exactly the bug class `buildGetArgs` exists to prevent
  // (see `AdminTopNavDocCrumb`'s own doc comment for the media-crumb incident this caused).
  if (peekArgs !== undefined) {
    void queryClient
      .prefetchQuery({
        queryKey: convexServerQueryKey(vexConvexApi.get, peekArgs),
        queryFn: () => peekPromise,
      })
      .catch(() => undefined);
  }

  // Narrows the readable searchField server-side
  // — this is the ONE piece of this branch that genuinely needs the resolved `auth` (not
  // just `token`) before it can fire, since it reads `auth.user`/`auth.organization`
  // directly; everything else below needs only `token`. `sharedView` only waits on
  // `listViewsPromise` for a `shared:` view — every other
  // case resolves from in-memory config/URL state, so `findPaginated`/`search` below can
  // start as soon as `auth` resolves, never gated on `listViews`'s own round trip.
  const [auth, sharedView] = await Promise.all([
    authPromise,
    viewSource === "shared"
      ? listViewsPromise
          .catch(() => [] as VexStoredView[])
          .then((views) => views.find((view) => view.viewId === viewId))
      : Promise.resolve(undefined),
  ]);

  // Resolved BEFORE `resolveListViewQueryState` (not just for `resolveListViewSearchField`
  // below any more) so it can also drop a user-added filter condition on an
  // unreadable field before query args
  // are ever built — `find`/`search` reject such a condition server-side
  // while `ListViewFilterChips` hides the chip that would let the
  // user remove it client-side, a dead end without this.
  const fieldPermissions = resolveFieldPermissions({
    access: props.config.access,
    user: auth.user,
    organization: auth.organization,
    resource: collection.slug,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });
  // with the EXACT SAME functions `CollectionListView`'s own client-side query-building
  // already uses (`resolveFieldPermissions` + `resolveListViewSearchField`), fed `resolved.searchField` — the URL/view/collection-default-resolved
  // field `resolveListViewQueryState` already computed — not the raw URL `qf`, so an
  // unmodified view's own saved `searchField` gets the SAME readability narrowing the
  // client applies, not just an explicit `?qf=`. Without this, a `qf` (or a view's saved
  // `searchField`) naming a field this caller can't read would be sent to `search` as-is
  // server-side, while the client substitutes a readable field after hydration instead —
  // two different query keys, a refetch, exactly the flash class this is meant to forbid.
  const resolved = resolveListViewQueryState({ collection, params, configView, sharedView, fieldPermissions });
  // Every `relationship`/`upload` id the ACTIVE filter names,
  // resolved to its target document's title — server-prerendered so a
  // filter chip/row never flashes from the raw id. Kicked off here
  // (as soon as `resolved.where` is known) but not awaited until right
  // before `renderAdminShell` below, same "start early, await late"
  // shape as `listViewsPromise`/`peekPromise` — usually 0-3 distinct
  // ids, so this never meaningfully delays the page even though (unlike
  // `findPaginated`/`search`/`peek`/`listViews`) it must be a resolved
  // VALUE by render time: `initialFilterValueTitles` is a plain prop
  // `ListViewContext` seeds its OWN state from, not a dehydrated
  // query-cache entry a client `useQuery` re-reads.
  const relationshipFilterValues = collectListViewFilterRelationshipValues({ where: resolved.where, collection });
  const distinctFilterValues = [
    ...new Map(relationshipFilterValues.map((v) => [`${v.targetCollection}:${v.id}`, v])).values(),
  ];
  const filterValueTitlesPromise = Promise.allSettled(
    distinctFilterValues.map(async (v): Promise<[string, string | null]> => {
      const targetCollectionConfig =
        props.config.collections.find((c) => c.slug === v.targetCollection) ??
        props.config.mediaCollections.find((c) => c.slug === v.targetCollection);
      if (targetCollectionConfig === undefined) return [v.id, null];
      const doc = await fetchQuery(
        vexConvexApi.get,
        buildGetArgs({ id: v.id, collection: targetCollectionConfig }),
        token ? { token } : undefined,
      );
      if (doc === null) return [v.id, null];
      const titleField = targetCollectionConfig.admin.useAsTitle;
      const title = (doc as Record<string, unknown>)[titleField];
      return [v.id, typeof title === "string" && title !== "" ? title : String(doc._id)];
    }),
  );
  const numItems = Math.max(collection.admin.view.state.serverPageSize, resolved.pageSize);
  const drafts = collection.versions.drafts ? true : undefined;
  const resolvedSearchField = resolveListViewSearchField({
    collection,
    qf: resolved.searchField,
    fieldPermissions,
  });
  // Mirrors `CollectionListView.tsx`'s own `isSearchActive` exactly (whitespace-only
  // `q` is "no search"; no READABLE searchField is "no search" too —
  // search bar" case, now enforced server-side too) — the server and client must
  // agree on WHICH endpoint (`search` vs `findPaginated`) they're calling, not just on
  // that endpoint's args, or the client's post-hydration query key disagrees with the
  // server's and refetches (same class of sort-parity bug).
  const isSearchActive = resolved.search.trim() !== "" && resolvedSearchField !== undefined;

  // `convexQuery(...).queryKey` is the SAME key `CollectionListViewData`'s own
  // `useSuspenseQuery` call builds from the identical `buildListViewFindQueryArgs`/
  // `buildListViewSearchQueryArgs` helpers — required for `<HydrationBoundary>` to find this
  // entry at all, not just for "correctness" (a mismatched key is a silent miss: the
  // client just re-fetches from scratch). `prefetchQuery` is called SYNCHRONOUSLY here (its
  // own promise is NOT awaited — the `.catch` only guards an unhandled-rejection warning),
  // right after `auth`/`sharedView` resolve and BEFORE awaiting `listViewsPromise`/
  // `peekPromise` below (for the OTHER props) — so `findPaginated`/`search` is called at
  // the earliest possible point, never gated on `listViews` (the perf fix this preserves).
  if (isSearchActive) {
    const args = buildListViewSearchQueryArgs({
      collection,
      where: resolved.where as VexWhere<string> | undefined,
      search: resolved.search,
      searchField: resolvedSearchField as string,
      drafts,
      numItems,
    });
    void queryClient
      .prefetchQuery({
        queryKey: convexServerQueryKey(vexConvexApi.search, args),
        queryFn: () => fetchQuery(vexConvexApi.search, args, token ? { token } : undefined),
      })
      .catch(() => undefined);
  } else {
    const args = buildListViewFindQueryArgs({
      collection,
      where: resolved.where as VexWhere<string> | undefined,
      sort: resolved.sort,
      drafts,
      depth: 1,
      numItems,
    });
    void queryClient
      .prefetchQuery({
        queryKey: convexServerQueryKey(vexConvexApi.findPaginated, args),
        queryFn: () => fetchQuery(vexConvexApi.findPaginated, args, token ? { token } : undefined),
      })
      .catch(() => undefined);
  }

  // A URL must never crash the page. `listViews` is already gated to
  // return `[]` for a denied caller and `get` to `null` for a not-found row;
  // either rejecting is caught by the `.catch(() => undefined)` on the `prefetchQuery`
  // call below, same as `findPaginated`/`search`/`peek` above.
  //
  // Awaited UNCONDITIONALLY for every view source (reverts a regression:
  // previously only awaited `if (viewSource === "shared")`, "streamed, not awaited" for
  // every other case): the bug wasn't that the shared views never arrived, it's that the
  // raw SSR HTML's dehydrated cache entry captured `status: "pending"` for the DEFAULT/
  // config/local cases, so the client painted the tab strip's own no-shared-views-yet
  // state BEFORE the shared tabs resolved — a visible pop-in under any backend latency,
  // confirmed live via the raw SSR response (`curl`'d `/admin/collections/posts`, no
  // `view=`: the embedded dehydrated state showed `"status":"pending","fetchStatus":
  // "fetching"` for the `listViews` query, with the shared view labels ABSENT from the
  // initial HTML). `listViewsPromise` itself already starts at the same moment as every
  // other fetch above (overlapping the auth/data work, not sequenced after it) — awaiting
  // `listViewsPrefetch` here costs only the REMAINING time (if any) for that same
  // in-flight request to settle, not a new round trip; for a warm reload this is
  // typically near-zero since `listViewsPromise` has had the whole rest of this
  // function's work (collection resolution, filter-title lookups, etc.) to settle in
  // already. `SavedListViewTabs.tsx`'s own tab strip and `CollectionListView.tsx`'s own
  // `useSavedListViews()` call (for `visibleColumns`/`columnOrder` state on a shared view)
  // both now see a `"success"` dehydrated entry on first paint, for every view source —
  // no skeleton-then-shared-tabs pop-in, no skeleton-then-narrower-table shift, no
  // hydration mismatch. (`SavedListViewTabs.tsx` used to split its tab strip into a
  // `<Suspense>`-wrapped piece specifically to stream shared views in once this prefetch
  // was un-awaited — removed once the await above landed, since that was the split's
  // only reason to exist, and a nested `<Suspense>` boundary turned out to have its own
  // cost even with already-resolved data: React's streaming SSR ships a nested
  // boundary's fallback in the first flush regardless of whether the underlying query
  // had to wait at all — confirmed live via a JS-disabled load of a shared-view URL.)
  const listViewsPrefetch = queryClient
    .prefetchQuery({
      queryKey: convexServerQueryKey(vexConvexApi.listViews, { collection: collection.slug }),
      queryFn: () => listViewsPromise,
    })
    .catch(() => undefined);
  await listViewsPrefetch;
  const skeletonRowCountEntry = parseListViewSkeletonRowCountCookie({
    cookieValue: cookieStore.get(adminCollectionCookieName({ collection: collection.slug }))?.value,
  })[viewId ?? "default"];
  const filterValueTitleResults = await filterValueTitlesPromise;
  const initialFilterValueTitles: Record<string, string | null> = Object.fromEntries(
    filterValueTitleResults.map((result, index) =>
      result.status === "fulfilled" ? result.value : [distinctFilterValues[index].id, null],
    ),
  );

  return renderAdminShell({
    auth,
    activeSlug: collection.slug,
    queryClient,
    children: (
      <CollectionListView
        collection={collection.slug}
        initialLocalIndex={parseLocalSavedListViewsIndexCookie({
          cookieValue: cookieStore.get(adminCollectionCookieName({ collection: collection.slug }))?.value,
        })}
        initialPreferences={parseListViewConfigCookies({ cookies: cookieStore, collectionSlug: collection.slug })}
        initialSkeletonRowCount={skeletonRowCountEntry?.n}
        initialSkeletonDone={skeletonRowCountEntry?.done}
        initialFilterValueTitles={initialFilterValueTitles}
      />
    ),
  });
}

/**
 * Converts Next.js's `searchParams` shape (`{ [key]: string | string[] | undefined }`) to
 * the `URLSearchParams` `parseListViewUrlState` expects — the one place this
 * conversion happens, since every other reader of the list URL is client-side, where
 * `URLSearchParams` is already what `useSearchParams()`/`nuqs` hand back.
 *
 * @param raw - The awaited `searchParams` prop.
 * @returns An equivalent `URLSearchParams`, repeating a key for each array entry.
 */
function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) params.append(key, entry);
  }
  return params;
}
