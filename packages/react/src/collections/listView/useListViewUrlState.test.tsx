import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseAsString, useQueryStates } from "nuqs";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { FrameworkComponentsContext } from "../../config/useFrameworkComponents";
import { defineCollection, number, text, VEX_VIEW_SOURCES } from "@vexcms/core";
import { useListViewUrlState, isQueryAffectingPatch, isQueryAffectingViewSwitch } from "./useListViewUrlState";
import type { SavedListViewEntry } from "./savedListViews/useSavedListViews";

const collection = defineCollection({
  slug: "url_state_test",
  fields: {
    title: text({ required: false, searchIndex: { name: "search_title", filterFields: [] } }),
    rating: number({ required: false }),
  },
  admin: {
    view: { searchFields: ["title"], pageSizeOptions: [10, 25, 50], pageSize: 10 },
  },
});

function renderUrlState(searchParams?: string) {
  return renderHook(() => useListViewUrlState({ collection }), {
    wrapper: withNuqsTestingAdapter({ searchParams, hasMemory: true }),
  });
}

describe("useListViewUrlState", () => {
  it("defaults every field when the URL carries no list params", () => {
    const { result } = renderUrlState();
    expect(result.current.q).toBeUndefined();
    expect(result.current.qf).toBeUndefined();
    expect(result.current.sort).toBeUndefined();
    expect(result.current.filter).toBeUndefined();
    expect(result.current.size).toBeUndefined();
    expect(result.current.view).toBeUndefined();
    expect(result.current.peek).toBeUndefined();
    expect(result.current.cols).toBeUndefined();
  });

  it("an explicit empty q=/filter= (present but empty) parse as \"\"/null, distinct from absent (clear sentinel)", () => {
    const { result } = renderUrlState("?q=&filter=");
    expect(result.current.q).toBe("");
    expect(result.current.filter).toBeNull();
  });

  it("parses existing params", () => {
    const { result } = renderUrlState("?q=hello&sort=rating.desc&size=25");
    expect(result.current.q).toBe("hello");
    expect(result.current.sort).toEqual({ field: "rating", order: "desc" });
    expect(result.current.size).toBe(25);
  });

  it("setQ('') also clears qf", () => {
    const { result } = renderUrlState("?q=hello&qf=rating");
    act(() => result.current.setQ(""));
    expect(result.current.q).toBe("");
    expect(result.current.qf).toBeUndefined();
  });

  it("setQ(undefined) does NOT clear qf — distinct from setQ(\"\") (applyView/Reset set qf separately right after)", () => {
    const { result } = renderUrlState("?q=hello&qf=title");
    act(() => result.current.setQ(undefined));
    expect(result.current.q).toBeUndefined();
    expect(result.current.qf).toBe("title");
  });

  it("setSort writes the field.order grammar", () => {
    const { result } = renderUrlState();
    act(() => result.current.setSort({ field: "rating", order: "asc" }));
    expect(result.current.sort).toEqual({ field: "rating", order: "asc" });
  });

  it("setFilter writes a leaf and setFilter(undefined) clears it", () => {
    const { result } = renderUrlState();
    act(() => result.current.setFilter({ field: "rating", op: "gte", value: 4 }));
    expect(result.current.filter).toEqual({ field: "rating", op: "gte", value: 4 });
    act(() => result.current.setFilter(undefined));
    expect(result.current.filter).toBeUndefined();
  });

  it("setFilter(null) writes the explicit clear sentinel, distinct from setFilter(undefined)", () => {
    const { result } = renderUrlState();
    act(() => result.current.setFilter(null));
    expect(result.current.filter).toBeNull();
  });

  it("setSize to the default omits it from the URL but still reads back as the default", () => {
    const { result } = renderUrlState("?size=25");
    act(() => result.current.setSize(10));
    expect(result.current.size).toBeUndefined();
  });

  it("setPeek and setView round-trip", () => {
    const { result } = renderUrlState();
    act(() => result.current.setView("shared:5star"));
    act(() => result.current.setPeek("doc123"));
    expect(result.current.view).toBe("shared:5star");
    expect(result.current.peek).toBe("doc123");
  });

  it("setCols writes a reordered cols list, and reading an existing one round-trips", () => {
    const { result } = renderUrlState("?cols=rating,title");
    expect(result.current.cols).toEqual(["rating", "title"]);
    act(() => result.current.setCols(["title", "rating"]));
    expect(result.current.cols).toEqual(["title", "rating"]);
  });

  it("several setter calls in one handler land in a single state update", () => {
    const { result } = renderUrlState();
    act(() => {
      result.current.setSort({ field: "rating", order: "desc" });
      result.current.setSize(25);
    });
    expect(result.current.sort).toEqual({ field: "rating", order: "desc" });
    expect(result.current.size).toBe(25);
  });

  it("setSort to the collection's own default sort is omitted from the URL", () => {
    const { result } = renderUrlState("?sort=rating.asc");
    act(() => result.current.setSort({ field: "_creationTime", order: "desc" }));
    expect(result.current.sort).toBeUndefined();
  });
});

describe("useListViewUrlState — under a covering route (sign-in modal)", () => {
  it("keeps the list's own filter/view/search while a covering route owns the URL, and reads the URL again once uncovered", async () => {
    let isCovered = false;
    const NuqsWrapper = withNuqsTestingAdapter({
      searchParams: "?q=post&view=local:v1&filter=x",
      hasMemory: true,
    });
    const { result, rerender } = renderHook(
      () => ({
        state: useListViewUrlState({ collection }),
        // Stands in for the covering route swapping the URL to its own query.
        setUrl: useQueryStates({ q: parseAsString, view: parseAsString, filter: parseAsString })[1],
      }),
      {
        wrapper: ({ children }) => (
          <FrameworkComponentsContext.Provider value={{ useIsRouteCovered: () => isCovered }}>
            <NuqsWrapper>{children}</NuqsWrapper>
          </FrameworkComponentsContext.Provider>
        ),
      },
    );
    const before = result.current.state;
    expect(before.q).toBe("post");
    expect(before.view).toBe("local:v1");

    isCovered = true;
    rerender();
    await act(() => result.current.setUrl({ q: null, view: null, filter: null }));
    expect(result.current.state.q).toBe("post");
    expect(result.current.state.view).toBe("local:v1");
    expect(result.current.state.filter).toEqual(before.filter);

    isCovered = false;
    rerender();
    expect(result.current.state.q).toBeUndefined();
    expect(result.current.state.view).toBeUndefined();
  });
});

describe("useListViewUrlState — diffs setSort/setQf/setSize/setCols against the active view's own baseline", () => {
  const sharedView: SavedListViewEntry = {
    viewId: "shr1",
    name: "Shared",
    where: undefined,
    sort: { field: "rating", order: "desc" },
    searchField: "rating",
    pageSize: 25,
    columns: ["rating", "title"],
    source: VEX_VIEW_SOURCES.shared,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
  const localView: SavedListViewEntry = {
    viewId: "loc1",
    name: "Local",
    where: undefined,
    sort: { field: "rating", order: "desc" },
    searchField: "rating",
    pageSize: 25,
    columns: ["rating", "title"],
    source: VEX_VIEW_SOURCES.local,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
  const views = [sharedView, localView];

  function renderUrlStateWithViews(searchParams?: string) {
    return renderHook(() => useListViewUrlState({ collection, views }), {
      wrapper: withNuqsTestingAdapter({ searchParams, hasMemory: true }),
    });
  }

  it("setSort to the ACTIVE SHARED view's own saved sort is omitted, even though it differs from the collection default", () => {
    const { result } = renderUrlStateWithViews("?view=shared:shr1");
    act(() => result.current.setSort({ field: "rating", order: "desc" }));
    expect(result.current.sort).toBeUndefined();
  });

  it("setSort differing from the active shared view's own sort is still written", () => {
    const { result } = renderUrlStateWithViews("?view=shared:shr1");
    act(() => result.current.setSort({ field: "rating", order: "asc" }));
    expect(result.current.sort).toEqual({ field: "rating", order: "asc" });
  });

  it("setQf/setSize to the active shared view's own values are omitted", () => {
    const { result } = renderUrlStateWithViews("?view=shared:shr1");
    act(() => {
      result.current.setQf("rating");
      result.current.setSize(25);
    });
    expect(result.current.qf).toBeUndefined();
    expect(result.current.size).toBeUndefined();
  });

  it("a LOCAL view's own matching sort is STILL written (no server-side row to fall back to)", () => {
    const { result } = renderUrlStateWithViews("?view=local:loc1");
    act(() => result.current.setSort({ field: "rating", order: "desc" }));
    expect(result.current.sort).toEqual({ field: "rating", order: "desc" });
  });

  it("with no view active, still diffs only against the collection default (shared view's sort is irrelevant)", () => {
    const { result } = renderUrlStateWithViews();
    act(() => result.current.setSort({ field: "rating", order: "desc" }));
    expect(result.current.sort).toEqual({ field: "rating", order: "desc" });
  });
});

describe("useListViewUrlState — applyView preserves an explicit `size=` across a view switch (rows-per-load reset to 10 on every view switch)", () => {
  const viewA: SavedListViewEntry = {
    viewId: "viewA",
    name: "View A",
    where: undefined,
    sort: undefined,
    searchField: undefined,
    pageSize: 25,
    columns: ["rating", "title"],
    source: VEX_VIEW_SOURCES.shared,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
  const viewB: SavedListViewEntry = {
    viewId: "viewB",
    name: "View B",
    where: undefined,
    sort: undefined,
    searchField: undefined,
    pageSize: 50,
    columns: ["rating", "title"],
    source: VEX_VIEW_SOURCES.shared,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
  const views = [viewA, viewB];

  function renderUrlStateWithViews(searchParams?: string) {
    return renderHook(() => useListViewUrlState({ collection, views }), {
      wrapper: withNuqsTestingAdapter({ searchParams, hasMemory: true }),
    });
  }

  it("an explicit size survives switching to a view whose own pageSize DIFFERS from it", () => {
    const { result } = renderUrlStateWithViews("?view=shared:viewB&size=50");
    expect(result.current.size).toBe(50);
    // `viewA`'s own saved pageSize is 25 — the developer's 50 must win, not
    // get silently reset to the target view's own value.
    act(() => result.current.applyView(viewA));
    expect(result.current.size).toBe(50);
  });

  it("with no explicit size set, switching views still inherits the TARGET view's own pageSize (unchanged behavior)", () => {
    const { result } = renderUrlStateWithViews("?view=shared:viewA");
    expect(result.current.size).toBeUndefined();
    act(() => result.current.applyView(viewB));
    // Omitted from the URL (it equals viewB's own baseline), but resolves to 50.
    expect(result.current.size).toBeUndefined();
  });
});

describe("useListViewUrlState — applyView/Reset on the default view leave a bare URL", () => {
  it("switching to the default (\"All\") view — SavedListViewTabs.applyView's exact setter sequence — leaves a bare URL", () => {
    // Starts on a non-default, modified URL (as if the user had been on
    // another view with its own changes) and runs the SAME setter
    // sequence `SavedListViewTabs.tsx`'s `applyView` does for the default view.
    const { result } = renderUrlState("?sort=rating.asc&qf=rating&size=25&view=local%3Aold");
    act(() => {
      result.current.setQ("");
      result.current.setQf(undefined);
      result.current.setSort({ field: "_creationTime", order: "desc" });
      result.current.setFilter(undefined);
      result.current.setSize(10);
      result.current.setView(undefined);
    });
    expect(result.current.q).toBe("");
    expect(result.current.qf).toBeUndefined();
    expect(result.current.sort).toBeUndefined();
    expect(result.current.filter).toBeUndefined();
    expect(result.current.size).toBeUndefined();
    expect(result.current.view).toBeUndefined();
  });

  it("Reset while on the default view — ListViewModifiedControls.handleReset's exact setter sequence — leaves a bare URL", () => {
    const { result } = renderUrlState("?sort=rating.asc&qf=rating&size=25");
    act(() => {
      result.current.setQ("");
      result.current.setQf(undefined);
      result.current.setSort({ field: "_creationTime", order: "desc" });
      result.current.setFilter(undefined);
      result.current.setSize(10);
    });
    expect(result.current.qf).toBeUndefined();
    expect(result.current.sort).toBeUndefined();
    expect(result.current.filter).toBeUndefined();
    expect(result.current.size).toBeUndefined();
  });
});

describe("useListViewUrlState — applyView: switching views never leaks the OLD view's baseline into the NEW view's URL", () => {
  // `defineCollection` auto-injects an `updatedAt` field (always,
  // unless `timestamps: false`/an explicit `updatedAt` field/`meta.protected`)
  // — the fixture's own resolved default column order is
  // `["title", "rating", "updatedAt"]`, not just the two declared fields.
  const defaultViewLike: SavedListViewEntry = {
    viewId: "default",
    name: "All",
    where: undefined,
    sort: { field: "_creationTime", order: "desc" },
    searchField: "title",
    pageSize: 10,
    columns: ["title", "rating", "updatedAt"],
    source: VEX_VIEW_SOURCES.default,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
  const presetView: SavedListViewEntry = {
    viewId: "cfg1",
    name: "Preset",
    where: undefined,
    sort: { field: "title", order: "asc" },
    searchField: undefined,
    pageSize: 50,
    columns: ["title", { field: "rating", hidden: true }, { field: "updatedAt", hidden: true }],
    source: VEX_VIEW_SOURCES.config,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
  const sharedView: SavedListViewEntry = {
    viewId: "shr1",
    name: "Shared",
    where: undefined,
    sort: { field: "rating", order: "desc" },
    searchField: "rating",
    pageSize: 25,
    columns: ["rating", "title", "updatedAt"],
    source: VEX_VIEW_SOURCES.shared,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
  // Does
  // an active LOCAL view's own saved filter reach the URL (so chips/the
  // Filter count/the eye toggle, and the actual query, all see it) the
  // same way a shared view's needed a dedicated fallback for? Checked
  // live first — clicking a local view's tab (the only real path to
  // `view=local:<id>` in the URL at all) already writes `filter=`
  // unconditionally (`applyView` below, `targetViewState: undefined` for
  // `source: "local"` — every field is written explicitly, there's
  // no diff baseline — NOT the diff-against-baseline path shared/config
  // targets take). Confirmed live: tab click → full URL (`filter=`
  // present) → chips/count/eye/query all correct. A BARE `view=local:<id>`
  // URL with no `filter=` is unreachable through the real UI — only
  // `applyView` ever WRITES `view=local:…` at all, and it always writes
  // `filter=` in the SAME atomic patch — so, unlike the shared-view case,
  // `resolveEffectiveFilterWhere` needs NO local-view fallback: this test
  // is the proof, not a fix.
  const localViewWithFilter: SavedListViewEntry = {
    viewId: "loc1",
    name: "Local Published",
    where: { field: "vex_status", op: "eq", value: "published" },
    sort: undefined,
    searchField: undefined,
    pageSize: undefined,
    columns: ["title", "rating", "updatedAt"],
    source: VEX_VIEW_SOURCES.local,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
  const views = [defaultViewLike, presetView, sharedView, localViewWithFilter];

  function renderUrlStateWithViews(searchParams?: string) {
    return renderHook(() => useListViewUrlState({ collection, views }), {
      wrapper: withNuqsTestingAdapter({ searchParams, hasMemory: true }),
    });
  }

  it("shared→All: switching back to the default view leaves a bare URL, not a redundant cols=/sort=/etc from the OLD shared baseline", () => {
    const { result } = renderUrlStateWithViews("?view=shared:shr1");
    act(() => result.current.applyView(defaultViewLike));
    expect(result.current.view).toBeUndefined();
    expect(result.current.sort).toBeUndefined();
    expect(result.current.qf).toBeUndefined();
    expect(result.current.size).toBeUndefined();
    expect(result.current.cols).toBeUndefined();
  });

  it("preset→All: switching back to the default view from a config/preset view also leaves a bare URL", () => {
    const { result } = renderUrlStateWithViews("?view=config:cfg1");
    act(() => result.current.applyView(defaultViewLike));
    expect(result.current.view).toBeUndefined();
    expect(result.current.sort).toBeUndefined();
    expect(result.current.qf).toBeUndefined();
    expect(result.current.size).toBeUndefined();
    expect(result.current.cols).toBeUndefined();
  });

  it("shared→preset: switching to a DIFFERENT non-default view diffs against the NEW target's own baseline, not the OLD shared view's", () => {
    const { result } = renderUrlStateWithViews("?view=shared:shr1");
    act(() => result.current.applyView(presetView));
    expect(result.current.view).toBe("config:cfg1");
    // The preset's own sort/qf/size/cols must all be OMITTED (they equal
    // its own baseline) — none of this should show the SHARED view's
    // stale sort/qf/size, which the bug would have diffed against instead.
    expect(result.current.sort).toBeUndefined();
    expect(result.current.qf).toBeUndefined();
    expect(result.current.size).toBeUndefined();
    expect(result.current.cols).toBeUndefined();
  });

  it("All→local: applyView writes the local view's own saved filter into the URL unconditionally — not diffed/omitted the way shared/config targets' OWN baseline fields are (follow-up to the shared-view chip-visibility fix)", () => {
    const { result } = renderUrlStateWithViews();
    act(() => result.current.applyView(localViewWithFilter));
    expect(result.current.view).toBe("local:loc1");
    expect(result.current.filter).toEqual(localViewWithFilter.where);
  });
});

/**
 * `isQueryAffectingPatch` directly — not `useListViewUrlState`'s own `isPending`/
 * `isQueryPending` fields, which depend on `useTransition`'s real scheduling: confirmed
 * empirically (a throwaway diagnostic test, removed) that jsdom/`act()` settles the WHOLE
 * transition before `result.current` can ever observe `isPending: true` — there's no
 * reliable window to assert against at the hook level. The classification function is
 * the actual new logic this bug fix introduces (a peek
 * Previous/Next click or a column reorder/resize/pin dimmed the table even though neither
 * touches its query) — unit-testing it directly covers that logic exhaustively; the real
 * end-to-end behavior (does the table actually dim or not) is verified live instead
 * (rAF-sampled DOM opacity across both classes of action).
 */
describe("isQueryAffectingPatch", () => {
  it("is true for each query-affecting key alone — q/qf/sort/filter/size", () => {
    expect(isQueryAffectingPatch({ q: "hello" })).toBe(true);
    expect(isQueryAffectingPatch({ qf: "title" })).toBe(true);
    expect(isQueryAffectingPatch({ sort: { field: "rating", order: "asc" } })).toBe(true);
    expect(isQueryAffectingPatch({ filter: { field: "rating", op: "gte", value: 4 } })).toBe(true);
    expect(isQueryAffectingPatch({ size: 25 })).toBe(true);
  });

  it("is false for each display-only key alone — view/peek/cols (view switches alone must not dim the table; neither peek nor cols touch the table's query)", () => {
    expect(isQueryAffectingPatch({ view: "config:cfg1" })).toBe(false);
    expect(isQueryAffectingPatch({ peek: "doc1" })).toBe(false);
    expect(isQueryAffectingPatch({ cols: [{ field: "title" }] })).toBe(false);
  });

  it("is false for an empty patch", () => {
    expect(isQueryAffectingPatch({})).toBe(false);
  });

  it("is true when a patch mixes a query-affecting key with a display-only one — matches applyView's own all-at-once q/qf/sort/filter/size/view/cols write", () => {
    expect(isQueryAffectingPatch({ peek: "doc1", sort: { field: "rating", order: "asc" } })).toBe(true);
    expect(
      isQueryAffectingPatch({
        q: "hello",
        qf: "title",
        sort: { field: "rating", order: "asc" },
        filter: undefined,
        size: 25,
        view: undefined,
        cols: [{ field: "title" }],
      }),
    ).toBe(true);
  });

  it("ignores the patch's VALUES — only key presence matters, even an explicit clear (undefined/null) still counts", () => {
    expect(isQueryAffectingPatch({ filter: null })).toBe(true);
    expect(isQueryAffectingPatch({ view: undefined })).toBe(false);
    expect(isQueryAffectingPatch({ peek: undefined })).toBe(false);
  });
});

/**
 * `isQueryAffectingViewSwitch` directly — the dimming refinement this bug fix adds on top
 * of `isQueryAffectingPatch` (`applyView` ALWAYS writes
 * `q`/`qf`/`sort`/`filter`/`size` together, so classifying it by key presence alone — like
 * every other setter's single-key patch — dimmed the table on every view switch, even one
 * whose target view had the exact SAME search/sort/filter/size as what was already active,
 * e.g. switching between two views built off an identical base, or jumping back to a view
 * just saved as a copy of the active one). End-to-end behavior (view switch alone doesn't
 * dim, a sort/filter change does) is verified live; this function is the actual new
 * classification logic, unit-tested exhaustively the same way `isQueryAffectingPatch`
 * above is.
 */
describe("isQueryAffectingViewSwitch", () => {
  it("is false when the target view's patch matches the current params exactly — view/cols alone changing must not dim the table", () => {
    const current = { q: "hello", qf: "title", sort: { field: "rating", order: "asc" as const }, filter: null, size: 25 };
    const patch = {
      q: "hello",
      qf: "title",
      sort: { field: "rating", order: "asc" as const },
      filter: null,
      size: 25,
      view: "config:cfg1",
      cols: [{ field: "title" }],
    };
    expect(isQueryAffectingViewSwitch(current, patch)).toBe(false);
  });

  it("is false for the default (empty) view switching to another default-shaped view — no current params, no patch values", () => {
    expect(isQueryAffectingViewSwitch({}, { view: undefined, cols: [] })).toBe(false);
  });

  it("treats undefined/null as the SAME 'unset' value — a view with no saved filter switching from a current `filter: null` must not dim", () => {
    expect(isQueryAffectingViewSwitch({ filter: null }, { filter: undefined })).toBe(false);
    expect(isQueryAffectingViewSwitch({ q: undefined }, { q: undefined })).toBe(false);
  });

  it("is true when the target view's sort differs from the current sort", () => {
    const current = { sort: { field: "rating", order: "asc" as const } };
    const patch = { sort: { field: "rating", order: "desc" as const }, view: "config:cfg2" };
    expect(isQueryAffectingViewSwitch(current, patch)).toBe(true);
  });

  it("is true when the target view's filter differs from the current filter", () => {
    const current = { filter: null };
    const patch = { filter: { field: "rating", op: "gte" as const, value: 4 }, view: "config:cfg2" };
    expect(isQueryAffectingViewSwitch(current, patch)).toBe(true);
  });

  it("is true when q/qf/size differ, one field at a time", () => {
    expect(isQueryAffectingViewSwitch({ q: "hello" }, { q: "goodbye" })).toBe(true);
    expect(isQueryAffectingViewSwitch({ qf: "title" }, { qf: "rating" })).toBe(true);
    expect(isQueryAffectingViewSwitch({ size: 10 }, { size: 25 })).toBe(true);
  });

  it("ignores view/cols entirely — differing ONLY in those must not count as query-affecting", () => {
    const current = { q: "hello", sort: { field: "rating", order: "asc" as const } };
    const patch = {
      q: "hello",
      sort: { field: "rating", order: "asc" as const },
      view: "config:cfg2",
      cols: [{ field: "rating" }],
    };
    expect(isQueryAffectingViewSwitch(current, patch)).toBe(false);
  });
});

describe("useListViewUrlState — setPeek/setCols apply their own URL value without requiring the query-affecting fields to change (sanity check the real setters still work after the isQueryPending split)", () => {
  it("setPeek writes peek= alone, leaving every query-affecting field untouched", () => {
    const { result } = renderUrlState("?sort=rating.desc");
    act(() => result.current.setPeek("doc1"));
    expect(result.current.peek).toBe("doc1");
    expect(result.current.sort).toEqual({ field: "rating", order: "desc" });
  });

  it("setCols writes cols= alone, leaving every query-affecting field untouched", () => {
    const { result } = renderUrlState("?q=hello");
    act(() => result.current.setCols(["title", "rating"]));
    expect(result.current.cols).toEqual(["title", "rating"]);
    expect(result.current.q).toBe("hello");
  });
});
