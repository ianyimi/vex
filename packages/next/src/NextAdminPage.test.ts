import {
  checkbox,
  defineCollection,
  defineConfig,
  defineGlobal,
  relationship,
  serializeListViewUrlState,
  text,
  upload,
  VexError,
  vexConvexApi,
} from "@vexcms/core";
import type { VexAccessConfig, VexApiAuth, VexConfig } from "@vexcms/core";
import { HydrationBoundary } from "@tanstack/react-query";
import { getFunctionName } from "convex/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as VexReactModule from "@vexcms/react";
import { VexAuthProvider } from "@vexcms/react";

import { NextAdminPage } from "./NextAdminPage";

const { fetchQueryMock, notFoundMock } = vi.hoisted(() => ({
  fetchQueryMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("convex/nextjs", () => ({ fetchQuery: fetchQueryMock }));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
// The views are client components; these tests only inspect what the server
// page prefetched, so stub them out of the module graph.
vi.mock("@vexcms/react", async (importOriginal) => {
  const actual = await importOriginal<typeof VexReactModule>();
  const stub = () => null;
  return {
    ...actual,
    CollectionEditView: stub,
    CollectionListView: stub,
    CollectionsIndexView: stub,
    DashboardView: stub,
    GlobalEditView: stub,
    GlobalsListView: stub,
    MediaCollectionEditView: stub,
    MediaCollectionListView: stub,
  };
});

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text() },
  versions: { drafts: true },
});
const plainPages = defineCollection({
  slug: "pages",
  fields: { title: text() },
  admin: { useAsTitle: "title" },
});
const relDocs = defineCollection({
  slug: "rel_docs",
  fields: {
    title: text(),
    page: relationship({ collection: { slug: "pages" } }),
    cover: upload({ to: "images" }),
  },
});
const viewsPosts = defineCollection({
  slug: "posts2",
  fields: {
    title: text({ index: "by_title", searchIndex: { name: "search_title", filterFields: [] } }),
    featured: checkbox(),
  },
  admin: {
    view: {
      searchFields: ["title"],
      serverPageSize: 3,
      pageSizeOptions: [5, 10, 25, 50, 100],
      sort: { field: "_creationTime", order: "desc" },
      pageSize: 10,
    },
    views: [{ viewId: "cfg1", name: "Featured", state: { where: { field: "featured", op: "eq", value: true } } }],
  },
});
const versionedBanner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text() },
  versions: { drafts: true },
});
const mediaImages = {
  slug: "images",
  fields: { alt: text() },
  labels: { singular: "Image", plural: "Images" },
  admin: {
    useAsTitle: "_id",
    components: {},
    view: { state: { pageSize: 25, serverPageSize: 25 } },
  },
  meta: { storageAdapter: "convex" },
  versions: { drafts: false },
} as unknown as VexConfig["mediaCollections"][number];

const config = defineConfig({
  collections: [versionedPosts, plainPages, viewsPosts, relDocs],
  globals: [versionedBanner],
  mediaCollections: [mediaImages],
}) as unknown as VexConfig;

async function render(
  path: string[],
  searchParams: Record<string, string> = {},
  options: { auth?: VexApiAuth; config?: VexConfig; token?: string } = {},
) {
  return NextAdminPage({
    config: options.config ?? config,
    params: Promise.resolve({ path }),
    searchParams: Promise.resolve(searchParams),
    tokenPromise: options.token !== undefined ? Promise.resolve(options.token) : undefined,
    authPromise: options.auth !== undefined ? Promise.resolve(options.auth) : undefined,
  });
}

/**
 * Finds one `funcRef`/`args` query's dehydrated cache entry inside the `HydrationBoundary`
 * `state` `NextAdminPage`'s collection-list branch wraps its return in — every per-request
 * data fetch (`findPaginated`/`search`, `peek`, `listViews`) is prefetched+dehydrated
 * un-awaited now (shell-streaming follow-up, parts 1-3 complete), none threaded as explicit
 * `initial*` props anymore.
 */
function dehydratedQueryState(element: unknown, funcRef: Parameters<typeof getFunctionName>[0], args: Record<string, unknown>) {
  const wrapped = element as { props: { children: { type: unknown; props: { state: { queries: unknown[] } } } } };
  const child = wrapped.props.children;
  expect(child.type).toBe(HydrationBoundary);
  const queries = child.props.state.queries as { queryKey: unknown[]; state: { status: string; data: unknown } }[];
  const name = getFunctionName(funcRef);
  const match = queries.find((q) => q.queryKey[1] === name && JSON.stringify(q.queryKey[2]) === JSON.stringify(args));
  expect(match).toBeDefined();
  return match?.state;
}

/** The `VexAuthProvider` `value` prop `NextAdminPage` wrapped its return in. */
function authValue(element: unknown): VexApiAuth {
  const wrapped = element as { type: unknown; props: { value: VexApiAuth } };
  expect(wrapped.type).toBe(VexAuthProvider);
  return wrapped.props.value;
}

/** The args `NextAdminPage` passed to `fetchQuery` for one endpoint. */
function prefetchArgs(endpoint: unknown) {
  const call = fetchQueryMock.mock.calls.find(([fn]) => fn === endpoint);
  expect(call).toBeDefined();
  return call?.[1];
}

/**
 * The `initialFilterValueTitles` prop `NextAdminPage`'s collection-list branch
 * passed to `<CollectionListView>` (Decision 50) — navigates the same element
 * tree `authValue`/`dehydratedQueryState` already drill into:
 * `VexAuthProvider > HydrationBoundaryClient > [AdminTopNav, <div>{children}</div>]`,
 * where `children` is the `<CollectionListView>` element itself (stubbed, but
 * still a real element carrying every prop `NextAdminPage` passed it).
 */
function filterValueTitlesProp(element: unknown): Record<string, string | null> | undefined {
  const wrapped = element as {
    props: {
      children: {
        props: { children: [unknown, { props: { children: { props: { initialFilterValueTitles?: Record<string, string | null> } } } }] };
      };
    };
  };
  return wrapped.props.children.props.children[1].props.children.props.initialFilterValueTitles;
}

// Hydrated `initialData` seeds the CLIENT's query key, so a prefetch whose args
// differ from the view's own query paints one result and then swaps to another
// (or, for the edit view, rendered "not found" and then crashed on the hook
// count). Each expectation below is the exact args the matching view sends.
describe("NextAdminPage — prefetch args match the view's client query", () => {
  beforeEach(() => {
    fetchQueryMock.mockReset().mockResolvedValue(null);
  });

  it("list page of a versioned collection prefetches with drafts: true (CollectionListView)", async () => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([]);
      return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
    });
    await render(["collections", "posts"]);
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ collection: "posts", drafts: true, depth: 1 });
  });

  it("list page of a non-versioned collection prefetches without drafts", async () => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([]);
      return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
    });
    await render(["collections", "pages"]);
    expect(prefetchArgs(vexConvexApi.findPaginated)?.drafts).toBeUndefined();
  });

  it("edit page of a versioned collection prefetches with drafts: true (CollectionEditView)", async () => {
    await render(["collections", "posts", "doc1"]);
    expect(prefetchArgs(vexConvexApi.get)).toEqual({ id: "doc1", collection: "posts", drafts: true });
  });

  it("edit page of a non-versioned collection prefetches with no drafts key at all (Decision 5: buildGetArgs omits drafts, never sends a concrete false)", async () => {
    await render(["collections", "pages", "doc1"]);
    expect(prefetchArgs(vexConvexApi.get)).toEqual({ id: "doc1", collection: "pages" });
  });

  it("edit page of a versioned global prefetches with drafts: true (GlobalEditView)", async () => {
    await render(["globals", "banner"]);
    expect(prefetchArgs(vexConvexApi.globals.get)).toEqual({ slug: "banner", drafts: true });
  });
});

const sharedViewFixture = {
  viewId: "shared1",
  name: "Team view",
  collection: "posts2",
  createdBy: "user1",
  state: { sort: { field: "title", order: "desc" } as const, pageSize: 50 },
};

describe("NextAdminPage — list view prerender (Design Decision 39)", () => {
  beforeEach(() => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([sharedViewFixture]);
      if (fn === vexConvexApi.findPaginated) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      if (fn === vexConvexApi.search) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      return Promise.resolve(null);
    });
  });

  it("a default list prefetches findPaginated with the collection's own defaults", async () => {
    await render(["collections", "posts2"]);
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      collection: "posts2",
      where: undefined,
      sort: { field: "_creationTime", order: "desc" },
      paginationOpts: { numItems: 10, totalDocs: true, cursor: null },
    });
  });

  it("q switches the prefetch to search, with the searchField's declared index", async () => {
    await render(["collections", "posts2"], { q: "hello" });
    expect(prefetchArgs(vexConvexApi.search)).toMatchObject({
      collection: "posts2",
      searchIndexName: "search_title",
      searchField: "title",
      query: "hello",
    });
  });

  it("sort flows straight into findPaginated's args", async () => {
    await render(["collections", "posts2"], { sort: "title.asc" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ sort: { field: "title", order: "asc" } });
  });

  it("filter decodes to the same where shape the filter builder produces", async () => {
    await render(["collections", "posts2"], { filter: "(featured.eq.true)" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      where: { field: "featured", op: "eq", value: true },
    });
  });

  it("size changes paginationOpts.numItems (serverPageSize is 3, below the requested size)", async () => {
    await render(["collections", "posts2"], { size: "5" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ paginationOpts: { numItems: 5 } });
  });

  it("a shared view's own sort/pageSize apply when the URL carries neither — an unmodified shared link", async () => {
    await render(["collections", "posts2"], { view: "shared:shared1" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      sort: { field: "title", order: "desc" },
      paginationOpts: { numItems: 50 },
    });
  });

  it("a config view's hidden filter composes alone when the caller adds no filter of their own", async () => {
    await render(["collections", "posts2"], { view: "config:cfg1" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      where: { field: "featured", op: "eq", value: true },
    });
  });

  it("a local view's full URL state is used as-is — no server-side view to look up", async () => {
    await render(["collections", "posts2"], { view: "local:loc1", sort: "title.desc", filter: "(featured.eq.true)" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      sort: { field: "title", order: "desc" },
      where: { field: "featured", op: "eq", value: true },
    });
  });

  it("peek= prefetches get with the same args ListViewPeek's useVexDocQuery sends (Decision 5: no drafts key for a non-versioned collection)", async () => {
    await render(["collections", "posts2"], { peek: "doc1" });
    expect(prefetchArgs(vexConvexApi.get)).toEqual({ id: "doc1", collection: "posts2" });
  });

  it("every render prefetches listViews once, for the tabs", async () => {
    await render(["collections", "posts2"]);
    expect(prefetchArgs(vexConvexApi.listViews)).toEqual({ collection: "posts2" });
  });

  it("a caller denied readViews gets no shared views, but the render still succeeds", async () => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([]);
      if (fn === vexConvexApi.findPaginated) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      return Promise.resolve(null);
    });
    await render(["collections", "posts2"]);
    expect(prefetchArgs(vexConvexApi.listViews)).toEqual({ collection: "posts2" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ collection: "posts2" });
  });

  it("an unindexed sort failing the find prefetch never crashes the page — the error streams as a rejected query, not a thrown exception", async () => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([]);
      if (fn === vexConvexApi.findPaginated) {
        return Promise.reject(
          new VexError({
            code: "UNINDEXED_SORT",
            message: 'sort.field "title" leads no index on collection "posts2".',
          }),
        );
      }
      return Promise.resolve(null);
    });
    // `NextAdminPage` itself never throws/rejects — the `.catch(() => undefined)` on the
    // unawaited `prefetchQuery` call only guards an unhandled-rejection warning; the
    // rejection itself lands in the dehydrated query's OWN error state (Design Decision
    // 9/32 — a URL must never crash the page), which `CollectionListViewData`'s
    // `useSuspenseQuery` re-throws into on the client, rendering the SAME `ListViewQueryError`
    // this used to pass down as `initialQueryError` — now entirely the client's own
    // `pagination.error` handling (`CollectionListView.test.tsx` covers that directly).
    await expect(render(["collections", "posts2"], { sort: "title.asc" })).resolves.toBeDefined();
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ collection: "posts2" });
  });

  it("an unknown/denied peek id never crashes the page — the rejection streams as a pending/error query, not a thrown exception", async () => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([]);
      if (fn === vexConvexApi.findPaginated) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      if (fn === vexConvexApi.get) return Promise.reject(new Error("ACCESS_DENIED"));
      return Promise.resolve(null);
    });
    const element = await render(["collections", "posts2"], { peek: "denied-doc" });
    // `peek` is no longer awaited by `NextAdminPage` at all (shell-streaming follow-up, part
    // 2) — its dehydrated status at the moment `dehydrate()` runs depends on real network
    // timing, same as it would in production: "pending" (still streaming, the common case —
    // settles via a LATER chunk of the SAME response, `ListViewPeek`'s own `<Suspense>` boundary
    // catches it) or "error" (already settled by then) are both valid, non-crashing outcomes;
    // "undefined" (never registered at all) would be the actual bug.
    expect(["pending", "error"]).toContain(
      dehydratedQueryState(element, vexConvexApi.get, { id: "denied-doc", collection: "posts2" })?.status,
    );
  });

  it("a listViews failure never crashes the page — the view falls back to the URL's own state", async () => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.reject(new Error("internal error"));
      if (fn === vexConvexApi.findPaginated) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      return Promise.resolve(null);
    });
    const element = await render(["collections", "posts2"], { view: "shared:does-not-matter" });
    // `listViews`'s own PREFETCH is now explicitly awaited for a `shared:` view (developer-
    // reported column-flash fix, below) — its dehydrated status is deterministically
    // "error" here (the rejection above has already been awaited by `dehydrate()` time),
    // same honesty as the `peek` test above; "undefined" (never registered) would be the bug.
    expect(dehydratedQueryState(element, vexConvexApi.listViews, { collection: "posts2" })?.status).toBe("error");
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ collection: "posts2" });
  });

  it("a shared view's listViews prefetch is awaited — dehydrated status is 'success', not 'pending' (developer-reported column-flash fix)", async () => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([sharedViewFixture]);
      if (fn === vexConvexApi.findPaginated) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      if (fn === vexConvexApi.search) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      return Promise.resolve(null);
    });
    const element = await render(["collections", "posts2"], { view: "shared:shared1" });
    // Unlike a default/config/local view (still streamed un-awaited — see the "perf: a
    // default view's find starts without waiting" test below), a `shared:` view's own
    // `CollectionListView.tsx` seeds its `visibleColumns`/`columnOrder` state (the
    // skeleton's column count, not just `SavedListViewTabs`' own tab strip) from a PLAIN
    // (non-suspense) `useSavedListViews()` read of this exact query — which only sees the
    // right answer on its very first render if the dehydrated cache already shows
    // "success", not "pending" (a plain `useQuery` never blocks waiting for a pending
    // entry to resolve). This is the server-side half of that fix.
    expect(dehydratedQueryState(element, vexConvexApi.listViews, { collection: "posts2" })?.status).toBe(
      "success",
    );
  });

  it("a default view's listViews prefetch is awaited, so shared tabs are in the first paint (developer-reported pop-in fix — reverses the prior 'await only for shared' perf decision)", async () => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([sharedViewFixture]);
      return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
    });
    const element = await render(["collections", "posts2"]);
    // `view=shared:` already awaited `listViews` before this fix (see the test above) — the
    // bug was every OTHER view source ("streamed, not awaited", a prior perf optimization)
    // leaving its dehydrated entry `"pending"`, so the client painted the tab strip's
    // no-shared-tabs fallback before the shared tabs streamed in. This is a DEFAULT view
    // (no `view=` at all) — proves the fix covers that case too, not just `shared:`.
    expect(dehydratedQueryState(element, vexConvexApi.listViews, { collection: "posts2" })?.status).toBe(
      "success",
    );
  });

  it("perf: a default view's find starts without waiting for listViews to resolve first", async () => {
    const callOrder: string[] = [];
    // `Promise.withResolvers` isn't in this package's configured TS lib target — the
    // executor form is the only option here, not a style choice (matches
    // `useSavedListViewPrefetch.test.ts`'s own identical precedent).
    let resolveListViews: (value: unknown[]) => void = () => {};
    const listViewsPromise = new Promise<unknown[]>((resolve) => {
      resolveListViews = resolve;
    });
    let resolveFindPaginatedCalled: () => void = () => {};
    const findPaginatedCalled = new Promise<void>((resolve) => {
      resolveFindPaginatedCalled = resolve;
    });
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) {
        callOrder.push("listViews:called");
        return listViewsPromise;
      }
      if (fn === vexConvexApi.findPaginated) {
        callOrder.push("findPaginated:called");
        resolveFindPaginatedCalled();
        return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      }
      return Promise.resolve(null);
    });
    const renderPromise = render(["collections", "posts2"]);
    // Awaits the REAL signal the code exposes (findPaginated being invoked), not a
    // guessed duration — deterministic regardless of machine speed. `listViews` is
    // deliberately left unresolved at this point.
    await findPaginatedCalled;
    expect(callOrder).not.toContain("listViews:resolved");
    resolveListViews([]);
    callOrder.push("listViews:resolved");
    await renderPromise;
    // `findPaginated` was CALLED before `listViews` ever resolved — proves it never
    // awaited `listViews`'s own result first (the regression this perf fix prevents).
    expect(callOrder.indexOf("findPaginated:called")).toBeLessThan(callOrder.indexOf("listViews:resolved"));
  });

  it("perf: a shared view's find waits for listViews to resolve (needs the view's own stored state)", async () => {
    const callOrder: string[] = [];
    let resolveListViews: (value: unknown[]) => void = () => {};
    const listViewsPromise = new Promise<unknown[]>((resolve) => {
      resolveListViews = resolve;
    });
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) {
        callOrder.push("listViews:called");
        return listViewsPromise;
      }
      if (fn === vexConvexApi.findPaginated) {
        callOrder.push("findPaginated:called");
        return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      }
      return Promise.resolve(null);
    });
    const renderPromise = render(["collections", "posts2"], { view: "shared:shared1" });
    // Flushes the microtask queue (no real time elapses — distinct from a wall-clock
    // timer) without ever resolving `listViews`: if `findPaginated` were (incorrectly)
    // called before `listViews` resolves, it would show up in `callOrder` by now.
    for (let i = 0; i < 20; i++) await Promise.resolve();
    expect(callOrder).not.toContain("findPaginated:called");
    resolveListViews([sharedViewFixture]);
    await renderPromise;
    expect(callOrder.indexOf("findPaginated:called")).toBeGreaterThan(callOrder.indexOf("listViews:called"));
    // And it actually used the shared view's own stored state, not the collection default.
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      sort: { field: "title", order: "desc" },
      paginationOpts: { numItems: 50 },
    });
  });
});

describe("NextAdminPage — initialFilterValueTitles (Decision 50)", () => {
  /** Encodes `where` into the `?filter=` URL grammar `relDocs` itself (`listViewUrlState.ts`) expects. */
  function filterParam(where: unknown) {
    const qs = serializeListViewUrlState({ params: { filter: where as never }, collection: relDocs }).toString();
    return new URLSearchParams(qs).get("filter") ?? "";
  }

  beforeEach(() => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown, args: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([]);
      if (fn === vexConvexApi.findPaginated) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      if (fn === vexConvexApi.get) {
        const a = args as { id: string; collection: string };
        if (a.collection === "pages" && a.id === "page1") return Promise.resolve({ _id: "page1", title: "About Us" });
        if (a.collection === "images" && a.id === "img1") return Promise.resolve({ _id: "img1", alt: "Hero" });
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });
  });

  it("resolves a relationship filter's id to its target document's title", async () => {
    const element = await render(["collections", "rel_docs"], {
      filter: filterParam({ field: "page", op: "eq", value: "page1" }),
    });
    expect(filterValueTitlesProp(element)).toEqual({ page1: "About Us" });
  });

  it("resolves an upload filter's id via the field's `to`, not `collection.slug`", async () => {
    const element = await render(["collections", "rel_docs"], {
      filter: filterParam({ field: "cover", op: "eq", value: "img1" }),
    });
    // `mediaImages`'s fixture `useAsTitle` is `_id`, so the title IS the id here — still
    // proves `to` (not a nonexistent `collection.slug`) resolved the right target collection.
    expect(filterValueTitlesProp(element)).toEqual({ img1: "img1" });
    expect(prefetchArgs(vexConvexApi.get)).toMatchObject({ collection: "images", id: "img1" });
  });

  it("degrades to null for a not-found/denied id — never crashes the page (Decision 9/32)", async () => {
    const element = await render(["collections", "rel_docs"], {
      filter: filterParam({ field: "page", op: "eq", value: "missing" }),
    });
    expect(filterValueTitlesProp(element)).toEqual({ missing: null });
  });

  it("dedupes the same id repeated across an OR filter into exactly one fetch", async () => {
    const element = await render(["collections", "rel_docs"], {
      filter: filterParam({
        or: [
          { field: "page", op: "eq", value: "page1" },
          { field: "page", op: "eq", value: "page1" },
        ],
      }),
    });
    expect(fetchQueryMock.mock.calls.filter(([fn]) => fn === vexConvexApi.get).length).toBe(1);
    expect(filterValueTitlesProp(element)).toEqual({ page1: "About Us" });
  });

  it("skips isEmpty/isNotEmpty leaves (no concrete id) — no fetch, empty titles map", async () => {
    const element = await render(["collections", "rel_docs"], {
      filter: filterParam({ field: "page", op: "eq", value: undefined }),
    });
    expect(filterValueTitlesProp(element)).toEqual({});
    expect(fetchQueryMock.mock.calls.some(([fn]) => fn === vexConvexApi.get)).toBe(false);
  });

  it("no active filter at all — empty titles map, no extra fetch", async () => {
    const element = await render(["collections", "rel_docs"]);
    expect(filterValueTitlesProp(element)).toEqual({});
    expect(fetchQueryMock.mock.calls.some(([fn]) => fn === vexConvexApi.get)).toBe(false);
  });
});

describe("NextAdminPage — unrecognized first path segment", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    fetchQueryMock.mockReset().mockResolvedValue(null);
  });

  it("calls notFound() for a bare collection slug (old /admin/<slug> shape)", async () => {
    await expect(render(["posts"])).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it("calls notFound() for an unknown first segment", async () => {
    await expect(render(["nonsense", "posts"])).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});

describe("NextAdminPage — collections/globals index routes", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    fetchQueryMock.mockReset().mockResolvedValue(null);
  });

  it("renders the collections index (CollectionsIndexView) for collections/ with no slug, no notFound()", async () => {
    await expect(render(["collections"])).resolves.toBeTruthy();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("renders the globals index (GlobalsListView) for globals/ with no slug, no notFound()", async () => {
    await expect(render(["globals"])).resolves.toBeTruthy();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});

describe("NextAdminPage — server auth (Decision 44, revised: auth is optional)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function buildAccess(permissions: VexAccessConfig["permissions"]): VexAccessConfig {
    return {
      roles: Object.keys(permissions),
      userCollectionSlug: "users",
      userRolesField: "roles",
      enabled: true,
      defaultPermissionMode: "deny",
      organizations: false,
      resources: [],
      permissions,
    } as VexAccessConfig;
  }

  // `config` plus one `access` swapped in, bypassing `defineConfig`'s own
  // `validateAccessConfig` call — like `resolveFieldPermissions.test.ts`'s own
  // hand-assembled configs, these exist only to drive `resolveFieldPermissions`, never a
  // real `defineAccess()` registry.
  function configWithAccess(access: VexAccessConfig): VexConfig {
    return { ...config, access };
  }

  const readerDeniesTitle = buildAccess({
    reader: { posts2: { read: () => ({ "*": true, title: false }) } },
  });
  const adminAllowsAll = buildAccess({ admin: { posts2: { read: true } } });

  beforeEach(() => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([]);
      return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
    });
  });

  it("access absent, no auth: unrestricted — the full searchField reaches the search prefetch, no warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = await render(["collections", "posts2"], { q: "hello" });
    expect(authValue(element)).toEqual({ user: null });
    expect(prefetchArgs(vexConvexApi.search)).toMatchObject({ searchField: "title" });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("access enabled, no auth: fails closed to an anonymous caller AND warns once, dev-only", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cfg = configWithAccess(readerDeniesTitle);
    const first = await render(["collections", "posts2"], { q: "hello" }, { config: cfg });
    const second = await render(["collections", "posts2"], { q: "hello" }, { config: cfg });
    expect(authValue(first)).toEqual({ user: null });
    expect(authValue(second)).toEqual({ user: null });
    // An anonymous caller resolves no role at all, so NOTHING is readable — the search
    // prefetch is skipped entirely (Decision 2's "no search bar" case), not just sent the
    // wrong searchField.
    expect(fetchQueryMock.mock.calls.some(([fn]) => fn === vexConvexApi.search)).toBe(false);
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ collection: "posts2" });
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain("NextAdminPage");
  });

  it("access config disabled (enabled: false): unrestricted even with a denying role config and no auth — no warning", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const cfg = configWithAccess({ ...readerDeniesTitle, enabled: false });
    await render(["collections", "posts2"], { q: "hello" }, { config: cfg });
    expect(prefetchArgs(vexConvexApi.search)).toMatchObject({ searchField: "title" });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("access enabled, allowed role: readable searchField reaches the search prefetch, VexAuthProvider gets the real auth", async () => {
    const auth: VexApiAuth = { user: { roles: ["admin"] } };
    const cfg = configWithAccess(adminAllowsAll);
    const element = await render(["collections", "posts2"], { q: "hello" }, { config: cfg, auth });
    expect(authValue(element)).toEqual(auth);
    expect(prefetchArgs(vexConvexApi.search)).toMatchObject({ searchField: "title", query: "hello" });
  });

  it("access enabled, denied role (every searchField entry unreadable): falls back to findPaginated even with q set", async () => {
    const auth: VexApiAuth = { user: { roles: ["reader"] } };
    const cfg = configWithAccess(readerDeniesTitle);
    const element = await render(["collections", "posts2"], { q: "hello" }, { config: cfg, auth });
    expect(authValue(element)).toEqual(auth);
    expect(fetchQueryMock.mock.calls.some(([fn]) => fn === vexConvexApi.search)).toBe(false);
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ collection: "posts2" });
  });

  it("the real reported case: anonymous viewer, local-view filter on vex_status (unreadable via access.anonRole) — render succeeds, prefetch is unfiltered, never an error (access-system-fields.md Decision 11)", async () => {
    const cfg = configWithAccess({
      roles: ["public"],
      anonRole: "public",
      userCollectionSlug: "users",
      userRolesField: "roles",
      enabled: true,
      defaultPermissionMode: "deny",
      organizations: false,
      resources: [],
      permissions: { public: { posts: { read: () => ({ "*": true, vex_status: false }) } } },
    } as VexAccessConfig);
    const element = await render(
      ["collections", "posts"],
      { view: "local:loc1", filter: "(vex_status.eq.published)" },
      { config: cfg },
    );
    // "Signed out" — a real anonymous caller, resolved through `access.anonRole`
    // (not the OTHER tests' "no role resolves at all" fails-closed case above —
    // this role explicitly grants read on every OTHER field).
    expect(authValue(element)).toEqual({ user: null });
    // Dropped before ever reaching the server — no rejected/empty-by-construction
    // query, no error. `ListViewFilterChips`'/`StaleSavedListViewNotice`'s own handling of
    // the resulting `staleFilterField` is covered by `resolveListViewQueryState.test.ts`
    // (the same core function, same inputs) and `CollectionListView.tsx`'s
    // straightforward prop-threading; this test's job is the SERVER half:
    // the prefetch itself must never carry the unreadable condition.
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ collection: "posts", where: undefined });
  });

  it("wraps every non-collection-list branch in VexAuthProvider too (dashboard, globals list, collection edit)", async () => {
    const auth: VexApiAuth = { user: { roles: ["admin"] } };
    fetchQueryMock.mockReset().mockResolvedValue(null);

    const dashboard = await render([], {}, { auth });
    expect(authValue(dashboard)).toEqual(auth);

    const globalsList = await render(["globals"], {}, { auth });
    expect(authValue(globalsList)).toEqual(auth);

    const edit = await render(["collections", "posts", "doc1"], {}, { auth });
    expect(authValue(edit)).toEqual(auth);
  });
});
