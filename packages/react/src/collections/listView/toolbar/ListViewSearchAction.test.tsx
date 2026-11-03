import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListViewSearchAction } from "./ListViewSearchAction";
import { ListViewContextProvider } from "../ListViewContext";
import { defineCollection, text } from "@vexcms/core";
const collection = defineCollection({
  slug: "posts",
  fields: { title: text({ required: false, searchIndex: { name: "search_title", filterFields: [] } }) },
  admin: { view: { searchFields: ["title"] } },
}) as never;


describe("ListViewSearchAction", () => {
  it("renders ListViewSearch wired to the list context's collection and urlState", () => {
    render(
      <ListViewContextProvider
        value={{
          collection,
          urlState: { q: "hello", qf: undefined, setQ: () => {}, setQf: () => {} } as never,
          selection: { selectedIds: [], selectedDocs: [], setSelectedIds: () => {}, canDelete: false },
          density: "comfortable",
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
          viewPrefetch: { onTabPointerEnter: () => {}, onTabPointerLeave: () => {}, onTabFocus: () => {}, pendingViewId: undefined },
          filterValueTitles: {},
          setFilterValueTitle: () => {},
        }}
      >
        <ListViewSearchAction />
      </ListViewContextProvider>,
    );
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("forwards isSearchFetching to ListViewSearch's pending spinner", () => {
    const { container } = render(
      <ListViewContextProvider
        value={{
          collection,
          urlState: { q: "hello", qf: undefined, setQ: () => {}, setQf: () => {} } as never,
          selection: { selectedIds: [], selectedDocs: [], setSelectedIds: () => {}, canDelete: false },
          density: "comfortable",
          onDensityChange: () => {},
          columns: [],
          onColumnsChange: () => {},
          onColumnsStateChange: () => {},
          peekWidth: 384,
          peekWidthTouched: false,
          onPeekWidthChange: () => {},
          columnMenuEntries: [],
          hasActiveView: false,
          isSearchFetching: true,
          viewPrefetch: { onTabPointerEnter: () => {}, onTabPointerLeave: () => {}, onTabFocus: () => {}, pendingViewId: undefined },
          filterValueTitles: {},
          setFilterValueTitle: () => {},
        }}
      >
        <ListViewSearchAction />
      </ListViewContextProvider>,
    );
    // Rows stay rendered (this component only owns the input), and the
    // input's own spinner (`ui/input.tsx`'s `Input` `isPending` prop) is
    // visible — not the `invisible` class it carries when not fetching.
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
    expect(spinner).not.toHaveClass("invisible");
  });
});
