import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListViewEmptyState } from "./ListViewEmptyState";

describe("ListViewEmptyState", () => {
  it("renders the empty-collection copy and gates Create on canCreate", () => {
    render(
      <ListViewEmptyState
        variant="empty"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        canCreate={false}
      />,
    );
    expect(screen.getByText("No testimonials yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create testimonial/i })).not.toBeInTheDocument();
  });

  it("shows Create when canCreate is true", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(
      <ListViewEmptyState
        variant="empty"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        canCreate
        onCreate={onCreate}
      />,
    );
    await user.click(screen.getByRole("button", { name: /create testimonial/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it("renders the no-search-results copy with the query and field", () => {
    render(
      <ListViewEmptyState
        variant="noSearchResults"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        searchQuery="ma"
        searchFieldLabel="Author name"
        onClearSearch={vi.fn()}
      />,
    );
    expect(screen.getByText('No testimonials with "ma" in Author name')).toBeInTheDocument();
  });

  it("offers the other search field only when one is given", () => {
    const { rerender } = render(
      <ListViewEmptyState
        variant="noSearchResults"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        searchQuery="ma"
        searchFieldLabel="Author name"
        onClearSearch={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /instead/i })).not.toBeInTheDocument();

    rerender(
      <ListViewEmptyState
        variant="noSearchResults"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        searchQuery="ma"
        searchFieldLabel="Author name"
        otherSearchFieldLabel="Company"
        onClearSearch={vi.fn()}
        onSearchOtherField={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /search in company instead/i })).toBeInTheDocument();
  });

  it("renders the no-filter-results copy with Edit/Clear filters", async () => {
    const onEditFilters = vi.fn();
    const onClearFilters = vi.fn();
    const user = userEvent.setup();
    render(
      <ListViewEmptyState
        variant="noFilterResults"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        onEditFilters={onEditFilters}
        onClearFilters={onClearFilters}
      />,
    );
    await user.click(screen.getByRole("button", { name: /edit filters/i }));
    expect(onEditFilters).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
