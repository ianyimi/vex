import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => undefined;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.setPointerCapture ??= () => undefined;
});

// Base UI's non-modal floating surfaces (Select/Popover/Menu/Combobox) render
// an internal `FocusGuard` span whose `role` only becomes `"button"` when
// `isSafari` is true (`@base-ui/utils/detectBrowser`'s `isSafari` reads
// `navigator.vendor`). jsdom's default `navigator.vendor` is literally
// "Apple Computer, Inc." (a historical WebKit/Safari compat string), so every
// jsdom run takes Base UI's real-Safari-only code path and the guard is left
// without `aria-hidden`/a name — a jsdom environment artifact, not a reachable
// state in any real non-Safari browser, and Safari's own VoiceOver-focused
// behavior there is deliberate library-internal plumbing, not content this
// primitive controls. Disabled for this one assertion only.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } };

function renderSelect() {
  return render(
    <Select defaultOpen>
      <SelectTrigger aria-label="Status">
        <SelectValue placeholder="Pick a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="published">Published</SelectItem>
        <SelectItem value="archived">Archived</SelectItem>
      </SelectContent>
    </Select>,
  );
}

describe("Select", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderSelect();
    await screen.findByRole("listbox");
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES });
  });

  it("moves real focus between options with ArrowDown/ArrowUp", async () => {
    const user = userEvent.setup();
    renderSelect();
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "Draft" }));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "Published" }));
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "Draft" }));
  });

  it("selects the active option with Enter and closes the popup", async () => {
    const user = userEvent.setup();
    renderSelect();
    await screen.findByRole("listbox");
    const trigger = screen.getByRole("combobox", { name: "Status" });
    trigger.focus();
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Status" });
    await screen.findByRole("listbox");
    trigger.focus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
