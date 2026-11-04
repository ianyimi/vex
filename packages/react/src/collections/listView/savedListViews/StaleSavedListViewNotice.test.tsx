import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { defineCollection, text } from "@vexcms/core";
import { ListViewContextProvider, type ListViewContextState } from "../ListViewContext";
import { StaleSavedListViewNotice } from "./StaleSavedListViewNotice";

const collection = defineCollection({
  slug: "posts",
  fields: { title: text(), author: text({ label: "Author" }) },
}) as never;

function baseValue(overrides: Partial<ListViewContextState> = {}): ListViewContextState {
  return {
    collection,
    urlState: {} as never,
    selection: { selectedIds: [], selectedDocs: [], setSelectedIds: () => {}, canDelete: false },
    density: "comfortable",
    onDensityChange: () => {},
    columns: [],
    onColumnsChange: () => {},
    onColumnsStateChange: () => {},
    columnMenuEntries: [],
    hasActiveView: false,
    isSearchFetching: false,
    viewPrefetch: { onTabPointerEnter: () => {}, onTabPointerLeave: () => {}, onTabFocus: () => {}, pendingViewId: undefined },
    filterValueTitles: {},
    setFilterValueTitle: () => {},
    ...overrides,
  } as ListViewContextState;
}

function renderNotice(value: ListViewContextState) {
  return render(
    <ListViewContextProvider value={value}>
      <StaleSavedListViewNotice />
    </ListViewContextProvider>,
  );
}

describe("StaleSavedListViewNotice", () => {
  it("renders nothing when nothing is stale", () => {
    const { container } = renderNotice(baseValue());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a notice naming the stale sort field", () => {
    renderNotice(baseValue({ staleSortField: "removedField" }));
    expect(screen.getByRole("status")).toHaveTextContent(/sort on "removedField" is no longer available/);
  });

  it("shows a notice naming the stale search field", () => {
    renderNotice(baseValue({ staleSearchField: "removedField" }));
    expect(screen.getByRole("status")).toHaveTextContent(/search field "removedField" is no longer available/);
  });

  it("combines both into one notice when sort and searchField are both stale", () => {
    renderNotice(baseValue({ staleSortField: "a", staleSearchField: "b" }));
    expect(screen.getByRole("status")).toHaveTextContent(/sort on "a" and search field "b" are no longer available/);
  });

  it("shows a separate notice naming a dropped filter field by its LABEL (aligns with the filter chips)", () => {
    renderNotice(baseValue({ staleFilterField: "vex_status" }));
    expect(screen.getByRole("status")).toHaveTextContent(/filter on "Status" isn't available — showing unfiltered results instead/);
  });

  it("resolves a stale sort/search field's declared LABEL, not its raw key — the SAME resolver ListViewFilterChips' own chips use", () => {
    renderNotice(baseValue({ staleSortField: "author", staleSearchField: "author" }));
    expect(screen.getByRole("status")).toHaveTextContent(/sort on "Author" and search field "Author" are no longer available/);
  });

  it("falls back to the raw key when the field carries no declared label (same fallback `resolveFilterFieldLabel`/the chips already use)", () => {
    renderNotice(baseValue({ staleSortField: "removedField" }));
    expect(screen.getByRole("status")).toHaveTextContent(/sort on "removedField" is no longer available/);
  });

  it("combines a stale sort/search notice and a dropped-filter notice as two sentences, each with its own label", () => {
    renderNotice(baseValue({ staleSortField: "author", staleFilterField: "vex_status" }));
    const text = screen.getByRole("status").textContent ?? "";
    expect(text).toMatch(/sort on "Author" is no longer available — showing the collection's default instead\./);
    expect(text).toMatch(/filter on "Status" isn't available — showing unfiltered results instead\./);
  });

  it("dismisses on click, hiding the notice", async () => {
    const user = userEvent.setup();
    renderNotice(baseValue({ staleSortField: "removedField" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("re-shows for a DIFFERENT stale field after a prior dismissal (dismissal is keyed to the specific staleness, not permanent)", async () => {
    const user = userEvent.setup();
    const { rerender } = renderNotice(baseValue({ staleSortField: "fieldA" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(
      <ListViewContextProvider value={baseValue({ staleSortField: "fieldB" })}>
        <StaleSavedListViewNotice />
      </ListViewContextProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/sort on "fieldB"/);
  });
});
