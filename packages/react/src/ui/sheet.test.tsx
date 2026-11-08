import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./sheet";

function renderSheet() {
  return render(
    <Sheet defaultOpen>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetTitle>Edit field</SheetTitle>
        <SheetDescription>Adjust the field's options.</SheetDescription>
      </SheetContent>
    </Sheet>,
  );
}

describe("Sheet", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderSheet();
    await screen.findByRole("dialog", { name: "Edit field" });
    await expectNoA11yViolations(container);
  });

  it("names its close button", async () => {
    renderSheet();
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Edit field</SheetTitle>
          <SheetDescription>Adjust the field's options.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await screen.findByRole("dialog", { name: "Edit field" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
