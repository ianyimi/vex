import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModalSurfaceProvider, useModalSurface } from "./useModalSurface";

function Probe() {
  return <span data-testid="probe">{String(useModalSurface())}</span>;
}

/**
 * Fields are rendered generically by `RenderFieldInputComponents`, so a select
 * buried in a generated form has no prop channel telling it whether it sits in
 * a dialog. This context is that channel, and it is what decides whether the
 * select's popover locks page scroll.
 */
describe("useModalSurface", () => {
  it("is false outside a modal, so popovers do not lock page scroll", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("false");
  });

  it("is true inside a ModalSurfaceProvider, so popovers join the focus trap", () => {
    render(
      <ModalSurfaceProvider>
        <Probe />
      </ModalSurfaceProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("true");
  });
});
