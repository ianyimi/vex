import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../../index";
import { resolveListViewQueryState } from "./listViewQueryState";
import type { ListViewUrlState } from "./listViewUrlState";
import type { VexStoredView, VexViewConfig } from "../types";

const collection = defineCollection({
  slug: "posts",
  fields: { title: text({ index: "by_title", searchIndex: { name: "search_title", filterFields: [] } }) },
  admin: {
    view: { searchFields: ["title"] },
  },
});

function params(overrides: Partial<ListViewUrlState> = {}): ListViewUrlState {
  return {
    q: undefined,
    qf: undefined,
    sort: undefined,
    filter: undefined,
    size: undefined,
    view: undefined,
    peek: undefined,
    cols: undefined,
    ...overrides,
  };
}

describe("resolveListViewQueryState — no active view", () => {
  it("falls back to the collection's own defaults when the URL carries nothing", () => {
    expect(resolveListViewQueryState({ collection, params: params() })).toEqual({
      where: undefined,
      sort: { field: "_creationTime", order: "desc" },
      search: "",
      searchField: "title",
      pageSize: 10,
      columns: ["title", "updatedAt"],
    });
  });

  it("the URL's own values win over the collection defaults", () => {
    const sort = { field: "title", order: "asc" } as const;
    const filter = { field: "title", op: "eq", value: "x" } as const;
    expect(
      resolveListViewQueryState({ collection, params: params({ sort, filter, size: 25, q: "hi", qf: "title" }) }),
    ).toMatchObject({ where: filter, sort, search: "hi", searchField: "title", pageSize: 25 });
  });
});

describe("resolveListViewQueryState — default view's own hidden where (Decision 45/48)", () => {
  const collectionWithDefaultWhere = defineCollection({
    slug: "featured_posts",
    fields: { title: text({ searchIndex: { name: "search_title", filterFields: [] } }) },
    admin: {
      view: { searchFields: ["title"], where: { field: "title", op: "eq", value: "featured" } },
    },
  });

  it("composes the default view's hidden where with the caller's own filter when no other view is active", () => {
    const filter = { field: "title", op: "neq", value: "x" } as const;
    const result = resolveListViewQueryState({ collection: collectionWithDefaultWhere, params: params({ filter }) });
    expect(result.where).toEqual({
      and: [{ field: "title", op: "eq", value: "featured" }, filter],
    });
  });

  it("uses the default view's hidden where alone when the caller has no filter of their own", () => {
    const result = resolveListViewQueryState({ collection: collectionWithDefaultWhere, params: params() });
    expect(result.where).toEqual({ field: "title", op: "eq", value: "featured" });
  });

  it("does not compose the default view's hidden where when a local view is active (Decision 41)", () => {
    const result = resolveListViewQueryState({
      collection: collectionWithDefaultWhere,
      params: params({ view: "local:loc1" }),
    });
    expect(result.where).toBeUndefined();
  });
});

describe("resolveListViewQueryState — config view", () => {
  const configView: VexViewConfig = {
    viewId: "cfg1",
    name: "Featured",
    state: {
      where: { field: "title", op: "eq", value: "featured" },
      sort: { field: "title", order: "asc" },
      pageSize: 50,
    },
  };

  it("composes the hidden where with the caller's own filter", () => {
    const filter = { field: "title", op: "neq", value: "x" } as const;
    const result = resolveListViewQueryState({ collection, params: params({ filter, view: "config:cfg1" }), configView });
    expect(result.where).toEqual({ and: [configView.state.where, filter] });
  });

  it("uses the hidden where alone when the caller has no filter of their own", () => {
    const result = resolveListViewQueryState({ collection, params: params({ view: "config:cfg1" }), configView });
    expect(result.where).toEqual(configView.state.where);
  });

  it("falls back to the view's own sort/pageSize when the URL omits them — an unmodified config-view link", () => {
    const result = resolveListViewQueryState({ collection, params: params({ view: "config:cfg1" }), configView });
    expect(result.sort).toEqual({ field: "title", order: "asc" });
    expect(result.pageSize).toBe(50);
  });

  it("the URL's own sort still wins over the view's", () => {
    const sort = { field: "_creationTime", order: "desc" } as const;
    const result = resolveListViewQueryState({ collection, params: params({ sort, view: "config:cfg1" }), configView });
    expect(result.sort).toEqual(sort);
  });
});

describe("resolveListViewQueryState — shared view", () => {
  const sharedView: VexStoredView = {
    viewId: "shared1",
    name: "Team view",
    collection: "posts",
    createdBy: "user1",
    state: {
      where: { field: "title", op: "eq", value: "shared" },
      sort: { field: "title", order: "desc" },
      search: "saved",
    },
  };

  it("falls back to the view's own where/sort/search when the URL carries none of them — an unmodified shared link", () => {
    const result = resolveListViewQueryState({ collection, params: params({ view: "shared:shared1" }), sharedView });
    expect(result).toMatchObject({ where: sharedView.state.where, sort: sharedView.state.sort, search: "saved" });
  });

  it("the URL's own filter still wins over the shared view's where — no hidden composition for a shared source", () => {
    const filter = { field: "title", op: "neq", value: "y" } as const;
    const result = resolveListViewQueryState({ collection, params: params({ filter, view: "shared:shared1" }), sharedView });
    expect(result.where).toEqual(filter);
  });
});

describe("resolveListViewQueryState — explicit clear sentinel, filter/q (developer-reported)", () => {
  const sharedView: VexStoredView = {
    viewId: "shared2",
    name: "Team view",
    collection: "posts",
    createdBy: "user1",
    state: {
      where: { field: "title", op: "eq", value: "shared" },
      sort: { field: "title", order: "desc" },
      search: "saved",
    },
  };

  it("filter: null (explicit clear) does NOT re-inherit the shared view's own where", () => {
    const result = resolveListViewQueryState({
      collection,
      params: params({ filter: null, view: "shared:shared2" }),
      sharedView,
    });
    expect(result.where).toBeUndefined();
  });

  it("filter: undefined (absent) DOES inherit the shared view's own where — unaffected by the clear sentinel", () => {
    const result = resolveListViewQueryState({
      collection,
      params: params({ view: "shared:shared2" }),
      sharedView,
    });
    expect(result.where).toEqual(sharedView.state.where);
  });

  it("q: \"\" (explicit clear) does NOT re-inherit the shared view's own search", () => {
    const result = resolveListViewQueryState({
      collection,
      params: params({ q: "", view: "shared:shared2" }),
      sharedView,
    });
    expect(result.search).toBe("");
  });

  it("q: undefined (absent) DOES inherit the shared view's own search", () => {
    const result = resolveListViewQueryState({
      collection,
      params: params({ view: "shared:shared2" }),
      sharedView,
    });
    expect(result.search).toBe("saved");
  });

  it("a declared (config) view: filter null and undefined both just mean \"no additional user filter\" — no own visible filter to inherit (Decision 25)", () => {
    const configView: VexViewConfig = {
      viewId: "cfg-clear",
      name: "Cfg",
      state: { where: { field: "title", op: "eq", value: "hidden" } },
    };
    const withNull = resolveListViewQueryState({
      collection,
      params: params({ filter: null, view: "config:cfg-clear" }),
      configView,
    });
    const withUndefined = resolveListViewQueryState({
      collection,
      params: params({ view: "config:cfg-clear" }),
      configView,
    });
    expect(withNull.where).toEqual(configView.state.where);
    expect(withUndefined.where).toEqual(configView.state.where);
  });
});

describe("resolveListViewQueryState — local view", () => {
  it("reads the URL's own full state directly — no configView/sharedView to merge (Design Decision 41)", () => {
    const sort = { field: "title", order: "asc" } as const;
    const filter = { field: "title", op: "eq", value: "z" } as const;
    const result = resolveListViewQueryState({ collection, params: params({ sort, filter, view: "local:loc1" }) });
    expect(result).toMatchObject({ where: filter, sort });
  });
});

describe("resolveListViewQueryState — columns (Decision 48)", () => {
  it("falls back to the collection's own default order when nothing is declared", () => {
    const result = resolveListViewQueryState({ collection, params: params() });
    expect(result.columns).toEqual(["title", "updatedAt"]);
  });

  it("the URL's own cols wins over the view/collection default, completed with any field it omits", () => {
    const result = resolveListViewQueryState({ collection, params: params({ cols: ["updatedAt"] }) });
    // `cols=updatedAt` only names one field — `completeListViewColumnOrder` appends
    // the rest (just `title` here), explicitly hidden, in declaration
    // order — exactly what the server must prerender so the client's own
    // re-derivation (same inputs) produces an identical column list with
    // no first-paint shift.
    expect(result.columns).toEqual(["updatedAt", { field: "title", hidden: true }]);
  });

  it("falls back to an active config view's own columns when the URL carries no cols", () => {
    const configView: VexViewConfig = {
      viewId: "cfg-cols",
      name: "Cols view",
      state: { columns: ["updatedAt", "title"] },
    };
    const result = resolveListViewQueryState({
      collection,
      params: params({ view: "config:cfg-cols" }),
      configView,
    });
    expect(result.columns).toEqual(["updatedAt", "title"]);
  });

  it("the URL's own cols still wins over an active view's own columns", () => {
    const configView: VexViewConfig = {
      viewId: "cfg-cols-2",
      name: "Cols view",
      state: { columns: ["updatedAt", "title"] },
    };
    const result = resolveListViewQueryState({
      collection,
      params: params({ cols: ["title", "updatedAt"], view: "config:cfg-cols-2" }),
      configView,
    });
    expect(result.columns).toEqual(["title", "updatedAt"]);
  });

  it("the URL's own cols carries width/pinned/hidden overrides straight through, unmodified", () => {
    const result = resolveListViewQueryState({
      collection,
      params: params({ cols: [{ field: "title", width: 260, pinned: "left" }, "updatedAt"] }),
    });
    expect(result.columns).toEqual([{ field: "title", width: 260, pinned: "left" }, "updatedAt"]);
  });

  it("a field absent from a narrower view's own columns resolves hidden — the SSR-parity source for a config view", () => {
    const configView: VexViewConfig = {
      viewId: "cfg-narrow",
      name: "Narrow",
      state: { columns: ["title"] },
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "config:cfg-narrow" }), configView });
    expect(result.columns).toEqual(["title", { field: "updatedAt", hidden: true }]);
  });

  it("a field absent from a narrower shared view's own columns resolves hidden — the SSR-parity source for a shared view", () => {
    const sharedView: VexStoredView = {
      viewId: "shared-narrow",
      name: "Narrow",
      collection: "posts",
      createdBy: "user1",
      state: { columns: ["updatedAt"] },
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "shared:shared-narrow" }), sharedView });
    expect(result.columns).toEqual(["updatedAt", { field: "title", hidden: true }]);
  });

  it("a local view's full state is in the URL (Decision 41) — columns resolves purely from cols, no view lookup needed", () => {
    const result = resolveListViewQueryState({
      collection,
      params: params({ cols: ["title"], view: "local:loc1" }),
    });
    expect(result.columns).toEqual(["title", { field: "updatedAt", hidden: true }]);
  });

  it("a local view's URL WITHOUT cols (a stale pre-Decision-47 link) falls back to the collection default — same on both sides, matching, no silent narrowing the server can't see", () => {
    const result = resolveListViewQueryState({
      collection,
      params: params({ view: "local:loc1" }),
    });
    expect(result.columns).toEqual(["title", "updatedAt"]);
  });

  it("a versioned collection's columns include vex_status, FIRST and visible, through the full resolution chain — this is the shared server/client path both SSR and the client call (developer-reported: resizing/pinning vex_status used to silently no-op since it never reached here at all)", () => {
    const versionedCollection = defineCollection({
      slug: "versioned_posts",
      fields: { title: text({ required: false }) },
      versions: { drafts: true },
    });
    const result = resolveListViewQueryState({ collection: versionedCollection, params: params() });
    expect(result.columns).toEqual([{ field: "vex_status" }, "title", "updatedAt"]);
  });

  it("a versioned collection's cols= URL can resize/pin vex_status directly, same as any real field — round-trips through the shared resolution", () => {
    const versionedCollection = defineCollection({
      slug: "versioned_posts_resized",
      fields: { title: text({ required: false }) },
      versions: { drafts: true },
    });
    const result = resolveListViewQueryState({
      collection: versionedCollection,
      params: params({ cols: [{ field: "vex_status", width: 180, pinned: "left" }, "title", "updatedAt"] }),
    });
    expect(result.columns).toEqual([{ field: "vex_status", width: 180, pinned: "left" }, "title", "updatedAt"]);
  });
});

describe("resolveListViewQueryState — stale sort/searchField fallback (Decision 7)", () => {
  it("falls back to the collection default sort when a shared view's sort field no longer has an index, and reports staleSortField", () => {
    const sharedView: VexStoredView = {
      viewId: "stale-sort-shared",
      name: "Stale sort",
      collection: "posts",
      createdBy: "user1",
      state: { sort: { field: "removedField", order: "asc" } },
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "shared:stale-sort-shared" }), sharedView });
    expect(result.sort).toEqual({ field: "_creationTime", order: "desc" });
    expect(result.staleSortField).toBe("removedField");
  });

  it("keeps a shared view's sort field unchanged, with no staleSortField, when it still has an index", () => {
    const sharedView: VexStoredView = {
      viewId: "valid-sort-shared",
      name: "Valid sort",
      collection: "posts",
      createdBy: "user1",
      state: { sort: { field: "title", order: "asc" } },
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "shared:valid-sort-shared" }), sharedView });
    expect(result.sort).toEqual({ field: "title", order: "asc" });
    expect(result.staleSortField).toBeUndefined();
  });

  it("never flags _creationTime as stale, regardless of indexes", () => {
    const result = resolveListViewQueryState({ collection, params: params({ sort: { field: "_creationTime", order: "asc" } }) });
    expect(result.sort).toEqual({ field: "_creationTime", order: "asc" });
    expect(result.staleSortField).toBeUndefined();
  });

  it("falls back to the collection default when a LOCAL view's (raw URL) sort field has no index", () => {
    const result = resolveListViewQueryState({
      collection,
      params: params({ sort: { field: "removedField", order: "asc" }, view: "local:loc1" }),
    });
    expect(result.sort).toEqual({ field: "_creationTime", order: "desc" });
    expect(result.staleSortField).toBe("removedField");
  });

  it("falls back to the collection default searchField when a shared view's searchField is no longer in searchFields, and reports staleSearchField", () => {
    const sharedView: VexStoredView = {
      viewId: "stale-search-shared",
      name: "Stale search",
      collection: "posts",
      createdBy: "user1",
      state: { searchField: "removedField" },
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "shared:stale-search-shared" }), sharedView });
    expect(result.searchField).toBe("title");
    expect(result.staleSearchField).toBe("removedField");
  });

  it("keeps a shared view's searchField unchanged, with no staleSearchField, when it is still declared", () => {
    const sharedView: VexStoredView = {
      viewId: "valid-search-shared",
      name: "Valid search",
      collection: "posts",
      createdBy: "user1",
      state: { searchField: "title" },
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "shared:valid-search-shared" }), sharedView });
    expect(result.searchField).toBe("title");
    expect(result.staleSearchField).toBeUndefined();
  });

  it("never mutates the shared view's own stored state — the fallback is read-time only", () => {
    const originalSort = { field: "removedField", order: "asc" } as const;
    const sharedView: VexStoredView = {
      viewId: "immutable-check",
      name: "Immutable check",
      collection: "posts",
      createdBy: "user1",
      state: { sort: originalSort },
    };
    resolveListViewQueryState({ collection, params: params({ view: "shared:immutable-check" }), sharedView });
    expect(sharedView.state.sort).toEqual(originalSort);
  });

  it("does not flag staleness when sort/searchField are entirely absent (nothing to validate)", () => {
    const sharedView: VexStoredView = {
      viewId: "no-sort-shared",
      name: "No sort",
      collection: "posts",
      createdBy: "user1",
      state: {},
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "shared:no-sort-shared" }), sharedView });
    expect(result.staleSortField).toBeUndefined();
    expect(result.staleSearchField).toBeUndefined();
  });
});

// Developer-reported fix ("false Modified: preview width on refresh" for a shared view):
// the active view's own saved width must be visible here, the SAME place `columns`
// already resolves view-aware, server/client-identically — `CollectionListView`/
// `NextAdminPage` both seed their `peekWidth` state from `resolved.peekWidth`
// (falling back to the `vex-admin:<collection>` cookie only when the view has none),
// instead of purely from the cookie with no view awareness at all.
describe("resolveListViewQueryState — peekWidth (developer-reported)", () => {
  it("is undefined when no active view is named (the default view never declares one)", () => {
    const result = resolveListViewQueryState({ collection, params: params() });
    expect(result.peekWidth).toBeUndefined();
  });

  it("resolves a shared view's own saved width", () => {
    const sharedView: VexStoredView = {
      viewId: "shared-width",
      name: "Wide",
      collection: "posts",
      createdBy: "user1",
      state: { peekWidth: 444 },
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "shared:shared-width" }), sharedView });
    expect(result.peekWidth).toBe(444);
  });

  it("is undefined for a shared view that never saved an explicit width — caller falls back to the cookie default, not a hardcoded one here", () => {
    const sharedView: VexStoredView = {
      viewId: "shared-no-width",
      name: "Default width",
      collection: "posts",
      createdBy: "user1",
      state: {},
    };
    const result = resolveListViewQueryState({
      collection,
      params: params({ view: "shared:shared-no-width" }),
      sharedView,
    });
    expect(result.peekWidth).toBeUndefined();
  });

  it("resolves a config view's own saved width", () => {
    const configView: VexViewConfig = {
      viewId: "cfg-width",
      name: "Config wide",
      state: { peekWidth: 500 },
    };
    const result = resolveListViewQueryState({ collection, params: params({ view: "config:cfg-width" }), configView });
    expect(result.peekWidth).toBe(500);
  });

  it("is undefined for a local view — its own saved width isn't visible to configView/sharedView at all (Decision 41)", () => {
    const result = resolveListViewQueryState({ collection, params: params({ view: "local:loc1" }) });
    expect(result.peekWidth).toBeUndefined();
  });
});

describe("resolveListViewQueryState — drops a user-added filter condition on an unreadable field (access-system-fields.md Decision 11)", () => {
  const denyVexStatus = { wildcard: true, fields: { vex_status: false } };

  it("the real reported case: a local view's filter (view=local:…, carried in the URL like any other local-view state) on an unreadable field is dropped, flagged staleFilterField, never reaches the server rejected", () => {
    const filter = { field: "vex_status", op: "eq", value: "published" } as const;
    const result = resolveListViewQueryState({
      collection,
      params: params({ filter, view: "local:loc1" }),
      fieldPermissions: denyVexStatus,
    });
    expect(result.where).toBeUndefined();
    expect(result.staleFilterField).toBe("vex_status");
  });

  it("a bare URL filter (no view at all) on an unreadable field is dropped the same way", () => {
    const filter = { field: "vex_status", op: "eq", value: "published" } as const;
    const result = resolveListViewQueryState({ collection, params: params({ filter }), fieldPermissions: denyVexStatus });
    expect(result.where).toBeUndefined();
    expect(result.staleFilterField).toBe("vex_status");
  });

  it("a shared view's own saved where is EXEMPT from the drop — a declared filter per Decision 11, not user-editable — even naming an unreadable field (bug caught live: a shared 'Published' view signed out)", () => {
    const sharedView: VexStoredView = {
      viewId: "shared-unreadable",
      name: "Published",
      collection: "posts",
      createdBy: "user1",
      state: { where: { field: "vex_status", op: "eq", value: "published" } },
    };
    const result = resolveListViewQueryState({
      collection,
      params: params({ view: "shared:shared-unreadable" }),
      sharedView,
      fieldPermissions: denyVexStatus,
    });
    expect(result.where).toEqual(sharedView.state.where);
    expect(result.staleFilterField).toBeUndefined();
  });

  it("the SAME exemption on a non-status field — can't be masked by vex_status happening to coincide with published-only visibility (developer-reported, the exact case that hid the bug)", () => {
    const denyTitle = { wildcard: true, fields: { title: false } };
    const sharedView: VexStoredView = {
      viewId: "shared-title-unreadable",
      name: "Titled",
      collection: "posts",
      createdBy: "user1",
      state: { where: { field: "title", op: "eq", value: "secret" } },
    };
    const result = resolveListViewQueryState({
      collection,
      params: params({ view: "shared:shared-title-unreadable" }),
      sharedView,
      fieldPermissions: denyTitle,
    });
    expect(result.where).toEqual(sharedView.state.where);
    expect(result.staleFilterField).toBeUndefined();
  });

  it("a user's OWN filter still REPLACES and IS checked against a shared view's where — editing away from the shared view's saved state makes it the user's own, no longer exempt", () => {
    const sharedView: VexStoredView = {
      viewId: "shared-overridden",
      name: "Published",
      collection: "posts",
      createdBy: "user1",
      state: { where: { field: "title", op: "eq", value: "readable-shared-filter" } },
    };
    const filter = { field: "vex_status", op: "eq", value: "published" } as const;
    const result = resolveListViewQueryState({
      collection,
      params: params({ filter, view: "shared:shared-overridden" }),
      sharedView,
      fieldPermissions: denyVexStatus,
    });
    expect(result.where).toBeUndefined();
    expect(result.staleFilterField).toBe("vex_status");
  });

  it("a readable condition in the SAME filter is left alone — only the unreadable field drops", () => {
    const filter = { field: "title", op: "eq", value: "x" } as const;
    const result = resolveListViewQueryState({ collection, params: params({ filter }), fieldPermissions: denyVexStatus });
    expect(result.where).toEqual(filter);
    expect(result.staleFilterField).toBeUndefined();
  });

  it("never drops a declared/config view's own hidden where, even naming an unreadable field — Decision 11's exemption", () => {
    const configView: VexViewConfig = {
      viewId: "cfg-status",
      name: "Published only",
      state: { where: { field: "vex_status", op: "eq", value: "published" } },
    };
    const result = resolveListViewQueryState({
      collection,
      params: params({ view: "config:cfg-status" }),
      configView,
      fieldPermissions: denyVexStatus,
    });
    expect(result.where).toEqual(configView.state.where);
    expect(result.staleFilterField).toBeUndefined();
  });

  it("still composes a declared view's hidden where with the caller's OWN filter when the caller's part is readable", () => {
    const configView: VexViewConfig = {
      viewId: "cfg-status-2",
      name: "Published only",
      state: { where: { field: "vex_status", op: "eq", value: "published" } },
    };
    const filter = { field: "title", op: "eq", value: "x" } as const;
    const result = resolveListViewQueryState({
      collection,
      params: params({ filter, view: "config:cfg-status-2" }),
      configView,
      fieldPermissions: denyVexStatus,
    });
    expect(result.where).toEqual({ and: [configView.state.where, filter] });
    expect(result.staleFilterField).toBeUndefined();
  });

  it("drops the caller's OWN unreadable condition but still composes the declared view's hidden where alongside it", () => {
    const configView: VexViewConfig = {
      viewId: "cfg-featured",
      name: "Featured",
      state: { where: { field: "title", op: "eq", value: "featured" } },
    };
    const filter = { field: "vex_status", op: "eq", value: "published" } as const;
    const result = resolveListViewQueryState({
      collection,
      params: params({ filter, view: "config:cfg-featured" }),
      configView,
      fieldPermissions: denyVexStatus,
    });
    expect(result.where).toEqual(configView.state.where);
    expect(result.staleFilterField).toBe("vex_status");
  });

  it("skips the check entirely when fieldPermissions is not supplied — old unguarded behavior for a caller that hasn't been updated", () => {
    const filter = { field: "vex_status", op: "eq", value: "published" } as const;
    const result = resolveListViewQueryState({ collection, params: params({ filter }) });
    expect(result.where).toEqual(filter);
    expect(result.staleFilterField).toBeUndefined();
  });
});
