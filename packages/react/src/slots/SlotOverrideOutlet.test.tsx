import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentType } from "react";
import { SlotOverrideOutlet } from "./SlotOverrideOutlet";

function Default(props: { label: string }) {
  return <span data-testid="default">{props.label}</span>;
}

describe("SlotOverrideOutlet", () => {
  it("renders the default component when no overrides are given", () => {
    render(
      <SlotOverrideOutlet
        slotId="field.label"
        overrides={undefined}
        defaultComponent={Default}
        props={{ label: "x" }}
      />,
    );
    expect(screen.getByTestId("default")).toHaveTextContent("x");
  });

  it("composes a single override's renderDefault back to the default component", () => {
    function Override(props: { label: string; renderDefault: ComponentType<{ label: string }> }) {
      const RenderDefault = props.renderDefault;
      return (
        <div>
          <span data-testid="wrapper">wrapped</span>
          <RenderDefault {...props} />
        </div>
      );
    }
    render(
      <SlotOverrideOutlet
        slotId="field.label"
        overrides={[{ id: "acme.wrap", component: Override }]}
        defaultComponent={Default}
        props={{ label: "x" }}
      />,
    );
    expect(screen.getByTestId("wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("default")).toHaveTextContent("x");
  });

  it("composes two overrides in array order, each wrapping the previous", () => {
    const order: string[] = [];
    function makeOverride(name: string) {
      return function Override(props: {
        label: string;
        renderDefault: ComponentType<{ label: string }>;
      }) {
        order.push(name);
        const RenderDefault = props.renderDefault;
        return <RenderDefault {...props} />;
      };
    }
    render(
      <SlotOverrideOutlet
        slotId="field.label"
        overrides={[
          { id: "a", component: makeOverride("a") },
          { id: "b", component: makeOverride("b") },
        ]}
        defaultComponent={Default}
        props={{ label: "x" }}
      />,
    );
    expect(order).toEqual(["b", "a"]);
  });
});
