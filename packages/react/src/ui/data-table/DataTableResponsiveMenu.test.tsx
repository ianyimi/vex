import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTableResponsiveMenu } from "./DataTableResponsiveMenu";

const { isMobileMock } = vi.hoisted(() => ({ isMobileMock: vi.fn(() => false) }));

vi.mock("../../hooks/use-mobile", () => ({ useIsMobile: isMobileMock }));

afterEach(() => {
  cleanup();
  isMobileMock.mockReturnValue(false);
});

describe("DataTableResponsiveMenu", () => {
  it("renders the body in a Popover at useIsMobile() === false", async () => {
    const user = userEvent.setup();
    render(
      <DataTableResponsiveMenu trigger={<button>Columns</button>} title="Columns">
        <div>Menu body</div>
      </DataTableResponsiveMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Columns" }));

    expect(await screen.findByText("Menu body")).toBeInTheDocument();
    expect(screen.queryByText("Columns", { selector: '[data-slot="sheet-title"]' })).not.toBeInTheDocument();
  });

  it("renders the body in a bottom Sheet with the title at useIsMobile() === true", async () => {
    isMobileMock.mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <DataTableResponsiveMenu trigger={<button>Columns</button>} title="Columns">
        <div>Menu body</div>
      </DataTableResponsiveMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Columns" }));

    expect(await screen.findByText("Menu body")).toBeInTheDocument();
    expect(screen.getByText("Columns", { selector: '[data-slot="sheet-title"]' })).toBeInTheDocument();
  });

  it("supports a controlled open/onOpenChange pair (ListViewFilterBuilder's auto-seed-on-open case)", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTableResponsiveMenu
        trigger={<button>Filter</button>}
        title="Filter"
        open={false}
        onOpenChange={onOpenChange}
      >
        <div>Filter body</div>
      </DataTableResponsiveMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Filter" }));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.queryByText("Filter body")).not.toBeInTheDocument();
  });
});
