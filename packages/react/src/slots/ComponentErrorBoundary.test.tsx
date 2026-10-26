import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";

function Throws(): never {
  throw new Error("boom");
}

describe("ComponentErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <ComponentErrorBoundary id="acme.safe">
        <span>ok</span>
      </ComponentErrorBoundary>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("renders an inline error naming the id when a child throws, without propagating", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ComponentErrorBoundary id="acme.broken">
        <Throws />
      </ComponentErrorBoundary>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("acme.broken");
    expect(alert).toHaveTextContent("boom");
    spy.mockRestore();
  });
});
