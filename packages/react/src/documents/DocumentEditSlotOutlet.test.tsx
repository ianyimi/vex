import { fireEvent, screen } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentOverrideInput } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { DocumentEditSlotOutlet } from "./DocumentEditSlotOutlet";
import { renderWithVexProviders } from "../testing/harness/accessFixtures";

interface Probe {
  kind: "collection" | "global";
  slug: string;
}

function makeContribution(id: string, text: string) {
  return {
    id,
    component: () => <span>{text}</span>,
  };
}

describe("DocumentEditSlotOutlet", () => {
  it("renders root then resource-level contributions, ordered by before/after", () => {
    renderWithVexProviders(
      <DocumentEditSlotOutlet<Probe>
        slotId="edit.header.actions"
        root={{ contributions: [makeContribution("acme.root", "root")] }}
        resource={{
          contributions: [
            { ...makeContribution("acme.resource", "resource"), before: "acme.root" },
          ],
        }}
        builtins={[]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    const spans = screen.getAllByText(/root|resource/);
    expect(spans.map((el) => el.textContent)).toEqual(["resource", "root"]);
  });

  it("hides a built-in via a hide directive and reorders another with order", () => {
    renderWithVexProviders(
      <DocumentEditSlotOutlet<Probe>
        slotId="edit.header.actions"
        root={undefined}
        resource={{
          contributions: [
            { id: "vex.save", hidden: true },
            { ...makeContribution("acme.first", "first"), order: -1 },
          ],
        }}
        builtins={[makeContribution("vex.save", "Save")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    expect(screen.getByText("first")).toBeInTheDocument();
  });

  it("wraps a built-in by id, the wrapper receiving renderDefault", () => {
    renderWithVexProviders(
      <DocumentEditSlotOutlet<Probe>
        slotId="edit.header.actions"
        root={{
          overrides: {
            "vex.save": [
              {
                id: "acme.saveWrap",
                component: (p: Probe & { renderDefault: (p: Probe) => React.ReactNode }) => (
                  <div data-testid="wrap">
                    wrapped
                    <p.renderDefault {...p} />
                  </div>
                ),
              } as ComponentOverrideInput<ReactHKT, Probe>,
            ],
          },
        }}
        resource={undefined}
        builtins={[makeContribution("vex.save", "Save")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    expect(screen.getByTestId("wrap")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("falls back to the stage beneath a throwing wrapper on vex.save, with an inline error naming it", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithVexProviders(
      <DocumentEditSlotOutlet<Probe>
        slotId="edit.header.actions"
        root={{
          overrides: {
            "vex.save": [
              {
                id: "acme.saveThrows",
                component: (): never => {
                  throw new Error("boom");
                },
              } as ComponentOverrideInput<ReactHKT, Probe>,
            ],
          },
        }}
        resource={undefined}
        builtins={[makeContribution("vex.save", "Save")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("acme.saveThrows");
    expect(alert).toHaveTextContent("boom");
    spy.mockRestore();
  });

  it("keeps a contribution's local state when the parent re-renders with fresh config objects", () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount((c) => c + 1)}>{`clicks ${count}`}</button>;
    }
    function WrapCounter(p: { renderDefault: (props: Probe) => ReactNode } & Probe) {
      const RenderDefault = p.renderDefault;
      return <RenderDefault kind={p.kind} slug={p.slug} />;
    }
    function Parent() {
      const [, setTick] = useState(0);
      return (
        <>
          <button onClick={() => setTick((t) => t + 1)}>rerender</button>
          <DocumentEditSlotOutlet<Probe>
            slotId="edit.header.actions"
            root={{
              overrides: {
                "vex.save": [
                  { id: "acme.wrap", component: WrapCounter } as ComponentOverrideInput<
                    ReactHKT,
                    Probe
                  >,
                ],
              },
            }}
            resource={undefined}
            builtins={[{ id: "vex.save", component: Counter }]}
            contributedProps={{ kind: "collection", slug: "posts" }}
          />
        </>
      );
    }
    renderWithVexProviders(<Parent />);
    fireEvent.click(screen.getByText("clicks 0"));
    fireEvent.click(screen.getByText("rerender"));
    expect(screen.getByText("clicks 1")).toBeInTheDocument();
  });
});
