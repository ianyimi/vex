import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Checkbox } from "./checkbox";

beforeAll(() => {
  // Base UI's Checkbox dispatches a synthetic `PointerEvent` from its
  // `onKeyUp` handler so Space activates it the same way a pointer click
  // does; jsdom has no `PointerEvent` constructor at all.
  globalThis.PointerEvent ??= class PointerEvent extends MouseEvent {} as unknown as typeof PointerEvent;
});

describe("Checkbox", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<Checkbox aria-label="Publish" />);
    await expectNoA11yViolations(container);
  });

  it("toggles aria-checked with Space", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Publish" />);
    const checkbox = screen.getByRole("checkbox", { name: "Publish" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });
});
