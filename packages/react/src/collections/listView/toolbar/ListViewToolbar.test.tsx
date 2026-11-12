import { createElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defineConfig, defineCollection, SLOT_IDS, text, type TDocument } from "@vexcms/core";
import { VexConfigProvider } from "../../../config/VexConfigContext";
import { VexAuthProvider } from "../../../auth/VexAuthContext";
import { ListViewContextProvider } from "../ListViewContext";
import { ListViewToolbar, LIST_VIEW_TOOLBAR_SLOT_ID } from "./ListViewToolbar";

// `ListViewModifiedControls` (mounted directly by `ListViewToolbar`) calls
// `useSavedListViews()`/`useSaveView()` unconditionally — both need a Convex
// client, a `@tanstack/react-query` `useQuery`, and a mutation — same
// lightweight stubs `ListViewModifiedControls.test.tsx` already
// established, reused verbatim here rather than inventing a second
// mocking convention for the same two hooks.
vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("convex/react")>();
  return { ...actual, useConvex: () => ({ url: "https://example.convex.cloud" }) };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@convex-dev/react-query")>();
  return {
    ...actual,
    convexQuery: (reference: unknown, args: unknown) => ({ __reference: reference, __args: args }),
    useConvexMutation: () => async () => {},
  };
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown; initialData?: unknown }) =>
      "__reference" in options
        ? { data: options.initialData ?? [], isPending: false }
        : { data: undefined, isPending: true },
    useMutation: () => ({ mutateAsync: async () => {}, isPending: false }),
  };
});

const collection = defineCollection({ slug: "posts", fields: { title: text({ required: false }) } });

const testConfig = defineConfig({ collections: [collection] });

const twoRows: TDocument[] = [
  { _id: "1", title: "First" } as unknown as TDocument,
  { _id: "2", title: "Second" } as unknown as TDocument,
];

function renderToolbar(options: {
  rows: TDocument[];
  selectedIds: string[];
  setSelectedIds?: (ids: string[]) => void;
  where?: { field: string; op: "eq"; value: unknown };
  activeViewHiddenFilter?: { count: number; description?: string };
}) {
  const value = {
    collection,
    urlState: {
      q: "",
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view: undefined,
      setQ: vi.fn(),
      setQf: vi.fn(),
      setSort: vi.fn(),
      setFilter: vi.fn(),
      setSize: vi.fn(),
      setView: vi.fn(),
      applyView: vi.fn(),
    },
    selection: {
      selectedIds: options.selectedIds,
      selectedDocs: options.rows.filter((row) => options.selectedIds.includes(row._id as string)),
      setSelectedIds: options.setSelectedIds ?? vi.fn(),
      canDelete: false,
    },
    density: "comfortable" as const,
    onDensityChange: vi.fn(),
    columns: [{ field: "title" }],
    onColumnsChange: vi.fn(),
    onColumnsStateChange: vi.fn(),
    peekWidth: 384,
    peekWidthTouched: false,
    onPeekWidthChange: vi.fn(),
    columnMenuEntries: [{ field: "title", label: "Title", hideable: true }],
    hasActiveView: false,
    isSearchFetching: false,
    onInspect: vi.fn(),
    viewPrefetch: {
      onTabPointerEnter: vi.fn(),
      onTabPointerLeave: vi.fn(),
      onTabFocus: vi.fn(),
      pendingViewId: undefined,
    },
    filterValueTitles: {},
    setFilterValueTitle: vi.fn(),
    effectiveFilterWhere: options.where,
    activeViewHiddenFilter: options.activeViewHiddenFilter,
  };

  return render(
    createElement(VexConfigProvider, {
      config: testConfig,
      children: createElement(VexAuthProvider, {
        value: { user: { _id: "u1", roles: "admin" } },
        children: createElement(
          ListViewContextProvider as unknown as (p: { value: unknown; children: ReactNode }) => ReactNode,
          {
            value,
            children: createElement(ListViewToolbar, {
              rows: options.rows,
              chipsVisible: true,
              onChipsVisibleChange: vi.fn(),
            }),
          },
        ),
      }),
    }),
  );
}

describe("ListViewToolbar", () => {
  it("targets the list.toolbar slot, per SLOT_IDS", () => {
    // Guards the slot `ListViewToolbar`'s `SlotOutlet` call must target — a
    // typo here would silently drop vex.list.search/vex.list.columns into
    // the wrong slot. `ListViewToolbar` itself renders through `SlotOutlet` and
    // `useListViewContext()`, which need a live `VexConfigProvider`/access
    // context/`ListViewContextProvider` — the same reason this test stays
    // at this level rather than mounting the full component.
    expect(LIST_VIEW_TOOLBAR_SLOT_ID).toBe(SLOT_IDS.list.toolbar);
    expect(LIST_VIEW_TOOLBAR_SLOT_ID).toBe("list.toolbar");
  });
});

describe("ListViewToolbar composition", () => {
  // Full-mount regression coverage: the bulk/selection group used to render
  // FIRST in the toolbar row (then, in a follow-up fix, merely after the
  // Filter chips but still BEFORE `ListViewModifiedControls`/the
  // hidden-filter lock badge) — any of those shifted every pre-existing
  // control's position when a selection appeared. It must render LAST
  // among every left-row child, with no exceptions, so nothing before it
  // ever moves. The "Select all N loaded" control (which used to read
  // `ListViewLayout`'s own `rows` prop, undercounting whenever
  // `CollectionListView` forgot to forward it) has been removed entirely —
  // the `DataTable` header checkbox already selects every loaded row.
  it("renders the bulk/selection group last among every left-row child — after the Filter chips AND the hidden-filter lock badge — with nothing before it shifted", () => {
    renderToolbar({
      rows: twoRows,
      selectedIds: ["1"],
      where: { field: "title", op: "eq", value: "hello" },
      activeViewHiddenFilter: { count: 1 },
    });

    const columnsButton = screen.getByRole("button", { name: /columns/i });
    const chip = screen.getByText((_, element) => element?.getAttribute("data-slot") === "badge" && /title.*hello/i.test(element.textContent ?? ""));
    const hiddenFilterBadge = screen.getByRole("button", { name: /1 hidden filter/ });
    const selectedCount = screen.getByText("1 selected");

    // DOM order: columns -> chip -> hidden-filter badge -> bulk/selection group.
    expect(columnsButton.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(chip.compareDocumentPosition(hiddenFilterBadge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hiddenFilterBadge.compareDocumentPosition(selectedCount) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // The bulk group is the LAST child of the shared left-row flex-wrap
    // container — not nested inside the chips' own wrap span (which would
    // still have left it before the hidden-filter badge, the bug this
    // guards against).
    const leftRow = chip.closest("div.flex-1.flex-wrap");
    expect(leftRow).not.toBeNull();
    expect(leftRow!.lastElementChild).toContainElement(selectedCount);
  });

  it('does not render a "Select all" control — the DataTable header checkbox already selects every loaded row', () => {
    renderToolbar({ rows: twoRows, selectedIds: ["1"] });
    expect(screen.queryByRole("button", { name: /Select all/ })).not.toBeInTheDocument();
  });
});
