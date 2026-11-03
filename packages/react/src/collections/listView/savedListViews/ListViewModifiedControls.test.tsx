import { createElement, useSyncExternalStore, type ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineAccess, defineCollection, defineConfig, text, VIEW_ACTIONS, type VexStoredView } from "@vexcms/core";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";
import { VexConfigProvider } from "../../../config/VexConfigContext";
import { VexAuthProvider } from "../../../auth/VexAuthContext";
import { localViewsStorageKey, saveLocalSavedListView } from "./localSavedListViewsStore";
import { encodeViewUrlValue, type SavedListViewEntry } from "./useSavedListViews";
import { ListViewModifiedControls, type ListViewModifiedControlsProps } from "./ListViewModifiedControls";

// Same lightweight mocking as `SavedListViewTabs.test.tsx`/`useSavedListViews.test.ts` —
// `useSavedListViews()` needs a Convex client, a `@tanstack/react-query`
// `useQuery`, and a `VexConfigContext`; `useMutation`/`useConvexMutation`
// are stubbed too (mirroring `SavedListViewTabs.test.tsx`'s own pattern) so
// `useSaveView()`'s eager `useConvexMutation()` call never needs a
// real `ConvexProvider`.
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
    // `useSaveView()` (`../../client`) calls this hook eagerly to build its
    // `mutationFn`, independent of the `useMutation` mock below — it would
    // otherwise require a real `ConvexProvider` (`SavedListViewTabs.test.tsx`'s
    // own established pattern for the same reason).
    useConvexMutation: () => async () => {},
  };
});

let sharedViewRows: VexStoredView[] = [];
const sharedViewListeners = new Set<() => void>();
/** Mutates `sharedViewRows` AND notifies every subscriber — simulates a REAL Convex live-query's own reactivity (a bare reassignment wouldn't re-render anything subscribed via `useSyncExternalStore` below). */
function setSharedViewRows(rows: VexStoredView[]) {
  sharedViewRows = rows;
  sharedViewListeners.forEach((listener) => listener());
}

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown; initialData?: unknown }) => {
      const liveRows = useSyncExternalStore(
        (onChange) => {
          sharedViewListeners.add(onChange);
          return () => sharedViewListeners.delete(onChange);
        },
        () => sharedViewRows,
      );
      return "__reference" in options
        ? { data: options.initialData ?? liveRows, isPending: false }
        : { data: undefined, isPending: true };
    },
    // `mutateAsync` simulates the saved row actually landing back through
    // the (mocked) live `listViews` subscription — a real Convex mutation
    // doesn't return the new row directly to the caller; the SAME
    // reactive query picks it up, which is what `ListViewModifiedControls`
    // relies on to see its own save reflected (the developer-reported
    // "Modified stays stuck after Save" bug this file's new tests guard).
    useMutation: () => ({
      mutateAsync: async (args: {
        collection: string;
        view: { viewId: string; name: string; description?: string; state: VexStoredView["state"] };
      }) => {
        const index = sharedViewRows.findIndex((v) => v.viewId === args.view.viewId);
        const row: VexStoredView = {
          viewId: args.view.viewId,
          name: args.view.name,
          description: args.view.description,
          state: args.view.state,
          collection: args.collection,
          createdBy: "u1",
        };
        setSharedViewRows(index === -1 ? [...sharedViewRows, row] : sharedViewRows.map((v, i) => (i === index ? row : v)));
      },
      isPending: false,
    }),
  };
});

const posts = defineCollection({
  slug: "posts",
  fields: { title: text() },
  admin: {
    views: [
      {
        viewId: "cfg1",
        name: "Config View",
        state: { where: { field: "title", op: "eq", value: "hidden" } },
      },
    ],
  },
});

const access = defineAccess({
  roles: ["canUpdate", "cannotUpdate"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    canUpdate: { posts: { [VIEW_ACTIONS.readViews]: true, [VIEW_ACTIONS.updateView]: true, [VIEW_ACTIONS.createView]: true } },
    cannotUpdate: { posts: { [VIEW_ACTIONS.readViews]: true, [VIEW_ACTIONS.updateView]: false, [VIEW_ACTIONS.createView]: true } },
  } as never,
});

const testConfig = defineConfig({
  access,
  collections: [posts],
});

const asUser = (role: string): Record<string, unknown> => ({ _id: "u1", roles: role });

function Providers(role: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(VexConfigProvider, {
      config: testConfig,
      children: createElement(VexAuthProvider, { value: { user: asUser(role) }, children }),
    });
  };
}

/** A `ListViewUrlStateSlice`-shaped prop set differing from `baseline` in `sort`, guaranteeing `isModified`. */
function buildModifiedUrlState(overrides: { view: string | undefined }) {
  return {
    q: "",
    qf: undefined,
    sort: { field: "title", order: "desc" as const },
    filter: undefined,
    size: undefined,
    view: overrides.view,
    setQ: vi.fn(),
    setQf: vi.fn(),
    setSort: vi.fn(),
    setFilter: vi.fn(),
    setSize: vi.fn(),
    setView: vi.fn(),
    applyView: vi.fn(),
  };
}

/** A `ListViewUrlStateSlice`-shaped prop set matching the collection's own default ("All") view exactly — no modification. */
function buildBaselineUrlState(overrides: {
  view: string | undefined;
  filter?: { field: string; op: "eq"; value: unknown };
}) {
  return {
    q: "",
    qf: undefined,
    sort: undefined,
    filter: overrides.filter,
    size: undefined,
    view: overrides.view,
    setQ: vi.fn(),
    setQf: vi.fn(),
    setSort: vi.fn(),
    setFilter: vi.fn(),
    setSize: vi.fn(),
    setView: vi.fn(),
    applyView: vi.fn(),
  };
}

function renderControls(props: Partial<ListViewModifiedControlsProps> & { urlState: ListViewModifiedControlsProps["urlState"] }, role: string) {
  return render(
    createElement(ListViewModifiedControls, {
      collection: "posts" as never,
      defaultPageSize: 10,
      columns: [],
      onColumnsChange: vi.fn(),
      onColumnsStateChange: vi.fn(),
      peekWidth: 384,
      peekWidthTouched: false,
      onPeekWidthChange: vi.fn(),
      ...props,
    }),
    { wrapper: Providers(role) },
  );
}

beforeEach(() => {
  window.localStorage.clear();
  sharedViewRows = [];
});

afterEach(() => {
  window.localStorage.clear();
});

describe("ListViewModifiedControls", () => {
  it("renders nothing when no view param is present and state matches the default view exactly (Decision 45/48)", () => {
    renderControls(
      {
        urlState: buildBaselineUrlState({ view: undefined }),
        columns: ["title", "updatedAt"],
      },
      "canUpdate",
    );
    expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();
  });

  it("shows Modified when state diverges from the default view while \"All\" is active (Decision 45/48 — the default is a real, diffable view now)", () => {
    renderControls({ urlState: buildModifiedUrlState({ view: undefined }) }, "canUpdate");
    expect(screen.getByText(/Modified:/)).toBeInTheDocument();
  });


  it("renders nothing when the active view matches the current state exactly", () => {
    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "loc1", name: "Local", state: { sort: { field: "_creationTime", order: "desc" } } },
    });
    const urlState = {
      ...buildModifiedUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc1" }) }),
      sort: { field: "_creationTime", order: "desc" as const },
    };
    // `loc1` never declared explicit `columns`, so its resolved
    // `columnOrder` (Decision 47) is the collection's own default
    // declaration order — `title` then the auto-injected `updatedAt`.
    renderControls(
      { urlState, columns: ["title", "updatedAt"] },
      "canUpdate",
    );
    expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();
  });

  it("a local view saves in place — no fallback dialog opens", () => {
    saveLocalSavedListView({ basePath: "/admin", project, collection: "posts", view: { viewId: "loc1", name: "Local", state: {} } });
    const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc1" }) });
    renderControls({ urlState }, "canUpdate");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("a shared view WITH updateView saves in place — no fallback dialog opens", () => {
    sharedViewRows = [{ viewId: "shr1", name: "Shared", state: {}, collection: "posts", createdBy: "u1" }];
    const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "shared", viewId: "shr1" }) });
    renderControls({ urlState }, "canUpdate");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("a shared view WITHOUT updateView opens the fallback dialog, pre-filled as a new local copy", () => {
    sharedViewRows = [{ viewId: "shr1", name: "Shared", state: {}, collection: "posts", createdBy: "u1" }];
    const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "shared", viewId: "shr1" }) });
    renderControls({ urlState }, "cannotUpdate");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Shared (copy)");
  });

  it("a config (preset) view ALWAYS opens the fallback dialog — never updatable in place", () => {
    const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "config", viewId: "cfg1" }) });
    renderControls({ urlState }, "canUpdate");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Config View (copy)");
  });

  it("the default (\"All\") view ALWAYS opens the fallback dialog — never updatable in place (Decision 13/45/48)", () => {
    const urlState = buildModifiedUrlState({ view: undefined });
    renderControls({ urlState }, "canUpdate");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("All (copy)");
  });

  it("Reset reapplies the active view's own saved fields, including columns via onColumnsChange (developer-reported fix)", () => {
    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "loc1", name: "Local", state: { sort: { field: "_creationTime", order: "asc" } } },
    });
    const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc1" }) });
    const onColumnsChange = vi.fn();
    renderControls({ urlState, onColumnsChange, columns: [] }, "canUpdate");
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(urlState.setSort).toHaveBeenCalledWith({ field: "_creationTime", order: "asc" });
    // `loc1` declared no explicit `columns` — resolves to the collection's
    // own default (`title` + the auto-injected `updatedAt`).
    expect(onColumnsChange).toHaveBeenCalledWith(["title", "updatedAt"]);
  });

  // Developer-reported: a local view's full state lives in the URL
  // (Decision 41) — before its cookie-index PLACEHOLDER (Decision 41's
  // `toIndexEntry`, present on a cold SSR/reload before `localStorage`
  // hydrates) is replaced by the real saved view, comparing the URL's own
  // (real) values against the placeholder's empty where/sort/search used
  // to falsely show "Modified: …" until hydration completed.
  it("a cold-loaded local view (cookie-index placeholder only, no real data yet) never shows Modified, even though the URL carries a real filter", () => {
    const urlState = buildBaselineUrlState({
      view: encodeViewUrlValue({ source: "local", viewId: "loc-placeholder" }),
      filter: { field: "title", op: "eq", value: "published" },
    });
    renderControls(
      { urlState, initialLocalIndex: [{ viewId: "loc-placeholder", name: "Published" }] },
      "canUpdate",
    );
    expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();
  });

  // Regression guard for the fix above: once the view is for REAL hydrated
  // (not a placeholder), a genuine divergence from its saved state must
  // still show Modified — the placeholder fix must not blanket-suppress
  // every local view.
  it("a REAL (hydrated) local view that genuinely diverges from its saved filter still shows Modified", () => {
    saveLocalSavedListView({
      basePath: "/admin",
      project,
      collection: "posts",
      view: { viewId: "loc1", name: "Local", state: { where: { field: "title", op: "eq", value: "saved-value" } } },
    });
    const urlState = buildBaselineUrlState({
      view: encodeViewUrlValue({ source: "local", viewId: "loc1" }),
      filter: { field: "title", op: "eq", value: "different-value" },
    });
    renderControls({ urlState }, "canUpdate");
    expect(screen.getByText(/Modified:/)).toBeInTheDocument();
  });

  // Developer-reported: after a successful Save, the Modified summary +
  // Reset + Save controls must disappear immediately — the save's own
  // updated data (local storage event, or the shared view's live query)
  // must be reflected without a reload. Could not reproduce this live in
  // the running app (a prior "atomic onColumnsChange" fix already covers
  // the view-switch race this symptom usually comes from) — these tests
  // lock the save-in-place path in regardless.
  it("Save on a local view clears Modified once the save lands", async () => {
    saveLocalSavedListView({ basePath: "/admin", project, collection: "posts", view: { viewId: "loc1", name: "Local", state: {} } });
    const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc1" }) });
    renderControls(
      { urlState, columns: ["title", "updatedAt"] },
      "canUpdate",
    );
    expect(screen.getByText(/Modified:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument());
  });

  it("Save on a shared view (with updateView) clears Modified once the save lands", async () => {
    sharedViewRows = [{ viewId: "shr1", name: "Shared", state: {}, collection: "posts", createdBy: "u1" }];
    const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "shared", viewId: "shr1" }) });
    renderControls(
      { urlState, columns: ["title", "updatedAt"] },
      "canUpdate",
    );
    expect(screen.getByText(/Modified:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument());
  });

  it("the preset-fallback-to-new-local save (config view, no updateView in place) clears Modified once the new local view is active", async () => {
    const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "config", viewId: "cfg1" }) });
    const { rerender } = renderControls(
      { urlState, columns: ["title", "updatedAt"] },
      "canUpdate",
    );
    expect(screen.getByText(/Modified:/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // `handleCopyDialogSubmit` calls `urlState.applyView(view, …)` with the
    // new local view's own shape — this test harness's `urlState` is a
    // static prop object (not reactive state), so simulate the resulting
    // navigation the same way a real `useListViewUrlState` commit would:
    // re-render with that id now active.
    expect(urlState.applyView).toHaveBeenCalled();
    const [appliedView] = urlState.applyView.mock.calls.at(-1) as [Pick<SavedListViewEntry, "viewId" | "source">];
    const newViewEncoded = encodeViewUrlValue(appliedView);
    rerender(
      createElement(ListViewModifiedControls, {
        collection: "posts" as never,
        defaultPageSize: 10,
        columns: ["title", "updatedAt"],
        onColumnsChange: vi.fn(),
        onColumnsStateChange: vi.fn(),
        peekWidth: 384,
        peekWidthTouched: false,
        onPeekWidthChange: vi.fn(),
        urlState: { ...buildBaselineUrlState({ view: newViewEncoded }) },
      }),
    );
  });

  // Developer-reported: clicking "Clear all" on a view with its own saved
  // filter wrote NOTHING distinguishable from "untouched" (both omit
  // `filter=`), so `resolveEffectiveViewState` silently re-inherited the
  // view's own filter — no Modified badge, no way to Reset/Save the
  // cleared state, and nothing durable persisted across a refresh. Fixed
  // via `filter: null` — the explicit clear sentinel, distinct from
  // `undefined` (absent/inherit).
  describe("Clear all filter — explicit clear sentinel (developer-reported)", () => {
    it("shows Modified once the user clears a view's own saved filter", () => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "posts",
        view: { viewId: "loc-filter", name: "Local Filter", state: { where: { field: "title", op: "eq", value: "saved" } } },
      });
      const urlState = {
        ...buildBaselineUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc-filter" }) }),
        filter: null,
      };
      renderControls({ urlState }, "canUpdate");
      expect(screen.getByText(/Modified:/)).toBeInTheDocument();
    });

    it("Reset restores the view's own saved filter after a clear", () => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "posts",
        view: { viewId: "loc-filter2", name: "Local Filter 2", state: { where: { field: "title", op: "eq", value: "saved" } } },
      });
      const urlState = {
        ...buildBaselineUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc-filter2" }) }),
        filter: null,
      };
      renderControls({ urlState }, "canUpdate");
      fireEvent.click(screen.getByRole("button", { name: "Reset" }));
      expect(urlState.setFilter).toHaveBeenCalledWith({ field: "title", op: "eq", value: "saved" });
    });

    it("Save persists the cleared (undefined) filter, not the view's old saved one", async () => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "posts",
        view: { viewId: "loc-filter3", name: "Local Filter 3", state: { where: { field: "title", op: "eq", value: "saved" } } },
      });
      const urlState = {
        ...buildBaselineUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc-filter3" }) }),
        filter: null,
      };
      renderControls(
        { urlState, columns: ["title", "updatedAt"] },
        "canUpdate",
      );
      expect(screen.getByText(/Modified:/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument());
      const envelope = JSON.parse(
        window.localStorage.getItem(localViewsStorageKey({ project, collection: "posts" })) ?? "{}",
      ) as { views?: { viewId: string; state: { where?: unknown } }[] };
      const saved = (envelope.views ?? []).find((view) => view.viewId === "loc-filter3");
      expect(saved?.state.where).toBeUndefined();
    });

    it("a shared view with updateView: Save persists the cleared filter via saveView, not the view's old saved one", async () => {
      sharedViewRows = [
        {
          viewId: "shr-filter",
          name: "Shared Filter",
          state: { where: { field: "title", op: "eq", value: "saved" } },
          collection: "posts",
          createdBy: "u1",
        },
      ];
      const urlState = {
        ...buildBaselineUrlState({ view: encodeViewUrlValue({ source: "shared", viewId: "shr-filter" }) }),
        filter: null,
      };
      renderControls(
        { urlState, columns: ["title", "updatedAt"] },
        "canUpdate",
      );
      expect(screen.getByText(/Modified:/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument());
      const saved = sharedViewRows.find((view) => view.viewId === "shr-filter");
      expect(saved?.state.where).toBeUndefined();
    });
  });

  // Developer decision (binding, "peek-resize-save-rule"): peek width counts toward
  // "Modified" ONLY for a view with its OWN saved width; Save only starts persisting one
  // into a view that never had one when the user explicitly resized the peek while on it
  // (`peekWidthTouched`); Reset only restores a width for a view that has one.
  describe("peekWidth Save/Reset rules (developer decision, binding, \"peek-resize-save-rule\")", () => {
    it("Save persists a NEW width for a view that already had its own saved width (standard modified-state save)", () => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "posts",
        view: { viewId: "loc-width1", name: "Width Local", state: { peekWidth: 520 } },
      });
      const urlState = buildBaselineUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc-width1" }) });
      renderControls(
        { urlState, columns: ["title", "updatedAt"], peekWidth: 600, peekWidthTouched: true },
        "canUpdate",
      );
      expect(screen.getByText("Modified: preview width")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      const envelope = JSON.parse(
        window.localStorage.getItem(localViewsStorageKey({ project, collection: "posts" })) ?? "{}",
      ) as { views?: { viewId: string; state: { peekWidth?: number } }[] };
      const saved = (envelope.views ?? []).find((view) => view.viewId === "loc-width1");
      expect(saved?.state.peekWidth).toBe(600);
    });

    it("Save does NOT start saving a peekWidth into a view with no saved width when the user never touched it on this view", () => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "posts",
        view: { viewId: "loc-width2", name: "No Width Local", state: { sort: { field: "_creationTime", order: "asc" } } },
      });
      const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc-width2" }) });
      renderControls(
        { urlState, columns: ["title", "updatedAt"], peekWidth: 600, peekWidthTouched: false },
        "canUpdate",
      );
      // Modified from the sort change alone (`buildModifiedUrlState`) — peekWidth itself
      // never shows as a category (the view has none of its own, rule 2).
      expect(screen.getByText("Modified: sort")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      const envelope = JSON.parse(
        window.localStorage.getItem(localViewsStorageKey({ project, collection: "posts" })) ?? "{}",
      ) as { views?: { viewId: string; state: { peekWidth?: number } }[] };
      const saved = (envelope.views ?? []).find((view) => view.viewId === "loc-width2");
      expect(saved?.state.peekWidth).toBeUndefined();
    });

    it("Save DOES start saving a peekWidth into a view with no saved width once the user explicitly resized the peek while on it", () => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "posts",
        view: { viewId: "loc-width3", name: "No Width Local 2", state: { sort: { field: "_creationTime", order: "asc" } } },
      });
      const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc-width3" }) });
      renderControls(
        { urlState, columns: ["title", "updatedAt"], peekWidth: 600, peekWidthTouched: true },
        "canUpdate",
      );
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      const envelope = JSON.parse(
        window.localStorage.getItem(localViewsStorageKey({ project, collection: "posts" })) ?? "{}",
      ) as { views?: { viewId: string; state: { peekWidth?: number } }[] };
      const saved = (envelope.views ?? []).find((view) => view.viewId === "loc-width3");
      expect(saved?.state.peekWidth).toBe(600);
    });

    it("a shared view with no saved width: Save captures the live width via saveView once touched, same rule as a local view", async () => {
      sharedViewRows = [
        { viewId: "shr-width", name: "Shared No Width", state: {}, collection: "posts", createdBy: "u1" },
      ];
      const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "shared", viewId: "shr-width" }) });
      renderControls(
        { urlState, columns: ["title", "updatedAt"], peekWidth: 444, peekWidthTouched: true },
        "canUpdate",
      );
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(sharedViewRows.find((v) => v.viewId === "shr-width")?.state.peekWidth).toBe(444));
    });

    it("Reset restores a view's own saved width", () => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "posts",
        view: { viewId: "loc-width4", name: "Width Local 2", state: { peekWidth: 520 } },
      });
      const urlState = buildBaselineUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc-width4" }) });
      const onPeekWidthChange = vi.fn();
      renderControls(
        { urlState, columns: ["title", "updatedAt"], peekWidth: 600, peekWidthTouched: true, onPeekWidthChange },
        "canUpdate",
      );
      fireEvent.click(screen.getByRole("button", { name: "Reset" }));
      expect(onPeekWidthChange).toHaveBeenCalledWith(520, "view");
    });

    it("Reset does not touch peekWidth at all for a view with no saved width of its own", () => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "posts",
        view: { viewId: "loc-width5", name: "No Width Local 3", state: { sort: { field: "_creationTime", order: "asc" } } },
      });
      const urlState = buildModifiedUrlState({ view: encodeViewUrlValue({ source: "local", viewId: "loc-width5" }) });
      const onPeekWidthChange = vi.fn();
      renderControls(
        { urlState, columns: ["title", "updatedAt"], peekWidth: 600, peekWidthTouched: false, onPeekWidthChange },
        "canUpdate",
      );
      fireEvent.click(screen.getByRole("button", { name: "Reset" }));
      expect(onPeekWidthChange).not.toHaveBeenCalled();
    });
  });
});
