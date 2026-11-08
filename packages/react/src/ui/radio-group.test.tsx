import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { RadioGroup, RadioGroupItem } from "./radio-group";

function renderGroup() {
  return render(
    <RadioGroup aria-label="Visibility" defaultValue="public">
      <RadioGroupItem value="public" aria-label="Public" />
      <RadioGroupItem value="private" aria-label="Private" />
    </RadioGroup>,
  );
}

describe("RadioGroup", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderGroup();
    await expectNoA11yViolations(container);
  });

  it("moves selection with ArrowDown and wraps", async () => {
    const user = userEvent.setup();
    renderGroup();
    const pub = screen.getByRole("radio", { name: "Public" });
    const priv = screen.getByRole("radio", { name: "Private" });
    pub.focus();
    await user.keyboard("{ArrowDown}");
    expect(priv).toHaveFocus();
    expect(priv).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowDown}");
    expect(pub).toHaveFocus();
  });
});
