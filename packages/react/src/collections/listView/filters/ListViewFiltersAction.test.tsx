import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListViewFiltersAction } from "./ListViewFiltersAction";
import { ListViewContextProvider } from "../ListViewContext";
import { defineCollection, text } from "@vexcms/core";

const collection = defineCollection({ slug: "posts", fields: { title: text() } }) as never;

describe("ListViewFiltersAction", () => {
  it("renders ListViewFilterBuilder wired to the list context's collection and urlState.filter", () => {
    render(
      <ListViewContextProvider
        value={{
          collection,
          urlState: { filter: undefined, setFilter: () => {} } as never,
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
        <ListViewFiltersAction />
      </ListViewContextProvider>,
    );
    expect(screen.getByRole("button", { name: /^Filter/ })).toBeInTheDocument();
  });
});
