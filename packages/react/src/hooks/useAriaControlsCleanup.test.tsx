import { render, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { useAriaControlsCleanup } from "./useAriaControlsCleanup";

function Harness(props: { controlsId?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useAriaControlsCleanup(ref);
  return (
    <button ref={ref} type="button" aria-controls={props.controlsId}>
      Trigger
    </button>
  );
}

describe("useAriaControlsCleanup", () => {
  it("leaves aria-controls alone when it points at a real element", () => {
    const { getByRole } = render(
      <>
        <Harness controlsId="real-panel" />
        <div id="real-panel">Panel</div>
      </>,
    );
    expect(getByRole("button")).toHaveAttribute("aria-controls", "real-panel");
  });

  it("strips aria-controls when it points at an id with no matching element", () => {
    const { getByRole } = render(<Harness controlsId="missing-panel" />);
    expect(getByRole("button")).not.toHaveAttribute("aria-controls");
  });

  it("strips aria-controls once a re-render rewrites it to a now-missing id (the Base UI collapse case)", async () => {
    const { getByRole, rerender } = render(
      <>
        <Harness controlsId="panel-a" />
        <div id="panel-a">Panel</div>
      </>,
    );
    const trigger = getByRole("button");
    expect(trigger).toHaveAttribute("aria-controls", "panel-a");

    rerender(<Harness controlsId="panel-b" />);
    await waitFor(() => expect(trigger).not.toHaveAttribute("aria-controls"));
  });

  it("does nothing when aria-controls is absent", () => {
    const { getByRole } = render(<Harness />);
    expect(getByRole("button")).not.toHaveAttribute("aria-controls");
  });
});
