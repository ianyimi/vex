import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defineCollection, text, type CollectionConfig } from "@vexcms/core";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { ListViewCreateAction } from "./ListViewCreateAction";
import { ListViewContextProvider } from "../ListViewContext";
import { renderWithVexProviders } from "../../../testing/harness/accessFixtures";
const collection = defineCollection({
  slug: "posts",
  fields: { title: text({ required: false }) },
});

const disableCreateCollection = defineCollection({
  slug: "user",
  fields: { name: text({ required: false }) },
  // Mirrors `@vexcms/better-auth`'s adapter setting this on the auth user
  // collection (decision D2) — users arrive via sign-up, never an
  // admin-authored create form.
  disableCreate: true,
});

function listContextValue(resolvedCollection: CollectionConfig) {
  return {
    collection: resolvedCollection,
    urlState: { q: "", qf: undefined, setQ: () => {}, setQf: () => {} } as never,
    selection: { selectedIds: [], selectedDocs: [], setSelectedIds: () => {}, canDelete: false },
    density: "comfortable" as const,
    onDensityChange: () => {},
    columns: [],
    onColumnsChange: () => {},
    onColumnsStateChange: () => {},
    peekWidth: 384,
    peekWidthTouched: false,
    onPeekWidthChange: () => {},
    columnMenuEntries: [],
    hasActiveView: false,
    isSearchFetching: false,
    viewPrefetch: {
      onTabPointerEnter: () => {},
      onTabPointerLeave: () => {},
      onTabFocus: () => {},
      pendingViewId: undefined,
    },
    filterValueTitles: {},
    setFilterValueTitle: () => {},
  };
}

describe("ListViewCreateAction", () => {
  it("renders the + New button for an ordinary collection", () => {
    renderWithVexProviders(
      <NuqsTestingAdapter>
        <ListViewContextProvider value={listContextValue(collection) as never}>
          <ListViewCreateAction />
        </ListViewContextProvider>
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("button", { name: /\+ New/ })).toBeInTheDocument();
  });

  it("renders nothing when the collection sets disableCreate (decision D2)", () => {
    const { container } = renderWithVexProviders(
      <ListViewContextProvider value={listContextValue(disableCreateCollection) as never}>
        <ListViewCreateAction />
      </ListViewContextProvider>,
    );
    expect(screen.queryByRole("button", { name: /\+ New/ })).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
