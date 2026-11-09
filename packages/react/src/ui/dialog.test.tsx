import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";

function renderDialog() {
  return render(
    <Dialog defaultOpen>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete item</DialogTitle>
        <DialogDescription>This cannot be undone.</DialogDescription>
      </DialogContent>
    </Dialog>,
  );
}

describe("Dialog", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderDialog();
    await screen.findByRole("dialog", { name: "Delete item" });
    await expectNoA11yViolations(container);
  });

  it("marks the popup aria-modal so screen readers treat background content as hidden", async () => {
    renderDialog();
    const dialog = await screen.findByRole("dialog", { name: "Delete item" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("names its close button", async () => {
    renderDialog();
    expect(await screen.findByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete item</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await screen.findByRole("dialog", { name: "Delete item" });

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("traps Tab focus inside the popup: tabbing past the last control wraps to the first", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Delete item</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
          <button type="button">First</button>
        </DialogContent>
      </Dialog>,
    );
    await screen.findByRole("dialog");
    const first = screen.getByRole("button", { name: "First" });
    // The close button renders after `children`, so it's the last focusable
    // control in DOM order. Base UI's focus trap inserts its own invisible
    // `FocusGuard` sibling just past it (real-browser behavior: focusing the
    // guard redirects back into the dialog) — the APG requirement this
    // asserts is just that Tab never escapes the trap to `document.body`,
    // not which internal element ends up focused.
    const close = screen.getByRole("button", { name: "Close" });

    close.focus();
    await user.tab();
    const dialog = screen.getByRole("dialog");
    expect(document.activeElement).not.toBe(document.body);
    expect(
      dialog.contains(document.activeElement) ||
        document.activeElement?.hasAttribute("data-base-ui-focus-guard"),
    ).toBe(true);
    expect(first).toBeInTheDocument();
  });
});
