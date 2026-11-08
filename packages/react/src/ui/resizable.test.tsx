import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

// `react-resizable-panels` computes `aria-valuenow`/`aria-valuemin`/
// `aria-valuemax` from its own measured pixel layout (`calculateAriaValues`),
// which only ever resolves once a real ResizeObserver delivers a real
// content rect — jsdom has no layout engine, so even with the shared
// `ResizeObserverStub` installed (a deliberate no-op; see
// `testing/setup.ts`), that delivery never happens and the three attributes
// are never set. Same category of jsdom-only gap as `color-contrast`/
// `target-size` in `testing/a11y.ts`'s own `DISABLED_RULES` — not a defect
// in this file. Disabled for this one assertion only.
const RESIZE_VALUE_JSDOM_LAYOUT_RULES = { "aria-required-attr": { enabled: false } };

function renderResizable() {
  return render(
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50}>Left</ResizablePanel>
      <ResizableHandle aria-label="Resize panels" />
      <ResizablePanel defaultSize={50}>Right</ResizablePanel>
    </ResizablePanelGroup>,
  );
}

describe("ResizableHandle", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderResizable();
    await expectNoA11yViolations(container, { rules: RESIZE_VALUE_JSDOM_LAYOUT_RULES });
  });

  it("exposes role=separator with a name and keyboard focusability", () => {
    renderResizable();
    const handle = screen.getByRole("separator", { name: "Resize panels" });
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAttribute("data-panel-group-direction", "horizontal");
  });

  it("falls back to a default name when no aria-label is passed", () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole("separator", { name: "Resize panels" })).toBeInTheDocument();
  });
});
