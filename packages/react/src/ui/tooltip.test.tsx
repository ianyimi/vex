import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

function renderTooltip() {
  return render(
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger>Help</TooltipTrigger>
        <TooltipContent>Explains the field</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
}

describe("Tooltip", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderTooltip();
    await screen.findByText("Explains the field");
    await expectNoA11yViolations(container);
  });

  it("shows on focus, not just hover (WCAG 1.4.13 requires both)", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>Explains the field</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.queryByText("Explains the field")).not.toBeInTheDocument();
    await user.tab();
    await screen.findByText("Explains the field");
  });

  it("dismisses on Escape", async () => {
    const user = userEvent.setup();
    renderTooltip();
    await screen.findByText("Explains the field");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Explains the field")).not.toBeInTheDocument());
  });
});
