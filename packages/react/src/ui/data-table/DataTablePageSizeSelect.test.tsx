import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTablePageSizeSelect } from "./DataTablePageSizeSelect";

describe("DataTablePageSizeSelect", () => {
  it("renders nothing with one or fewer options", () => {
    const { container } = render(
      <DataTablePageSizeSelect pageSize={10} pageSizeOptions={[10]} onPageSizeChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page size", () => {
    render(
      <DataTablePageSizeSelect
        pageSize={25}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("25 per load")).toBeInTheDocument();
  });

  it("is labelled Rows per load, including the current value", () => {
    render(
      <DataTablePageSizeSelect
        pageSize={25}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Rows per load: 25 per load" })).toBeInTheDocument();
  });

  it("calls onPageSizeChange with the selected numeric value", async () => {
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTablePageSizeSelect
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={onPageSizeChange}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    // `findByRole`: the listbox opens one tick after the trigger click — under
    // full-suite load it is still `hidden` when a sync query runs. Same race as
    // `ListViewSearch.test.tsx`.
    await user.click(await screen.findByRole("option", { name: "50 per load" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
