import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "./popover";

// See select.test.tsx for why this is disabled: jsdom's `navigator.vendor`
// ("Apple Computer, Inc.") trips Base UI's `isSafari` detection, which is the
// only condition under which its internal FocusGuard span gets a `role` with
// no accessible name — a jsdom artifact, not a reachable real-browser state
// this primitive's own markup controls.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } };

function renderPopover() {
  return render(
    <Popover defaultOpen>
      <PopoverTrigger>More info</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Field help</PopoverTitle>
        <p>This field accepts a slug.</p>
      </PopoverContent>
    </Popover>,
  );
}

describe("Popover", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderPopover();
    await screen.findByText("Field help");
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES });
  });

  it("exposes aria-expanded on the trigger", async () => {
    renderPopover();
    const trigger = screen.getByRole("button", { name: "More info" });
    await screen.findByText("Field help");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderPopover();
    const trigger = screen.getByRole("button", { name: "More info" });
    await screen.findByText("Field help");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Field help")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
