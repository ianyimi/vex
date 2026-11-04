import { createElement, useState, type ComponentProps, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import { defineCollection, defineConfig, text, truncateLocalViewName, vexConvexApi, type VexStoredView } from "@vexcms/core";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";
import { toast } from "sonner";
import { VexConfigProvider } from "../../../../config/VexConfigContext";
import { saveLocalSavedListView } from "../localSavedListViewsStore";
import { encodeViewUrlValue, type SavedListViewEntry } from "../useSavedListViews";
import { SavedListViewTabs } from "./index";

// Same pattern `ListViewPeek.test.tsx` already establishes — mocked so the shared-views error
// toast can be asserted directly, not just "the tab row doesn't
// crash."
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// `SavedListViewTabs` reads its merged view list through `useSavedListViews()`, which
// needs a Convex client, a `@tanstack/react-query` `useQuery`/`useMutation`,
// and a `VexConfigContext` — mocked the same lightweight way
// `useSavedListViews.test.ts` does (no real Convex backend needed for these two
// prerender-focused checks), rather than the heavier `renderView` harness.
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
    // `useSaveView()`/`useRemoveView()` (`../../client`) call this hook eagerly
    // to build their `mutationFn`, independent of the `useMutation` mock below
    // — it would otherwise require a real `ConvexProvider`.
    useConvexMutation: () => async () => {},
  };
});

let sharedViewRows: VexStoredView[] = [];
let sharedViewsError: Error | null = null;
let sharedViewsRefetch = vi.fn();

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown }) =>
      options.__reference === vexConvexApi.listViews
        ? {
            data: sharedViewsError ? undefined : sharedViewRows,
            isPending: false,
            isError: sharedViewsError !== null,
            error: sharedViewsError,
            refetch: sharedViewsRefetch,
          }
        : { data: [], isPending: false, isError: false, error: null, refetch: () => {} },
    // `removeViewMutation.mutateAsync({ collection, viewId })` (top-level
    // `viewId`, no `view`) vs `saveViewMutation.mutateAsync({ collection,
    // view })` (no top-level `viewId`) — distinguishable by shape alone,
    // no need to mock `useRemoveView()`/`useSaveView()` (`../../client`)
    // separately. Mutates `sharedViewRows` in place so the NEXT render
    // (`handleConfirmDelete`'s own `setDeleteTarget(null)` in its
    // `finally` block always triggers one) picks up the removal via the
    // SAME `useQuery`/`useSuspenseQuery` mocks above — simulates Convex's
    // live-query reactivity without a reactive mock store.
    useMutation: () => ({
      mutateAsync: async (args: { viewId?: string; view?: unknown }) => {
        if (typeof args.viewId === "string" && args.view === undefined) {
          sharedViewRows = sharedViewRows.filter((view) => view.viewId !== args.viewId);
        }
      },
      isPending: false,
    }),
  };
});

const testConfig = defineConfig({
  collections: [defineCollection({ slug: "posts", fields: { title: text() } })],
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(VexConfigProvider, { config: testConfig, children });
}

const viewPrefetchStub = {
  onTabPointerEnter: () => {},
  onTabPointerLeave: () => {},
  onTabFocus: () => {},
  pendingViewId: undefined,
};

// Guided-stub test scaffold covering the prerender-specific behavior this
// step adds; apply/save/reset/delete/promote coverage follows the same
// pattern.
describe("SavedListViewTabs (prerender)", () => {
  it("renders a tab for a view present only in initialLocalIndex during the SSR/hydration-matching render", () => {
    // `render()` (like `renderHook`) mounts straight into the client
    // snapshot — no SSR-matching pass — so it can't represent "cookie
    // index says this view exists, localStorage hasn't been read yet"
    // (the `localHydrated` gate in `useSavedListViews.ts`'s `mergeListViews`
    // treats that as "hydrated, no matching real view" = deleted, same as
    // `useSavedListViews.test.ts`'s own SSR-window test). `renderToString` is
    // the one render pass that genuinely exercises the SSR branch.
    const html = renderToString(
      wrapper({
        children: (
          <SavedListViewTabs
            collection="posts"
            urlState={{
              q: undefined,
              qf: undefined,
              sort: undefined,
              filter: undefined,
              size: undefined,
              view: undefined,
              setQ: () => {},
              setQf: () => {},
              setSort: () => {},
              setFilter: () => {},
              setSize: () => {},
              setView: () => {},
              applyView: () => {},
            }}
            defaultPageSize={25}
            columns={[]}
            onColumnsChange={() => {}}
            onColumnsStateChange={() => {}}
            peekWidth={384}
            peekWidthTouched={false}
            onPeekWidthChange={() => {}}
            initialLocalIndex={[{ viewId: "local1", name: "Server Tab" }]}
            viewPrefetch={viewPrefetchStub}
          />
        ),
      }),
    );
    expect(html).toContain("Server Tab");
  });

  // `localIndex` (what the server reads back out of
  // the `vex-admin:<collection>` cookie) truncates a local
  // view's name to `ADMIN_COOKIE_LOCAL_VIEW_NAME_MAX_CHARS` code points
  // (`serializeAdminCollectionCookie`), but `localStorage`'s own
  // `VexViewConfig.name` is never touched — rendering the full name
  // unconditionally once hydrated would flash a long name from truncated
  // (SSR) to full (hydrated), the same one-frame shift `layout-stability.md`
  // forbids. The tab label must show the IDENTICAL truncated text both
  // before and after hydration.
  it("renders the SAME truncated tab label before and after hydration for a local view name past the cap — no flash to the full name", async () => {
    const fullName = "With body and a very long descriptive view name well past the forty-char limit";
    const truncatedName = truncateLocalViewName(fullName);
    expect(truncatedName).not.toBe(fullName); // sanity: this name genuinely exceeds the cap

    const urlState = {
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view: undefined,
      setQ: () => {},
      setQf: () => {},
      setSort: () => {},
      setFilter: () => {},
      setSize: () => {},
      setView: () => {},
      applyView: () => {},
    };
    const sharedProps = {
      collection: "posts" as const,
      urlState,
      defaultPageSize: 25,
      columns: [],
      onColumnsChange: () => {},
      onColumnsStateChange: () => {},
      peekWidth: 384,
      peekWidthTouched: false,
      onPeekWidthChange: () => {},
      initialLocalIndex: [{ viewId: "local-long", name: truncatedName }],
      viewPrefetch: viewPrefetchStub,
    };

    const html = renderToString(wrapper({ children: <SavedListViewTabs {...sharedProps} /> }));
    expect(html).toContain(truncatedName);
    expect(html).not.toContain(fullName);

    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "local-long", name: fullName, state: {} },
    });
    render(<SavedListViewTabs {...sharedProps} />, { wrapper });
    expect(await screen.findByRole("tab", { name: truncatedName })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: fullName })).not.toBeInTheDocument();
    window.localStorage.clear();
  });

  it("never mounts a ResizeObserver for tab overflow", () => {
    let observed = false;
    const OriginalResizeObserver = globalThis.ResizeObserver;
    class SpyResizeObserver {
      observe() {
        observed = true;
      }
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = SpyResizeObserver;
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={{
          q: undefined,
          qf: undefined,
          sort: undefined,
          filter: undefined,
          size: undefined,
          view: undefined,
          setQ: () => {},
          setQf: () => {},
          setSort: () => {},
          setFilter: () => {},
          setSize: () => {},
          setView: () => {},
          applyView: () => {},
        }}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    expect(observed).toBe(false);
    globalThis.ResizeObserver = OriginalResizeObserver;
  });
});

// Bug: the default ("All") view's Rename/Delete were
// gated the SAME loose way a local/shared view's are (`source === local ||
// canX`), which doesn't exclude `default`/`config` at all — a caller with
// `updateView`/`deleteView` saw them fully ENABLED for the default view
// too, and could actually delete it. Fixed: both items always render, but
// are `disabled` for `default`/`config` sources regardless of permission.
describe("SavedListViewTabs — Rename/Delete disabled for default/config views", () => {
  const configWithPreset = defineConfig({
    collections: [
      defineCollection({
        slug: "posts",
        fields: { title: text() },
        admin: { views: [{ viewId: "cfg1", name: "Config View", state: {} }] },
      }),
    ],
    // Deliberately NO `access` config — `assertViewAction`'s own "no-op
    // when config.access is unset" convention means every VIEW_ACTIONS
    // permission (`canUpdateViews`/`canDeleteViews`) resolves `true` here,
    // proving the fix is SOURCE-based, not permission-based: Rename/Delete
    // must still be disabled for default/config even with full permission.
  });

  function presetWrapper({ children }: { children: ReactNode }) {
    return createElement(VexConfigProvider, { config: configWithPreset, children });
  }

  function urlStateFor(view: string | undefined) {
    return {
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view,
      setQ: () => {},
      setQf: () => {},
      setSort: () => {},
      setFilter: () => {},
      setSize: () => {},
      setView: () => {},
      applyView: () => {},
    };
  }

  it("the default (\"All\") view's Rename/Delete render disabled, not hidden", async () => {
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={urlStateFor(undefined)}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper: presetWrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "View actions" }));
    await screen.findByRole("menu");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
  });

  it("a preset (config) view's Rename/Delete also render disabled, not hidden", async () => {
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={urlStateFor("config:cfg1")}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper: presetWrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "View actions" }));
    await screen.findByRole("menu");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("aria-disabled", "true");
  });
});

// Switching views must write the URL atomically
// (`urlState.applyView`, ONE call covering q/qf/sort/filter/size/view/cols,
// diffed against the TARGET view's own baseline — superseding the OLD
// per-field `setQ`/`setQf`/.../`setView` sequence, which diffed against
// the STALE pre-switch view and could leave a redundant `cols=` behind
// switching FROM a shared/config view) and sync LOCAL columns state via
// `onColumnsStateChange` (order AND visible set together, ONE call,
// never the separate `onVisibleColumnsChange`/`onColumnOrderChange` —
// those race, each reading the other's still-stale pre-commit closure
// value). One test per saved-view SOURCE (config/shared/local); the
// default source is already covered structurally — `applyView()`'s own
// code path for it is identical, just with `isDefault` driving
// `urlState.applyView`'s own `view` field, not `onColumnsStateChange`'s.
describe("SavedListViewTabs — applyView atomic switch", () => {
  const columnsCollection = defineCollection({
    slug: "posts",
    fields: { title: text(), slug: text(), body: text() },
    admin: {
      views: [
        { viewId: "cfg-narrow", name: "Config Narrow", state: { columns: ["slug"] } },
        { viewId: "cfg-width", name: "Config Width", state: { columns: ["slug"], peekWidth: 777 } },
      ],
    },
  });
  const columnsConfig = defineConfig({ collections: [columnsCollection] });

  function columnsWrapper({ children }: { children: ReactNode }) {
    return createElement(VexConfigProvider, { config: columnsConfig, children });
  }

  function blankUrlState(view: string | undefined, applyView: (...args: unknown[]) => void = () => {}) {
    return {
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view,
      setQ: () => {},
      setQf: () => {},
      setSort: () => {},
      setFilter: () => {},
      setSize: () => {},
      setView: () => {},
      applyView,
    };
  }

  /**
   * Asserts the BEHAVIOR a view switch's `onColumnsStateChange` call owes —
   * the view's own explicitly-named columns are visible, every OTHER field
   * on the collection is present but hidden, and nothing is lost or
   * duplicated — without coupling to `completeListViewColumnOrder`'s own specific
   * ordering/shape choices (the previous version of these tests
   * asserted the exact returned array, which breaks on any unrelated
   * `completeListViewColumnOrder` change rather than on a real regression in THIS
   * component's own behavior).
   */
  function expectColumnsResolvedTo(
    columns: unknown,
    expected: { visible: string[]; hidden: string[] },
  ): void {
    const entries = columns as (string | { field: string; hidden?: boolean })[];
    const fieldOf = (entry: string | { field: string; hidden?: boolean }) =>
      typeof entry === "string" ? entry : entry.field;
    const isHidden = (entry: string | { field: string; hidden?: boolean }) =>
      typeof entry !== "string" && entry.hidden === true;
    const visibleFields = entries.filter((e) => !isHidden(e)).map(fieldOf);
    const hiddenFields = entries.filter(isHidden).map(fieldOf);
    expect(visibleFields.sort()).toEqual([...expected.visible].sort());
    expect(hiddenFields.sort()).toEqual([...expected.hidden].sort());
    // Every field appears exactly once — nothing lost, nothing duplicated.
    expect(entries.map(fieldOf).sort()).toEqual([...expected.visible, ...expected.hidden].sort());
  }

  it("config: clicking a preset view's tab calls urlState.applyView once with the view, and onColumnsStateChange for local state", async () => {
    const applyView = vi.fn();
    const onColumnsStateChange = vi.fn();
    const onPeekWidthChange = vi.fn();
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(undefined, applyView)}
        defaultPageSize={25}
        columns={["title", "slug", "body"]}
        onColumnsChange={() => {}}
        onColumnsStateChange={onColumnsStateChange}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={onPeekWidthChange}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper: columnsWrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Config Narrow" }));
    expect(applyView).toHaveBeenCalledWith(expect.objectContaining({ viewId: "cfg-narrow" }));
    expect(onColumnsStateChange).toHaveBeenCalledTimes(1);
    expectColumnsResolvedTo(onColumnsStateChange.mock.calls[0]?.[0], {
      visible: ["slug"],
      hidden: ["title", "body", "updatedAt"],
    });
    // `cfg-narrow` has no saved
    // width of its own — switching to it must leave `peekWidth` exactly as it is, never
    // resetting this browser's own remembered preference to the hardcoded default.
    expect(onPeekWidthChange).not.toHaveBeenCalled();
  });

  it("config: clicking a view WITH its own saved width restores it, marked as a view-driven (not user) change", async () => {
    const applyView = vi.fn();
    const onPeekWidthChange = vi.fn();
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(undefined, applyView)}
        defaultPageSize={25}
        columns={["title", "slug", "body"]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={onPeekWidthChange}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper: columnsWrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Config Width" }));
    expect(applyView).toHaveBeenCalledWith(expect.objectContaining({ viewId: "cfg-width" }));
    expect(onPeekWidthChange).toHaveBeenCalledWith(777, "view");
  });

  it("shared: clicking a shared view's tab calls urlState.applyView once with the view, and onColumnsStateChange for local state", async () => {
    sharedViewRows = [
      {
        viewId: "shared-narrow",
        name: "Shared Narrow",
        collection: "posts",
        createdBy: "user1",
        state: { columns: ["body"] },
      },
    ];
    const applyView = vi.fn();
    const onColumnsStateChange = vi.fn();
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(undefined, applyView)}
        defaultPageSize={25}
        columns={["title", "slug", "body"]}
        onColumnsChange={() => {}}
        onColumnsStateChange={onColumnsStateChange}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper: columnsWrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Shared Narrow" }));
    expect(applyView).toHaveBeenCalledWith(expect.objectContaining({ viewId: "shared-narrow" }));
    expect(onColumnsStateChange).toHaveBeenCalledTimes(1);
    expectColumnsResolvedTo(onColumnsStateChange.mock.calls[0]?.[0], {
      visible: ["body"],
      hidden: ["title", "slug", "updatedAt"],
    });
    sharedViewRows = [];
  });

  it("local: clicking a local view's tab calls urlState.applyView once with the view, and onColumnsStateChange for local state", async () => {
    saveLocalSavedListView({
      basePath: "/admin",
      project: "https://example.convex.cloud",
      collection: "posts",
      view: { viewId: "local-narrow", name: "Local Narrow", state: { columns: ["title"] } },
    });
    const applyView = vi.fn();
    const onColumnsStateChange = vi.fn();
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(undefined, applyView)}
        defaultPageSize={25}
        columns={["title", "slug", "body"]}
        onColumnsChange={() => {}}
        onColumnsStateChange={onColumnsStateChange}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper: columnsWrapper },
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Local Narrow" }));
    expect(applyView).toHaveBeenCalledWith(expect.objectContaining({ viewId: "local-narrow" }));
    expect(onColumnsStateChange).toHaveBeenCalledTimes(1);
    expectColumnsResolvedTo(onColumnsStateChange.mock.calls[0]?.[0], {
      visible: ["title"],
      hidden: ["slug", "body", "updatedAt"],
    });
    window.localStorage.clear();
  });
});

// Deleting a view (local or shared) left its tab on
// screen until a full page refresh — `mergeListViews`'s cookie-index
// placeholder loop trusted `initialLocalIndex` unconditionally for any
// `viewId` missing from the live `local`/`shared` source, even once that
// source had genuinely resolved (fixed via `localHydrated` gating in
// `useSavedListViews.ts`; shared views never had this issue — they're driven
// entirely by the live query, no static index involved; these tests cover
// both sources, active and non-active, to lock it in).
describe("SavedListViewTabs — delete removes the tab immediately, no stale ghost entry", () => {
  function urlStateFor(view: string | undefined, setView: (value: string | undefined) => void) {
    return {
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view,
      setQ: () => {},
      setQf: () => {},
      setSort: () => {},
      setFilter: () => {},
      setSize: () => {},
      setView,
      // Mirrors the real `useListViewUrlState().applyView`'s `view=` write
      // only — this describe block's tests assert on tab
      // presence/selection and `setView`'s own final argument, not on
      // cols/sort/etc, so a full `serializeListViewUrlState` replica isn't
      // needed here.
      applyView: (view: Pick<SavedListViewEntry, "viewId" | "source">) => {
        setView(view.viewId === "default" ? undefined : encodeViewUrlValue(view));
      },
    };
  }

  async function deleteViaActionsMenu(): Promise<void> {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "View actions" }));
    await screen.findByRole("menu");
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await screen.findByRole("alertdialog");
    await user.click(screen.getByRole("button", { name: "Delete" }));
  }

  // A REACTIVE `view` state — the plain `urlStateFor(...)`/`vi.fn()` combo
  // above is a static prop snapshot, fine for "delete the view the URL
  // already names", but a "click a tab, THEN delete it" flow needs the
  // click's own `setView` call to actually feed back into `activeViewId`
  // (a controlled `<Tabs value={activeViewId}>` otherwise snaps the
  // visual selection back to the stale value, and "View actions" keeps
  // targeting the ORIGINAL, not-yet-navigated-to active view).
  function StatefulListViewTabs(
    props: Omit<ComponentProps<typeof SavedListViewTabs>, "urlState"> & { initialView?: string },
  ) {
    const [view, setView] = useState<string | undefined>(props.initialView);
    return <SavedListViewTabs {...props} urlState={urlStateFor(view, setView)} />;
  }

  it("local: deleting the ACTIVE local view removes its tab immediately and falls back to the default view", async () => {
    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "local-del-active", name: "Local Del Active", state: {} },
    });
    const setView = vi.fn();
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={urlStateFor("local:local-del-active", setView)}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    await screen.findByRole("tab", { name: "Local Del Active" });
    await deleteViaActionsMenu();
    await waitFor(() => expect(screen.queryByRole("tab", { name: "Local Del Active" })).not.toBeInTheDocument());
    expect(setView).toHaveBeenCalledWith(undefined);
    window.localStorage.clear();
  });

  it("local: navigating to a different local view then deleting it removes its tab immediately, a sibling view survives", async () => {
    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "local-del-other", name: "Local Del Other", state: {} },
    });
    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "local-keeper", name: "Local Keeper", state: {} },
    });
    render(
      <StatefulListViewTabs
        collection="posts"
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    await screen.findByRole("tab", { name: "Local Del Other" });
    const user = userEvent.setup();
    // Starts on "All" (no `?view=`) — navigate to the target tab first
    // (unlike the ACTIVE-on-mount test above), THEN delete it.
    await user.click(screen.getByRole("tab", { name: "Local Del Other" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Local Del Other" })).toHaveAttribute("aria-selected", "true"));
    await deleteViaActionsMenu();
    await waitFor(() => expect(screen.queryByRole("tab", { name: "Local Del Other" })).not.toBeInTheDocument());
    expect(screen.getByRole("tab", { name: "Local Keeper" })).toBeInTheDocument();
    window.localStorage.clear();
  });

  it("shared: deleting the ACTIVE shared view removes its tab immediately and falls back to the default view", async () => {
    sharedViewRows = [
      { viewId: "shared-del-active", name: "Shared Del Active", collection: "posts", createdBy: "user1", state: {} },
    ];
    const setView = vi.fn();
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={urlStateFor("shared:shared-del-active", setView)}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    await screen.findByRole("tab", { name: "Shared Del Active" });
    await deleteViaActionsMenu();
    await waitFor(() => expect(screen.queryByRole("tab", { name: "Shared Del Active" })).not.toBeInTheDocument());
    expect(setView).toHaveBeenCalledWith(undefined);
    sharedViewRows = [];
  });

  it("shared: navigating to a different shared view then deleting it removes its tab immediately, a sibling view survives", async () => {
    sharedViewRows = [
      { viewId: "shared-del-other", name: "Shared Del Other", collection: "posts", createdBy: "user1", state: {} },
      { viewId: "shared-keeper", name: "Shared Keeper", collection: "posts", createdBy: "user1", state: {} },
    ];
    render(
      <StatefulListViewTabs
        collection="posts"
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    await screen.findByRole("tab", { name: "Shared Del Other" });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Shared Del Other" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Shared Del Other" })).toHaveAttribute("aria-selected", "true"));
    await deleteViaActionsMenu();
    await waitFor(() => expect(screen.queryByRole("tab", { name: "Shared Del Other" })).not.toBeInTheDocument());
    expect(screen.getByRole("tab", { name: "Shared Keeper" })).toBeInTheDocument();
    sharedViewRows = [];
  });
});

// Clicking "All views" used to open TWO menus at once — one
// correctly positioned under the button, one at the viewport's top-left
// corner. Root cause: up to 4 `TAB_OVERFLOW_STAGES` Popovers were
// simultaneously MOUNTED (whichever satisfied `totalTabs > stage.count` for
// the current view count, independent of width) sharing ONE `menuOpen`
// boolean — opening the CSS-visible one also opened every other mounted
// stage's content, including a CSS-hidden one whose zero-size
// (`display:none`) anchor portalled its popup to the top-left corner. Fixed
// by collapsing to exactly ONE trigger, unconditionally, merged with what
// used to be a separate sub-768px `DataTableResponsiveMenu` block — so
// there is no second, CSS-hidden-but-mounted instance left to ever share
// state with. These tests seed 7 total views (well past the OLD code's
// highest `TAB_OVERFLOW_STAGES` threshold of 8 … actually past its count-6
// stage, the one a real repro screenshot's view count
// triggered) — `getByRole`/`getByPlaceholderText` below THROW on more than
// one match, so a regression back to multiple mounted triggers/popovers
// fails these tests outright, not just a missed positive assertion.
describe("SavedListViewTabs — single views trigger, no duplicate popover", () => {
  function blankUrlState(view: string | undefined, applyView: (...args: unknown[]) => void = () => {}) {
    return {
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view,
      setQ: () => {},
      setQf: () => {},
      setSort: () => {},
      setFilter: () => {},
      setSize: () => {},
      setView: () => {},
      applyView,
    };
  }

  function seedManyViews(): void {
    sharedViewRows = [
      { viewId: "s1", name: "Shared One", collection: "posts", createdBy: "user1", state: {} },
      { viewId: "s2", name: "Shared Two", collection: "posts", createdBy: "user1", state: {} },
      { viewId: "s3", name: "Shared Three", collection: "posts", createdBy: "user1", state: {} },
      { viewId: "s4", name: "Shared Four", collection: "posts", createdBy: "user1", state: {} },
      { viewId: "s5", name: "Shared Five", collection: "posts", createdBy: "user1", state: {} },
      { viewId: "s6", name: "Shared Six", collection: "posts", createdBy: "user1", state: {} },
    ];
  }

  // The trigger now renders TWO labels unconditionally — a static "All views" (visible
  // `@md/list` and up) and the active view's own name (visible below `@md/list`) — pure
  // CSS toggles which is shown, so BOTH are present in jsdom (which
  // applies no real CSS), making the button's own computed accessible NAME an
  // unpredictable concatenation of both. Locate it by its distinguishing icon instead.
  function getViewsTrigger(container: HTMLElement): HTMLElement {
    const triggers = Array.from(container.querySelectorAll("button")).filter((b) =>
      b.querySelector(".lucide-chevrons-up-down"),
    );
    expect(triggers).toHaveLength(1);
    return triggers[0] as HTMLElement;
  }

  it("renders exactly one views trigger button — not a per-breakpoint duplicate", () => {
    seedManyViews();
    const { container } = render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(undefined)}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    // `getViewsTrigger`'s own `toHaveLength(1)` throws on more than one match — the OLD
    // code, with 7 total views (All + 6 shared), would have mounted the `count: 2`,
    // `count: 4`, and `count: 6` stages simultaneously (3 Popovers sharing one `menuOpen`),
    // each with its own trigger button.
    expect(getViewsTrigger(container)).toBeInTheDocument();
    sharedViewRows = [];
  });

  it("clicking the trigger opens exactly one menu; selecting a view closes it and applies the view", async () => {
    seedManyViews();
    const applyView = vi.fn();
    const { container } = render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(undefined, applyView)}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    const user = userEvent.setup();
    await user.click(getViewsTrigger(container));
    // Exactly one search box — the OLD bug's ghost popover rendered the
    // SAME `allViewsMenuContent` a second time, which would make this
    // `getByPlaceholderText` throw "found multiple elements" instead of
    // resolving to one.
    expect(screen.getByPlaceholderText("Search views…")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Shared Three" }));
    expect(applyView).toHaveBeenCalledWith(expect.objectContaining({ viewId: "s3" }));
    await waitFor(() => expect(screen.queryByPlaceholderText("Search views…")).not.toBeInTheDocument());
    sharedViewRows = [];
  });

  it("the trigger renders BOTH labels unconditionally — a static 'All views' and the active view's own name — pure CSS decides which shows (static on md/lg where the tab row itself is visible, active name on small screens where only the trigger remains, so the caller can still tell which view is active even if its own tab has wrapped off the visible line)", () => {
    seedManyViews();
    const { container } = render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(encodeViewUrlValue({ source: "shared", viewId: "s5" }))}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    const trigger = getViewsTrigger(container);
    // Static label, always present — not swapped out, not computed client-side.
    expect(within(trigger).getByText("All views")).toBeInTheDocument();
    // Active-view label, ALSO always present — the active SHARED view's own name, not "All".
    expect(within(trigger).getByText("Shared Five")).toBeInTheDocument();
    sharedViewRows = [];
  });

  it("the tab strip wraps via a fixed-height, overflow-hidden container — not a per-tab breakpoint reveal class", () => {
    seedManyViews();
    const { container } = render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(undefined)}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    // The wrapping div is the clipping viewport:
    // fixed one-line height + `overflow-hidden`, `TabsList` itself set to
    // `flex-wrap` so tabs that don't fit the first line wrap onto an
    // invisible second-plus line rather than a per-tab computed reveal
    // class (removed — `tabRevealClassName`/`TAB_REVEAL_CLASSNAMES` no
    // longer exist).
    const wrap = container.querySelector(".h-9.overflow-hidden");
    expect(wrap).not.toBeNull();
    const tabsList = container.querySelector('[data-slot="tabs-list"]');
    expect(tabsList).toHaveClass("flex-wrap");
    // Every tab is unconditionally present in the DOM — content-aware
    // wrapping, not a fixed per-breakpoint count.
    expect(screen.getAllByRole("tab")).toHaveLength(7);
    sharedViewRows = [];
  });
});

// Removing the `<QueryErrorBoundary>` (the Suspense
// split's own error-catching mechanism — see `ListViewTabStrip`'s own doc comment for why
// it was removed) must not have dropped the "Couldn't load shared
// views · Retry" notice — a shared-views query
// failure still needs the SAME notice, with the
// default/config/local tabs intact (not a crash, not a blank tab row), in the SAME frame
// (the tab row's own DOM shape never changes between a loading/error/resolved shared-views
// state — `views` already falls back to default/config/local-only in all three). A
// DEHYDRATED error (the server's own `listViews` prefetch failing, captured in the
// client's hydrated cache as `status: "error"`) is exactly this test's own shape: the mock
// returns `isError: true` from the very FIRST render, the same as a plain `useQuery`
// reading an already-"error" dehydrated cache entry would on first paint — there is no
// separate "pending, then later errors" case to simulate, since `useSavedListViews` is a plain
// `useQuery`, not Suspense-gated.
describe("SavedListViewTabs — shared-views query error (regression check)", () => {
  function blankUrlState(view: string | undefined) {
    return {
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view,
      setQ: () => {},
      setQf: () => {},
      setSort: () => {},
      setFilter: () => {},
      setSize: () => {},
      setView: () => {},
      applyView: () => {},
    };
  }

  it("shows the 'Couldn't load shared views' toast with a Retry action, default/config/local tabs stay intact, same frame", () => {
    sharedViewRows = [{ viewId: "s1", name: "Shared One", collection: "posts", createdBy: "user1", state: {} }];
    sharedViewsError = new Error("listViews failed");
    render(
      <SavedListViewTabs
        collection="posts"
        urlState={blankUrlState(undefined)}
        defaultPageSize={25}
        columns={[]}
        onColumnsChange={() => {}}
        onColumnsStateChange={() => {}}
        peekWidth={384}
        peekWidthTouched={false}
        onPeekWidthChange={() => {}}
        viewPrefetch={viewPrefetchStub}
      />,
      { wrapper },
    );
    // Same tab-row shape a loading/not-yet-resolved state already has — the shared view
    // from `sharedViewRows` does NOT appear (the query errored, `data` is `undefined`,
    // `mergeListViews` falls back to `shared: []`), but "All" (the always-known default
    // view) is unaffected — no crash, no blank row.
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Shared One" })).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't load shared views",
      expect.objectContaining({ action: expect.objectContaining({ label: "Retry" }) }),
    );
    // The Retry action calls `useSavedListViews`'s own exposed `refetch` — TanStack Query's
    // `sharedQuery.refetch` directly, not a broader `invalidateQueries` call.
    const call = (toast.error as ReturnType<typeof vi.fn>).mock.calls[0];
    call[1].action.onClick();
    expect(sharedViewsRefetch).toHaveBeenCalledTimes(1);
    sharedViewRows = [];
    sharedViewsError = null;
    sharedViewsRefetch = vi.fn();
  });
});
