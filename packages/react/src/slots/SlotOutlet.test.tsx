import { screen } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it, vi } from "vitest";
import { SlotOutlet } from "./SlotOutlet";
import { renderWithVexProviders } from "../testing/harness/accessFixtures";
import { AppForm } from "../forms";

function Probe(props: { label: string }) {
  return <span>{props.label}</span>;
}

function renderOutletInForm(
  ui: React.ReactElement,
  defaultValues: Record<string, unknown>,
) {
  function Wrapper() {
    const form = useForm({ defaultValues });
    return <AppForm form={form}>{ui}</AppForm>;
  }
  return renderWithVexProviders(<Wrapper />);
}

describe("SlotOutlet", () => {
  it("renders built-ins and project contributions together, ordered", () => {
    renderWithVexProviders(
      <SlotOutlet
        slotId="field.beforeInput"
        builtins={[{ id: "vex.builtin", component: Probe, order: 1 }]}
        contributions={[{ id: "acme.custom", component: Probe, order: 0 }]}
        contributedProps={{ label: "x" }}
      />,
    );
    const spans = screen.getAllByText("x");
    expect(spans).toHaveLength(2);
  });

  it("does not render a contribution whose access predicate returns false", () => {
    renderWithVexProviders(
      <SlotOutlet
        slotId="field.beforeInput"
        builtins={[]}
        contributions={[
          { id: "acme.gated", component: Probe, access: () => false },
        ]}
        contributedProps={{ label: "hidden" }}
      />,
    );
    expect(screen.queryByText("hidden")).not.toBeInTheDocument();
  });

  it("renders an error boundary around a throwing contribution without affecting siblings", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Throws(): never {
      throw new Error("boom");
    }
    renderWithVexProviders(
      <SlotOutlet
        slotId="field.beforeInput"
        builtins={[]}
        contributions={[
          { id: "acme.broken", component: Throws },
          { id: "acme.ok", component: Probe },
        ]}
        contributedProps={{ label: "sibling" }}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("acme.broken");
    expect(screen.getByText("sibling")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("gates a contribution's condition against real form data, hiding it when false", () => {
    renderOutletInForm(
      <SlotOutlet
        slotId="field.beforeInput"
        builtins={[]}
        contributions={[
          {
            id: "acme.gated",
            component: Probe,
            condition: ({ data }) =>
              typeof data === "object" && data !== null && "enabled" in data && data.enabled === true,
          },
        ]}
        contributedProps={{ label: "conditional" }}
        conditionName="secret"
      />,
      { enabled: false, secret: "" },
    );
    expect(screen.queryByText("conditional")).not.toBeInTheDocument();
  });

  it("renders a condition-gated contribution once its predicate becomes true", () => {
    renderOutletInForm(
      <SlotOutlet
        slotId="field.beforeInput"
        builtins={[]}
        contributions={[
          {
            id: "acme.gated",
            component: Probe,
            condition: ({ data }) =>
              typeof data === "object" && data !== null && "enabled" in data && data.enabled === true,
          },
        ]}
        contributedProps={{ label: "conditional" }}
        conditionName="secret"
      />,
      { enabled: true, secret: "" },
    );
    expect(screen.getByText("conditional")).toBeInTheDocument();
  });

  it("always mounts a condition-bearing contribution when rendered with no enclosing form (no conditionData)", () => {
    renderWithVexProviders(
      <SlotOutlet
        slotId="field.beforeInput"
        builtins={[]}
        contributions={[
          { id: "acme.gated", component: Probe, condition: () => false },
        ]}
        contributedProps={{ label: "no-form" }}
        conditionName="secret"
      />,
    );
    expect(screen.getByText("no-form")).toBeInTheDocument();
  });
});
