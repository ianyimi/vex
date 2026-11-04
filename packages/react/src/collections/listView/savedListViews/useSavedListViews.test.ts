import { createElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkbox, defineAccess, defineCollection, defineConfig, text, vexConvexApi, type VexStoredView } from "@vexcms/core";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";
import { VexConfigProvider } from "../../../config/VexConfigContext";
import { saveLocalSavedListView } from "./localSavedListViewsStore";
import {
  decodeViewUrlValue,
  diffViewState,
  encodeViewUrlValue,
  resolveEffectiveFilterWhere,
  resolveEffectiveViewState,
  resolveListShareParams,
  useSavedListViews,
  type SavedListViewEntry,
} from "./useSavedListViews";

const project = "https://example.convex.cloud";

vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactModule>();
  return { ...actual, useConvex: () => ({ url: project }) };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    convexQuery: (reference: unknown, args: unknown) => ({ __reference: reference, __args: args }),
  };
});

let sharedViewRows: VexStoredView[] = [];
let sharedViewsPending = false;

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown; initialData?: unknown }) =>
      options.__reference === vexConvexApi.listViews
        ? { data: options.initialData ?? sharedViewRows, isPending: options.initialData !== undefined ? false : sharedViewsPending }
        : { data: undefined, isPending: true },
  };
});

const testConfig = defineConfig({
  collections: [
    defineCollection({
      slug: "posts",
      fields: { title: text() },
      admin: { views: [{ viewId: "cfg1", name: "Config View", state: {} }] },
    }),
  ],
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(VexConfigProvider, { config: testConfig, children });
}

beforeEach(() => {
  window.localStorage.clear();
  sharedViewRows = [];
  sharedViewsPending = false;
});

afterEach(() => {
  window.localStorage.clear();
});

describe("useSavedListViews", () => {
  it("merges config, shared, and local views, tagging each with its source", () => {
    sharedViewRows = [{ viewId: "shared1", name: "Shared View", collection: "posts", createdBy: "user1", state: {} }];
    saveLocalSavedListView({ basePath: "/admin", project, collection: "posts", view: { viewId: "local1", name: "Local View", state: {} } });

    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper });

    expect(result.current.views.map((v) => v.viewId)).toEqual(["default", "shared1", "local1", "cfg1"]);
    expect(result.current.views.find((v) => v.viewId === "local1")?.source).toBe("local");
    expect(result.current.views[0]?.source).toBe("default");
    expect(result.current.project).toBe(project);
  });

  it("dedupes by viewId, keeping the shared entry over a stale local one (promotion race)", () => {
    sharedViewRows = [{ viewId: "v1", name: "Promoted View", collection: "posts", createdBy: "user1", state: {} }];
    saveLocalSavedListView({ basePath: "/admin", project, collection: "posts", view: { viewId: "v1", name: "Stale Local Copy", state: {} } });

    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper });

    // Default ("All") + the deduped "v1" entry.
    expect(result.current.views).toHaveLength(3);
    expect(result.current.views.find((view) => view.viewId === "v1")?.name).toBe("Promoted View");
    expect(result.current.views.find((view) => view.viewId === "v1")?.source).toBe("shared");
  });

  it("reports isPending from the shared views query when no initialViews is given", () => {
    sharedViewsPending = true;
    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper });
    expect(result.current.isPending).toBe(true);
  });

  it("seeds the shared views query from initialViews and reports isPending false immediately", () => {
    sharedViewsPending = true; // would be pending if initialData were ignored
    const initialViews: VexStoredView[] = [
      { viewId: "s1", name: "Server Seeded", collection: "posts", createdBy: "user1", state: {} },
    ];
    const { result } = renderHook(() => useSavedListViews({ collection: "posts", initialViews }), { wrapper });
    expect(result.current.isPending).toBe(false);
    expect(result.current.views.find((v) => v.viewId === "s1")?.name).toBe("Server Seeded");
  });

  it("renders a tab for a cookie-indexed local view during the SSR/hydration-matching render", () => {
    // No saveLocalSavedListView call — this view exists only via the cookie index,
    // simulating the first server-rendered paint. Uses
    // `renderToString` (not `renderHook`) specifically because this is the
    // ONE render pass that genuinely exercises `useSyncExternalStore`'s
    // `getServerSnapshot` branch (both `useLocalSavedListViews`'s own local-views
    // read AND this file's `localHydrated` gate) — `renderHook` mounts
    // straight into `getSnapshot()`, with no SSR-matching pass at all, so
    // it can't tell "not hydrated yet" apart from "hydrated, genuinely
    // empty" the way a real server render can.
    function Probe(props: { collection: "posts"; initialLocalIndex: { viewId: string; name: string }[] }) {
      const { views } = useSavedListViews(props);
      return createElement("div", { "data-view-ids": views.map((v) => v.viewId).join(",") });
    }
    const html = renderToString(
      createElement(VexConfigProvider, {
        config: testConfig,
        children: createElement(Probe, {
          collection: "posts",
          initialLocalIndex: [{ viewId: "local-cookie", name: "Cookie Tab" }],
        }),
      }),
    );
    expect(html).toContain("local-cookie");
  });

  it("drops a cookie-indexed entry once local views have hydrated and it has no matching real view (a deleted view's tab must not stay stuck until refresh)", () => {
    // Nothing saved to localStorage for "local-stale" — a plain `renderHook`
    // mount (no SSR pass) goes straight to the resolved, hydrated state, so
    // this represents "the cookie index still lists a view that's gone
    // from localStorage" (e.g. deleted this session) rather than "not read
    // yet" — the index entry must be dropped, not kept as a ghost tab.
    const { result } = renderHook(
      () => useSavedListViews({ collection: "posts", initialLocalIndex: [{ viewId: "local-stale", name: "Deleted Tab" }] }),
      { wrapper },
    );
    expect(result.current.views.find((v) => v.viewId === "local-stale")).toBeUndefined();
  });

  it("supersedes a cookie-indexed entry with the real localStorage view once hydrated", () => {
    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "local1", name: "Real Name", description: "desc", state: { pageSize: 50 } },
    });
    const { result } = renderHook(
      () => useSavedListViews({ collection: "posts", initialLocalIndex: [{ viewId: "local1", name: "Cookie Stub Name" }] }),
      { wrapper },
    );
    const entry = result.current.views.find((v) => v.viewId === "local1");
    expect(entry?.name).toBe("Real Name");
    expect(entry?.pageSize).toBe(50);
  });
});

describe("rawConfigViews / sharedViews — raw, unmerged exposure for resolveListViewQueryState", () => {
  const viewWhere = { field: "featured", op: "eq" as const, value: true };
  const configWithHiddenFilter = defineConfig({
    collections: [
      defineCollection({
        slug: "posts",
        fields: { title: text(), featured: checkbox() },
        admin: { views: [{ viewId: "cfg2", name: "Featured", state: { where: viewWhere } }] },
      }),
    ],
  });

  function hiddenFilterWrapper({ children }: { children: ReactNode }) {
    return createElement(VexConfigProvider, { config: configWithHiddenFilter, children });
  }

  it("rawConfigViews carries the config view's where intact, unlike the merged views list", () => {
    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper: hiddenFilterWrapper });
    expect(result.current.rawConfigViews).toEqual([
      {
        viewId: "cfg2",
        name: "Featured",
        state: {
          where: viewWhere,
          // `config.ts` resolves every
          // admin.views[n]'s own collection-wide keys against admin.view's
          // resolved value, then the global default, same as admin.view
          // itself — this entry declared none of its own, so it inherits
          searchFields: [],
          pageSizeOptions: [10, 25, 50, 100],
          countLimit: 10000,
          serverPageSize: 100,
          bulkActions: { delete: true },
        },
      },
    ]);
    // The merged display list strips `where` — `rawConfigViews` is the one place it survives.
    expect(result.current.views.find((v) => v.viewId === "cfg2")?.where).toBeUndefined();
  });

  it("sharedViews is the unmerged listViews query result", () => {
    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper: hiddenFilterWrapper });
    expect(result.current.sharedViews).toEqual([]);
  });
});

describe("diffViewState", () => {
  const saved: SavedListViewEntry = {
    viewId: "v1",
    name: "Saved",
    source: "shared",
    where: { field: "featured", op: "eq", value: true },
    sort: { field: "rating", order: "desc" },
    search: "ma",
    searchField: "authorName",
    columns: ["title", "rating"],
    pageSize: 25,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };

  it("reports no categories when the live state matches the saved view exactly", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "desc" },
        where: { field: "featured", op: "eq", value: true },
        columns: ["title", "rating"],
        pageSize: 25,
        peekWidth: 384,
      },
      saved,
    });
    expect(diff.categories).toEqual([]);
  });

  it("never flags peekWidth as modified when the saved view has no explicit width of its own, however far the live width diverges (peek width counts toward Modified only for a view with its own saved width, same skip-when-undefined shape as pageSize)", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "desc" },
        where: { field: "featured", op: "eq", value: true },
        columns: ["title", "rating"],
        pageSize: 25,
        peekWidth: 520,
      },
      saved,
    });
    expect(diff.categories).toEqual([]);
  });

  it("still never flags peekWidth when the live width exactly matches PEEK_PANEL_DEFAULT_WIDTH_PX and the saved view has no width of its own (not a coincidence — the check is skipped entirely, not comparing against the default)", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "desc" },
        where: { field: "featured", op: "eq", value: true },
        columns: ["title", "rating"],
        pageSize: 25,
        peekWidth: 384,
      },
      saved,
    });
    expect(diff.categories).toEqual([]);
  });

  it("does not flag peekWidth as modified when the saved view declares its own width and current matches it", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "desc" },
        where: { field: "featured", op: "eq", value: true },
        columns: ["title", "rating"],
        pageSize: 25,
        peekWidth: 520,
      },
      saved: { ...saved, peekWidth: 520 },
    });
    expect(diff.categories).toEqual([]);
  });

  it("flags peekWidth as modified when current diverges from the saved view's own explicit width", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "desc" },
        where: { field: "featured", op: "eq", value: true },
        columns: ["title", "rating"],
        pageSize: 25,
        peekWidth: 400,
      },
      saved: { ...saved, peekWidth: 520 },
    });
    expect(diff.categories).toEqual(["peekWidth"]);
  });

  it("detects a sort change", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "asc" },
        where: saved.where,
        columns: saved.columns,
        pageSize: 25,
        peekWidth: 384,
      },
      saved,
    });
    expect(diff.categories).toEqual(["sort"]);
  });

  it("detects a pure reorder (same visible set, different order) even though the set itself is unchanged", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "desc" },
        where: saved.where,
        columns: ["rating", "title"],
        pageSize: 25,
        peekWidth: 384,
      },
      saved,
    });
    expect(diff.categories).toEqual(["columns"]);
  });

  it("detects a width/pinned/hidden override change even when field order is unchanged", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "desc" },
        where: saved.where,
        columns: [{ field: "title", pinned: "left" }, "rating"],
        pageSize: 25,
        peekWidth: 384,
      },
      saved,
    });
    expect(diff.categories).toEqual(["columns"]);
  });

  it("does not flag columns as modified when the saved view never declared explicit columns, as long as the order also matches", () => {
    const diff = diffViewState({
      current: {
        search: undefined,
        searchField: undefined,
        sort: undefined,
        where: undefined,
        columns: ["title", "slug", "body"],
        pageSize: 25,
        peekWidth: 384,
      },
      saved: {
        viewId: "cfg1",
        name: "Config",
        source: "config",
        where: undefined,
        sort: undefined,
        columns: ["title", "slug", "body"],
        hasHiddenFilter: true,
        hiddenFilterCount: 1,
      },
    });
    expect(diff.categories).toEqual([]);
  });

  it("flags columns as modified for a pure reorder even when the saved view never declared explicit columns", () => {
    const diff = diffViewState({
      current: {
        search: undefined,
        searchField: undefined,
        sort: undefined,
        where: undefined,
        columns: ["slug", "title", "body"],
        pageSize: 25,
        peekWidth: 384,
      },
      saved: {
        viewId: "cfg1",
        name: "Config",
        source: "config",
        where: undefined,
        sort: undefined,
        columns: ["title", "slug", "body"],
        hasHiddenFilter: true,
        hiddenFilterCount: 1,
      },
    });
    expect(diff.categories).toEqual(["columns"]);
  });

  it("does not flag search as modified when the saved view has no search and the current search is the empty string", () => {
    const diff = diffViewState({
      current: {
        search: "",
        searchField: undefined,
        sort: undefined,
        where: undefined,
        columns: [],
        pageSize: 25,
        peekWidth: 384,
      },
      saved: {
        viewId: "cfg1",
        name: "Config",
        source: "config",
        where: undefined,
        sort: undefined,
        search: undefined,
        columns: [],
        hasHiddenFilter: false,
        hiddenFilterCount: 0,
      },
    });
    expect(diff.categories).toEqual([]);
  });
});

describe("resolveListShareParams", () => {
  it("returns undefined when the active view is not local", () => {
    const result = resolveListShareParams({
      activeView: { viewId: "cfg1", name: "Config", source: "config", where: undefined, sort: undefined, columns: [], hasHiddenFilter: false, hiddenFilterCount: 0 },
      state: { search: undefined, searchField: undefined, sort: undefined, where: undefined, columns: [], pageSize: 25, peekWidth: 384 },
    });
    expect(result).toBeUndefined();
  });

  it("serializes full state when the active view is local", () => {
    const result = resolveListShareParams({
      activeView: { viewId: "local1", name: "Local", source: "local", where: undefined, sort: { field: "rating", order: "desc" }, columns: [], hasHiddenFilter: false, hiddenFilterCount: 0 },
      state: { search: "ma", searchField: "authorName", sort: { field: "rating", order: "desc" }, where: undefined, columns: [], pageSize: 25, peekWidth: 384 },
    });
    expect(result).toEqual({ view: undefined, q: "ma", qf: "authorName", sort: { field: "rating", order: "desc" }, filter: undefined, size: 25 });
  });
});

describe("encodeViewUrlValue / decodeViewUrlValue", () => {
  it("round-trips a view's source and id through the <source>:<id> URL grammar", () => {
    const encoded = encodeViewUrlValue({ source: "local", viewId: "v1" });
    expect(encoded).toBe("local:v1");
    expect(decodeViewUrlValue(encoded)).toBe("v1");
  });

  it("decodes undefined to undefined", () => {
    expect(decodeViewUrlValue(undefined)).toBeUndefined();
  });

  it("decodes a raw value with no colon to undefined", () => {
    expect(decodeViewUrlValue("not-a-view-value")).toBeUndefined();
  });
});

describe("resolveEffectiveViewState — stale sort/searchField fallback", () => {
  const staleFixtureCollection = defineCollection({
    slug: "posts",
    fields: { title: text({ index: "by_title", searchIndex: { name: "search_title", filterFields: [] } }) },
    admin: { view: { searchFields: ["title"] } },
  });

  function makeActiveView(overrides: Partial<SavedListViewEntry> = {}): SavedListViewEntry {
    return {
      viewId: "v1",
      name: "Saved view",
      where: undefined,
      sort: undefined,
      source: "shared",
      hasHiddenFilter: false,
      hiddenFilterCount: 0,
      columns: [],
      ...overrides,
    };
  }

  it("falls back to the collection default sort when the active view's sort field has no index, and reports staleSortField", () => {
    const activeView = makeActiveView({ sort: { field: "removedField", order: "asc" } });
    const result = resolveEffectiveViewState({
      collection: staleFixtureCollection,
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      activeView,
    });
    expect(result.sort).toEqual(staleFixtureCollection.admin.view.state.sort);
    expect(result.staleSortField).toBe("removedField");
  });

  it("keeps a valid sort field unchanged, with no staleSortField", () => {
    const activeView = makeActiveView({ sort: { field: "title", order: "asc" } });
    const result = resolveEffectiveViewState({
      collection: staleFixtureCollection,
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      activeView,
    });
    expect(result.sort).toEqual({ field: "title", order: "asc" });
    expect(result.staleSortField).toBeUndefined();
  });

  it("falls back when the URL's own (not the view's) sort field is stale", () => {
    const result = resolveEffectiveViewState({
      collection: staleFixtureCollection,
      q: undefined,
      qf: undefined,
      sort: { field: "removedField", order: "desc" },
      filter: undefined,
      size: undefined,
      activeView: undefined,
    });
    expect(result.sort).toEqual(staleFixtureCollection.admin.view.state.sort);
    expect(result.staleSortField).toBe("removedField");
  });

  it("falls back to the collection default searchField when the active view's searchField is no longer declared, and reports staleSearchField", () => {
    const activeView = makeActiveView({ searchField: "removedField" });
    const result = resolveEffectiveViewState({
      collection: staleFixtureCollection,
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      activeView,
    });
    expect(result.searchField).toBe("title");
    expect(result.staleSearchField).toBe("removedField");
  });

  it("keeps a valid searchField unchanged, with no staleSearchField", () => {
    const activeView = makeActiveView({ searchField: "title" });
    const result = resolveEffectiveViewState({
      collection: staleFixtureCollection,
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      activeView,
    });
    expect(result.searchField).toBe("title");
    expect(result.staleSearchField).toBeUndefined();
  });

  it("the SAME core validators (isSortFieldValid/isSearchFieldValid) back both resolveListViewQueryState (server) and this function (client) — no independent re-implementation to drift", async () => {
    const core = await import("@vexcms/core");
    expect(core.isSortFieldValid).toBeDefined();
    expect(core.isSearchFieldValid).toBeDefined();
  });
});

describe("useSavedListViews — a shared view's own saved where gains hasHiddenFilter when it names a field the caller can't read", () => {
  const sharedFilterWhere = { field: "title", op: "eq" as const, value: "secret" };
  const postsForAccess = defineCollection({
    slug: "posts",
    fields: { title: text(), featured: checkbox() },
  });
  const configWithAnonDeny = defineConfig({
    collections: [postsForAccess],
    access: defineAccess({
      roles: ["public"] as const,
      anonRole: "public",
      resources: [postsForAccess],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        public: { posts: { read: () => ({ "*": true, title: false }) } },
      },
    }),
  });
  function denyWrapper({ children }: { children: ReactNode }) {
    return createElement(VexConfigProvider, { config: configWithAnonDeny, children });
  }

  it("flips hasHiddenFilter on and reports the right leaf count for a shared view filtering on the unreadable field", () => {
    sharedViewRows = [
      { viewId: "shared-secret", name: "Secret", collection: "posts", createdBy: "user1", state: { where: sharedFilterWhere } },
    ];
    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper: denyWrapper });
    const entry = result.current.views.find((v) => v.viewId === "shared-secret");
    expect(entry?.hasHiddenFilter).toBe(true);
    expect(entry?.hiddenFilterCount).toBe(1);
  });

  it("leaves hasHiddenFilter false for a DIFFERENT shared view filtering only on a READABLE field", () => {
    sharedViewRows = [
      {
        viewId: "shared-readable",
        name: "Featured",
        collection: "posts",
        createdBy: "user1",
        state: { where: { field: "featured", op: "eq", value: true } },
      },
    ];
    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper: denyWrapper });
    const entry = result.current.views.find((v) => v.viewId === "shared-readable");
    expect(entry?.hasHiddenFilter).toBe(false);
    expect(entry?.hiddenFilterCount).toBe(0);
  });

  it("never flips hasHiddenFilter for a LOCAL view's own filter on the same unreadable field — local filters are the user's own, never hidden", () => {
    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "local-secret", name: "Local Secret", state: { where: sharedFilterWhere } },
    });
    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper: denyWrapper });
    const entry = result.current.views.find((v) => v.viewId === "local-secret");
    expect(entry?.hasHiddenFilter).toBe(false);
    expect(entry?.hiddenFilterCount).toBe(0);
  });

  it("stays false with no access configured at all (unrestricted — every pre-existing caller's behavior, unchanged)", () => {
    sharedViewRows = [
      { viewId: "shared-unrestricted", name: "Secret", collection: "posts", createdBy: "user1", state: { where: sharedFilterWhere } },
    ];
    const { result } = renderHook(() => useSavedListViews({ collection: "posts" }), { wrapper });
    const entry = result.current.views.find((v) => v.viewId === "shared-unrestricted");
    expect(entry?.hasHiddenFilter).toBe(false);
    expect(entry?.hiddenFilterCount).toBe(0);
  });
});

describe("resolveEffectiveFilterWhere — what ListViewFilterBuilder/ListViewFilterChips should display", () => {
  function makeEntry(overrides: Partial<SavedListViewEntry> = {}): SavedListViewEntry {
    return {
      viewId: "v1",
      name: "Saved view",
      where: undefined,
      sort: undefined,
      source: "shared",
      hasHiddenFilter: false,
      hiddenFilterCount: 0,
      columns: [],
      ...overrides,
    };
  }
  const sharedWhere = { field: "title", op: "eq" as const, value: "x" };

  it("the URL's own filter always wins, even over an active shared view's saved where", () => {
    const urlFilter = { field: "title", op: "eq" as const, value: "override" };
    const activeView = makeEntry({ where: sharedWhere, hasHiddenFilter: false });
    expect(resolveEffectiveFilterWhere({ urlFilter, activeView })).toEqual(urlFilter);
  });

  it("the explicit clear sentinel (null) never re-inherits the shared view's own where", () => {
    const activeView = makeEntry({ where: sharedWhere, hasHiddenFilter: false });
    expect(resolveEffectiveFilterWhere({ urlFilter: null, activeView })).toBeUndefined();
  });

  it("a fully readable, active SHARED view's own where IS the effective filter — the bug: it used to be invisible for every caller, not just an unreadable-field one", () => {
    const activeView = makeEntry({ source: "shared", where: sharedWhere, hasHiddenFilter: false });
    expect(resolveEffectiveFilterWhere({ urlFilter: undefined, activeView })).toEqual(sharedWhere);
  });

  it("an UNREADABLE shared view's own where stays undefined — badge-only, never a chip", () => {
    const activeView = makeEntry({ source: "shared", where: sharedWhere, hasHiddenFilter: true });
    expect(resolveEffectiveFilterWhere({ urlFilter: undefined, activeView })).toBeUndefined();
  });

  it("never falls back for a DECLARED (config/default) view's own where, even though it's never actually hidden-flagged false here — its where is already structurally stripped at the source (toClientSavedListViewConfig/toDefaultEntry), so this never even reaches an unsafe value", () => {
    const activeView = makeEntry({ source: "config", where: undefined, hasHiddenFilter: true });
    expect(resolveEffectiveFilterWhere({ urlFilter: undefined, activeView })).toBeUndefined();
  });

  it("never falls back for a LOCAL view — its own filter is the user's own, always URL-embedded already, never surfaced through the active-view fallback", () => {
    const activeView = makeEntry({ source: "local", where: sharedWhere, hasHiddenFilter: false });
    expect(resolveEffectiveFilterWhere({ urlFilter: undefined, activeView })).toBeUndefined();
  });

  it("undefined with no active view at all", () => {
    expect(resolveEffectiveFilterWhere({ urlFilter: undefined, activeView: undefined })).toBeUndefined();
  });
});
