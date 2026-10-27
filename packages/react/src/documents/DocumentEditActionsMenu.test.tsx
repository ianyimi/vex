import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentOverrideInput } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { DocumentEditActionsMenu } from "./DocumentEditActionsMenu";
import { EditActionsMenuItem } from "./EditActionsMenuItem";
import { renderWithVexProviders } from "../testing/harness/accessFixtures";

interface Probe {
  kind: "collection" | "global";
  slug: string;
}

function makeItem(id: string, text: string) {
  return {
    id,
    component: () => <EditActionsMenuItem onSelect={() => {}}>{text}</EditActionsMenuItem>,
  };
}

async function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "More actions" }));
  return screen.findByRole("menu");
}

describe("DocumentEditActionsMenu", () => {
  it("renders items in resolved order, behind a ⋯ trigger", async () => {
    renderWithVexProviders(
      <DocumentEditActionsMenu<Probe>
        root={undefined}
        resource={undefined}
        builtins={[makeItem("vex.revalidate", "Revalidate"), makeItem("vex.duplicate", "Duplicate")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    await openMenu();
    const items = screen.getAllByRole("menuitem");
    expect(items.map((el) => el.textContent)).toEqual(["Revalidate", "Duplicate"]);
  });

  it("hiding vex.duplicate via a resource-level directive removes it, Revalidate stays", async () => {
    renderWithVexProviders(
      <DocumentEditActionsMenu<Probe>
        root={undefined}
        resource={{ contributions: [{ id: "vex.duplicate", hidden: true }] }}
        builtins={[makeItem("vex.revalidate", "Revalidate"), makeItem("vex.duplicate", "Duplicate")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    await openMenu();
    expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
    expect(screen.getByText("Revalidate")).toBeInTheDocument();
  });

  it("a root contribution ordered after: 'vex.duplicate' renders after it", async () => {
    renderWithVexProviders(
      <DocumentEditActionsMenu<Probe>
        root={{
          contributions: [{ ...makeItem("acme.export", "Export"), after: "vex.duplicate" }],
        }}
        resource={undefined}
        builtins={[makeItem("vex.revalidate", "Revalidate"), makeItem("vex.duplicate", "Duplicate")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    await openMenu();
    const items = screen.getAllByRole("menuitem");
    expect(items.map((el) => el.textContent)).toEqual(["Revalidate", "Duplicate", "Export"]);
  });

  it("wraps vex.revalidate via an override, the wrapper receiving renderDefault", async () => {
    renderWithVexProviders(
      <DocumentEditActionsMenu<Probe>
        root={{
          overrides: {
            "vex.revalidate": [
              {
                id: "acme.wrapRevalidate",
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
        builtins={[makeItem("vex.revalidate", "Revalidate")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    await openMenu();
    expect(screen.getByTestId("wrap")).toBeInTheDocument();
    expect(screen.getByText("Revalidate")).toBeInTheDocument();
  });

  it("renders no ⋯ trigger when the resolved contribution list is empty", () => {
    renderWithVexProviders(
      <DocumentEditActionsMenu<Probe>
        root={undefined}
        resource={undefined}
        builtins={[]}
        contributedProps={{ kind: "global", slug: "siteSettings" }}
      />,
    );
    expect(screen.queryByRole("button", { name: "More actions" })).not.toBeInTheDocument();
  });

  it("a throwing item shows an inline error naming it, other items still render", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithVexProviders(
      <DocumentEditActionsMenu<Probe>
        root={undefined}
        resource={undefined}
        builtins={[
          makeItem("vex.revalidate", "Revalidate"),
          {
            id: "acme.throws",
            component: (): ReactNode => {
              throw new Error("boom");
            },
          },
        ]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    await openMenu();
    expect(screen.getByText("Revalidate")).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("acme.throws");
    expect(alert).toHaveTextContent("boom");
    spy.mockRestore();
  });
});
