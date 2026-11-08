import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
  it("names its focusable viewport 'Scrollable content' by default", () => {
    render(
      <ScrollArea>
        <div>Body</div>
      </ScrollArea>,
    );
    expect(screen.getByLabelText("Scrollable content")).toBeInTheDocument();
  });

  it("uses a caller-supplied aria-label on the viewport instead of the default", () => {
    render(
      <ScrollArea aria-label="Change log">
        <div>Body</div>
      </ScrollArea>,
    );
    expect(screen.getByLabelText("Change log")).toBeInTheDocument();
    expect(screen.queryByLabelText("Scrollable content")).not.toBeInTheDocument();
  });

  it("uses role=region, not Base UI's own default role=presentation, so aria-label is HTML-valid (F-101: Nu rejects aria-label on role=presentation)", () => {
    const { container } = render(
      <ScrollArea>
        <div>Body</div>
      </ScrollArea>,
    );
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveAttribute("role", "region");
  });
});
