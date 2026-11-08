import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

// See select.test.tsx for why this is disabled: jsdom's `navigator.vendor`
// trips Base UI's `isSafari` detection, the only condition under which its
// internal FocusGuard span gets a `role` with no accessible name.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } };

function renderMenu() {
  return render(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe("DropdownMenu", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderMenu();
    await screen.findByRole("menu");
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES });
  });

  it("moves roving focus with ArrowDown/ArrowUp and wraps", async () => {
    const user = userEvent.setup();
    renderMenu();
    const items = await screen.findAllByRole("menuitem");
    await user.keyboard("{ArrowDown}");
    expect(items[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(items[0]).toHaveFocus();
  });

  it("selects the focused item with Enter and closes the menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onSelect}>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await screen.findByRole("menuitem", { name: "Rename" });
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Actions" });
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
