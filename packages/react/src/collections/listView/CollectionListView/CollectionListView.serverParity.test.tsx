import { createElement, type ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";
import {
  buildListViewFindQueryArgs,
  buildListViewSearchQueryArgs,
  checkbox,
  defineCollection,
  parseListViewUrlState,
  resolveListViewQueryState,
  text,
  vexConvexApi,
  type VexStoredView,
} from "@vexcms/core";
import { VexConfigProvider } from "../../../config/VexConfigContext";
import { CollectionListView } from "./index";

// `CollectionListView` reads its data through `useSavedListViews()`/`useVexListQuery()`, which
// need a Convex client, `@tanstack/react-query`'s `useQuery`/`useMutation`, and a
// `VexConfigContext` — mocked the same lightweight way `useSavedListViews.test.ts` and
// `SavedListViewTabs.test.tsx` do (no real Convex backend needed for an args-capture test),
// rather than the heavier `renderView` harness. Unlike those two files' own blanket
// `useQuery` stub, this one recognizes `useSavedListViews`' own `sharedQuery` by its query key
// (`vexConvexApi.listViews`) and seeds it with the SHARED-view fixture below directly (no
// `CollectionListViewProps.initialViews` to thread through anymore, polish fixes Decision 11),
// instead of always reading back `undefined`.
const project = "https://example.convex.cloud";

const convexQueryCalls: { fn: unknown; args: unknown }[] = [];

vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactModule>();
  return { ...actual, useConvex: () => ({ url: project }) };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    convexQuery: (fn: unknown, args: unknown) => {
      convexQueryCalls.push({ fn, args });
      // No `CollectionListViewProps.initialData`/`initialViews` to short-circuit
      // `useSuspenseQuery` anymore (polish fixes, Decision 11) — its `queryFn` genuinely
      // runs now, and TanStack Query disallows a query function resolving to `undefined`.
      // `findPaginated`/`search`'s own args always carry `paginationOpts`; `listViews`'s
      // own args (`{collection}`) never do — enough to tell the two apart and resolve each
      // to a minimally valid, empty shape (this file only asserts on the CAPTURED args
      // above, never on rendered row/view content).
      const hasPaginationOpts =
        typeof args === "object" && args !== null && "paginationOpts" in args;
      return {
        queryKey: [fn, args],
        queryFn: () =>
          Promise.resolve(hasPaginationOpts ? { page: [], continueCursor: "", isDone: true } : []),
      };
    },
    // `useSaveView()`/`useRemoveView()` (`../../client`) call this hook
    // eagerly to build their `mutationFn`, independent of the `useMutation` mock below —
    // `SavedListViewTabs`/`ListViewModifiedControls` mount unconditionally as part of
    // `CollectionListView`'s own tree, so this is needed even though no test here ever
    // saves/deletes a view.
    useConvexMutation: () => async () => {},
  };
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    // No `CollectionListViewProps.initialViews` to thread through anymore (polish fixes,
    // Decision 11) — `useSavedListViews`'s own `sharedQuery` is instead recognized here by its
    // `queryKey[0]` (`convexQuery`'s mock above tags it `[fn, args]`) matching
    // `vexConvexApi.listViews`, and seeded with `sharedViewFixture` directly (declared
    // further down this file — safe to reference here: this arrow function's body only runs
    // once `render()` actually calls `useQuery`, well after every module-level `const` in
    // this file has initialized). Every other `useQuery` call in this tree gets `undefined`,
    // same as before.
    useQuery: (options: { queryKey?: unknown[] }) => {
      const data =
        Array.isArray(options?.queryKey) && options.queryKey[0] === vexConvexApi.listViews
          ? [sharedViewFixture]
          : undefined;
      return {
        data,
        isPending: data === undefined,
        isFetching: false,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: () => {},
      };
    },
    useMutation: () => ({ mutateAsync: async () => {}, isPending: false }),
  };
});

const collection = defineCollection({
  slug: "parity_posts",
  fields: {
    title: text({ index: "by_title", searchIndex: { name: "search_title", filterFields: [] } }),
    slug: text({ searchIndex: { name: "search_slug", filterFields: [] } }),
    featured: checkbox(),
  },
  admin: {
    view: {
      searchFields: ["title", "slug"],
      pageSizeOptions: [5, 10, 25, 50, 100],
      serverPageSize: 3,
      pageSize: 10,
    },
    views: [{ viewId: "cfg1", name: "Featured", state: { where: { field: "featured", op: "eq", value: true } } }],
  },
});

// A versioned sibling fixture — used ONLY by the `vex_status` server-parity
// test below (Step 21 Part B follow-up, developer-reported: resizing/
// pinning the synthetic status column used to silently no-op). Kept
// SEPARATE from `collection` rather than enabling `versions.drafts` on
// it directly — every other test in this file asserts on `drafts:
// undefined` (`expectedServerArgs`'s own hardcoded local) and a plain,
// non-versioned `findPaginated`/`search` args shape; adding `vex_status`
// to that fixture would silently change EVERY other test's resolved
// `columns` (an unrelated, unwanted diff) instead of only this one.
const versionedCollection = defineCollection({
  slug: "parity_versioned_posts",
  fields: { title: text({ required: false }) },
  versions: { drafts: true },
  admin: {
    view: { pageSize: 10 },
  },
});

// `basePath` is required by `ListViewCreateAction`'s `adminHref()` call (header
// actions always render) — every prior test here only asserted on captured
// `convexQueryCalls`, so a header-render crash never surfaced; the new
// `cols` test below asserts on the rendered DOM itself, which does need
// the header to render cleanly.
const testConfig = {
  collections: [collection, versionedCollection],
  basePath: "/admin",
} as unknown as Parameters<typeof VexConfigProvider>[0]["config"];

const sharedViewFixture: VexStoredView = {
  viewId: "shared1",
  name: "Team view",
  collection: "parity_posts",
  createdBy: "user1",
  state: { sort: { field: "title", order: "desc" }, pageSize: 50 },
};

function wrapper(searchParams: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient();
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(NuqsTestingAdapter, {
        searchParams,
        children: createElement(VexConfigProvider, { config: testConfig, children }),
      }),
    );
  };
}

/** The args actually sent to `convexQuery` for one endpoint, across every call captured during the render. */
function clientArgs(fn: unknown): unknown[] {
  return convexQueryCalls.filter((call) => call.fn === fn).map((call) => call.args);
}

/**
 * Computes the args `NextAdminPage` would prefetch for the same URL — via the SAME core
 * functions it calls (`parseListViewUrlState` → `resolveListViewQueryState` → `buildListViewFindQueryArgs`/
 * `buildListViewSearchQueryArgs`), not by invoking the server component itself (a different
 * package) — exactly as `NextAdminPage.tsx` is written.
 */
function expectedServerArgs(props: {
  searchParams: string;
  configView?: (typeof collection)["admin"]["views"][number];
  sharedView?: VexStoredView;
}) {
  const params = parseListViewUrlState({ searchParams: new URLSearchParams(props.searchParams), collection });
  const resolved = resolveListViewQueryState({
    collection,
    params,
    configView: props.configView,
    sharedView: props.sharedView,
  });
  const numItems = Math.max(collection.admin.view.state.serverPageSize, resolved.pageSize);
  const drafts = undefined;
  return resolved.search.length > 0
    ? {
        fn: vexConvexApi.search,
        args: buildListViewSearchQueryArgs({
          collection,
          where: resolved.where,
          search: resolved.search,
          searchField: resolved.searchField as string,
          drafts,
          numItems,
        }),
      }
    : {
        fn: vexConvexApi.findPaginated,
        args: buildListViewFindQueryArgs({
          collection,
          where: resolved.where,
          sort: resolved.sort,
          drafts,
          depth: 1,
          numItems,
        }),
      };
}

beforeEach(() => {
  convexQueryCalls.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

// `NextAdminPage` (server, Design Decision 39) and `CollectionListView` (client) must send
// IDENTICAL `findPaginated`/`search` Convex args for the same URL state, or the server's
// prefetched `initialData` hydrates under the wrong query key and the list repaints right
// after hydration (layout-stability.md) — the exact developer-reported bug this test guards
// (reversed row order on first paint: the server defaulted `sort` to the collection's
// `defaultView.sort`, the client sent no `sort` at all, Convex's own `.order()` default disagreed).
// Both sides now go through core's `resolveListViewQueryState` — these tests prove
// `CollectionListView`'s real wiring produces exactly what `NextAdminPage` would.
describe("CollectionListView — server parity (layout-stability.md)", () => {
  it("default (no sort param) falls back to the collection's own defaultView.sort on BOTH sides — the reported bug", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), { wrapper: wrapper("") });
    const expected = expectedServerArgs({ searchParams: "" });
    expect(expected.args).toMatchObject({ sort: { field: "_creationTime", order: "desc" } });
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("q switches both sides to search mode with the default searchField", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), { wrapper: wrapper("?q=hello") });
    const expected = expectedServerArgs({ searchParams: "?q=hello" });
    expect(expected.fn).toBe(vexConvexApi.search);
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("q+qf honors an explicit searchField on both sides", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), {
      wrapper: wrapper("?q=hello&qf=slug"),
    });
    const expected = expectedServerArgs({ searchParams: "?q=hello&qf=slug" });
    expect(expected.args).toMatchObject({ searchField: "slug" });
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("sort flows straight into both sides' findPaginated args", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), {
      wrapper: wrapper("?sort=title.asc"),
    });
    const expected = expectedServerArgs({ searchParams: "?sort=title.asc" });
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("filter decodes to the same where shape on both sides", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), {
      wrapper: wrapper("?filter=(featured.eq.true)"),
    });
    const expected = expectedServerArgs({ searchParams: "?filter=(featured.eq.true)" });
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("a preset (config) view's hidden filter composes identically on both sides", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), {
      wrapper: wrapper("?view=config:cfg1"),
    });
    const expected = expectedServerArgs({ searchParams: "?view=config:cfg1", configView: collection.admin.views[0] });
    expect(expected.args).toMatchObject({ where: { field: "featured", op: "eq", value: true } });
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("an unmodified shared-view link uses the view's own saved sort/pageSize on both sides", () => {
    render(
      createElement(CollectionListView, { collection: "parity_posts" }),
      { wrapper: wrapper("?view=shared:shared1") },
    );
    const expected = expectedServerArgs({ searchParams: "?view=shared:shared1", sharedView: sharedViewFixture });
    expect(expected.args).toMatchObject({
      sort: { field: "title", order: "desc" },
      paginationOpts: { numItems: 50 },
    });
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("a local view's full URL state is used as-is on both sides — no server-side view to look up", () => {
    const searchParams = "?view=local:loc1&sort=title.desc&filter=(featured.eq.true)";
    render(createElement(CollectionListView, { collection: "parity_posts" }), { wrapper: wrapper(searchParams) });
    const expected = expectedServerArgs({ searchParams });
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("size changes paginationOpts.numItems on both sides (serverPageSize is 3, below the requested size)", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), { wrapper: wrapper("?size=25") });
    const expected = expectedServerArgs({ searchParams: "?size=25" });
    expect(expected.args).toMatchObject({ paginationOpts: { numItems: 25 } });
    expect(clientArgs(expected.fn)).toContainEqual(expected.args);
  });

  it("cols flows into resolved.columns identically on both sides — the server's own prerender order (Decision 48)", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), {
      wrapper: wrapper("?cols=featured,title,slug"),
    });
    const params = parseListViewUrlState({
      searchParams: new URLSearchParams("?cols=featured,title,slug"),
      collection,
    });
    const expected = resolveListViewQueryState({ collection, params });
    // `completeListViewColumnOrder` appends every field `cols` didn't name,
    // explicitly hidden — here just the auto-injected `updatedAt` —
    // after the explicit order.
    expect(expected.columns).toEqual(["featured", "title", "slug", { field: "updatedAt", hidden: true }]);
    // The client's own rendered `<th>` order must match the SAME
    // `completeListViewColumnOrder`-resolved sequence the server would prerender
    // for this URL — `CollectionListView`'s `columns` state seeds
    // from `urlState.cols` via the identical core function, so a
    // `cols=` link never repaints its column order after hydration.
    // `<th>`'s implicit `columnheader` role isn't computed by this jsdom
    // setup (queried by tag directly instead, same as this file's other
    // DOM-shape checks).
    const headers = Array.from(document.querySelectorAll("th")).map((h) => h.textContent);
    // `select` (checkbox, no text) then the real fields in `cols`' own
    // order, then `actions` (no text) — asserts just the real fields'
    // relative sequence survives inside the full header row. `updatedAt`
    // is hidden (not named in `cols=`), so it renders no `<th>` at all.
    const realFieldHeaders = headers.filter((text) => text === "featured" || text === "title" || text === "slug");
    expect(realFieldHeaders).toEqual(["featured", "title", "slug"]);
    expect(headers).not.toContain("updatedAt");
  });

  it("cols narrows the visible columns identically on BOTH sides' very FIRST render — no hidden-columns flash (developer-reported)", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), {
      wrapper: wrapper("?cols=title"),
    });
    const params = parseListViewUrlState({ searchParams: new URLSearchParams("?cols=title"), collection });
    const expected = resolveListViewQueryState({ collection, params });
    // `cols=title` names exactly one field — every other field completes
    // in, explicitly hidden.
    expect(expected.columns.filter((e) => typeof e === "string" || !e.hidden)).toEqual(["title"]);
    // The client's FIRST (synchronous) render — no `waitFor`/`act` here —
    // must already show ONLY "title", never a wider set that later
    // narrows: `CollectionListView`'s `columns` state is seeded
    // directly from `resolveListViewQueryState`'s own return, not corrected
    // by a later `useEffect`.
    const headers = Array.from(document.querySelectorAll("th")).map((h) => h.textContent);
    expect(headers).not.toContain("featured");
    expect(headers).not.toContain("slug");
    expect(headers).not.toContain("updatedAt");
    expect(headers).toContain("title");
  });

  it("a config view with no explicit columns falls back to the collection's full default identically on the FIRST render — the config-view SSR-parity source", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), {
      wrapper: wrapper("?view=config:cfg1"),
    });
    const expected = resolveListViewQueryState({
      collection,
      params: parseListViewUrlState({ searchParams: new URLSearchParams("?view=config:cfg1"), collection }),
      configView: collection.admin.views[0],
    });
    // `cfg1` declares no explicit `columns` — resolves to every field,
    // same as an unmodified default view, all visible.
    expect(expected.columns).toEqual(["title", "slug", "featured", "updatedAt"]);
    const headers = Array.from(document.querySelectorAll("th")).map((h) => (h.textContent ?? "").toLowerCase().replace(/\s+/g, ""));
    for (const field of expected.columns) {
      expect(headers.some((h) => h.includes(String(field).toLowerCase()))).toBe(true);
    }
  });

  it("cols' width/pinned overrides resolve identically on BOTH sides and render into the DOM on the client's very FIRST render (Step 21 Part B, Decision 48)", () => {
    render(createElement(CollectionListView, { collection: "parity_posts" }), {
      wrapper: wrapper("?cols=title:w300:pl,slug,featured"),
    });
    const params = parseListViewUrlState({
      searchParams: new URLSearchParams("?cols=title:w300:pl,slug,featured"),
      collection,
    });
    const expected = resolveListViewQueryState({ collection, params });
    // The SAME resolved entry a server prerender would compute —
    // `NextAdminPage.tsx` calls this identical core chain
    // (`parseListViewUrlState` → `resolveListViewQueryState`) with no column-specific
    // code of its own: it renders the SAME `CollectionListView`/`DataTable`
    // component tree the client does, so a resolved entry here already IS
    // the server's own value, not just an independently-reimplemented copy.
    expect(expected.columns).toEqual([
      { field: "title", width: 300, pinned: "left" },
      "slug",
      "featured",
      { field: "updatedAt", hidden: true },
    ]);
    // The client's FIRST render must already reflect the resolved width (a
    // real inline `width` style, not a post-mount correction) and the
    // sticky-left pin (a real `position: sticky` + `left` offset) — proves
    // `getCollectionColumnDefs`'s `resolveListViewColumnConfig`-sourced `size` and
    // `DataTable`'s own `columnPinning` both reflect `resolved.columns`
    // synchronously, the same Δ0 guarantee order/visibility already had.
    const titleHeader = Array.from(document.querySelectorAll("th")).find((h) => h.textContent === "title");
    expect(titleHeader).toBeDefined();
    expect(titleHeader!.style.width).toBe("300px");
    expect(titleHeader!.className).toContain("sticky");
    expect(titleHeader!.style.left).toBe("48px");
  });

  it("a versioned collection's cols can resize vex_status directly, same as any real field, and it renders into the DOM on the client's very FIRST render (developer-reported: resizing it used to silently snap back since it had no ColumnEntry to persist against)", () => {
    render(createElement(CollectionListView, { collection: "parity_versioned_posts" }), {
      wrapper: wrapper("?cols=vex_status:w220,title"),
    });
    const params = parseListViewUrlState({
      searchParams: new URLSearchParams("?cols=vex_status:w220,title"),
      collection: versionedCollection,
    });
    const expected = resolveListViewQueryState({ collection: versionedCollection, params });
    expect(expected.columns).toEqual([
      { field: "vex_status", width: 220 },
      "title",
      { field: "updatedAt", hidden: true },
    ]);
    const statusHeader = Array.from(document.querySelectorAll("th")).find((h) => h.textContent === "Status");
    expect(statusHeader).toBeDefined();
    expect(statusHeader!.style.width).toBe("220px");
  });

  it("a versioned collection's cols can pin vex_status right, same as any real field (used to be un-pinnable entirely)", () => {
    render(createElement(CollectionListView, { collection: "parity_versioned_posts" }), {
      wrapper: wrapper("?cols=title,vex_status:pr"),
    });
    const statusHeader = Array.from(document.querySelectorAll("th")).find((h) => h.textContent === "Status");
    expect(statusHeader).toBeDefined();
    expect(statusHeader!.className).toContain("sticky");
    expect(statusHeader!.style.right).not.toBe("");
  });

  it("a versioned collection's cols can hide vex_status, same as any real field (now hideable — used to be hardcoded always-visible)", () => {
    render(createElement(CollectionListView, { collection: "parity_versioned_posts" }), {
      wrapper: wrapper("?cols=title,vex_status:h"),
    });
    const statusHeader = Array.from(document.querySelectorAll("th")).find((h) => h.textContent === "Status");
    expect(statusHeader).toBeUndefined();
  });

  it("a versioned collection with no cols at all still shows vex_status FIRST and visible — preserves today's default for every existing view", () => {
    render(createElement(CollectionListView, { collection: "parity_versioned_posts" }), {
      wrapper: wrapper(""),
    });
    const headers = Array.from(document.querySelectorAll("th")).map((h) => h.textContent);
    const statusIndex = headers.indexOf("Status");
    const titleIndex = headers.indexOf("title");
    expect(statusIndex).toBeGreaterThanOrEqual(0);
    expect(statusIndex).toBeLessThan(titleIndex);
  });
});
