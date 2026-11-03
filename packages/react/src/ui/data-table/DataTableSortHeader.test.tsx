import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTableSortHeader } from "./DataTableSortHeader";

describe("DataTableSortHeader", () => {
  it("renders plain text with no button when enableSorting is false", () => {
    render(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={undefined}
        onSortChange={vi.fn()}
        enableSorting={false}
      />,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders plain text with a relevance tooltip when disabled (parked sort)", () => {
    render(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={undefined}
        onSortChange={vi.fn()}
        enableSorting
        disabled
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Title")).toHaveAttribute("title", "Sorted by relevance");
  });

  it("cycles unsorted -> asc -> desc -> undefined across clicks", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={undefined}
        onSortChange={onSortChange}
        enableSorting
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith({ field: "title", order: "asc" });

    rerender(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={{ field: "title", order: "asc" }}
        onSortChange={onSortChange}
        enableSorting
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith({ field: "title", order: "desc" });

    rerender(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={{ field: "title", order: "desc" }}
        onSortChange={onSortChange}
        enableSorting
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith(undefined);
  });

  it("clicking a different field's header starts that field at asc, ignoring the current sort", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTableSortHeader
        label="Body"
        field="body"
        sort={{ field: "title", order: "desc" }}
        onSortChange={onSortChange}
        enableSorting
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenCalledWith({ field: "body", order: "asc" });
  });
});
