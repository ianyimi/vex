import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListViewColumnsAction } from "./ListViewColumnsAction";
import { ListViewContextProvider } from "../ListViewContext";
import { defineCollection, text } from "@vexcms/core";

const collection = defineCollection({ slug: "posts", fields: { title: text() } }) as never;

describe("ListViewColumnsAction", () => {
  it("renders DataTableColumnsMenu wired to the list context's columnMenuEntries/density — no collapsed prop", () => {
    render(
      <ListViewContextProvider
        value={{
          collection,
          urlState: { q: "", qf: undefined, setQ: () => {}, setQf: () => {} } as never,
          selection: { selectedIds: [], selectedDocs: [], setSelectedIds: () => {}, canDelete: false },
          density: "comfortable",
          onDensityChange: () => {},
          columns: ["status"],
          onColumnsChange: () => {},
          onColumnsStateChange: () => {},
          peekWidth: 384,
          peekWidthTouched: false,
          onPeekWidthChange: () => {},
          columnMenuEntries: [{ field: "status", label: "Status", hideable: true }],
          hasActiveView: false,
          isSearchFetching: false,
          viewPrefetch: { onTabPointerEnter: () => {}, onTabPointerLeave: () => {}, onTabFocus: () => {}, pendingViewId: undefined },
          filterValueTitles: {},
          setFilterValueTitle: () => {},
        }}
      >
        <ListViewColumnsAction />
      </ListViewContextProvider>,
    );
    expect(screen.getByRole("button", { name: /columns/i })).toBeInTheDocument();
  });
});
