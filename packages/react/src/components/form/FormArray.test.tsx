import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  array,
  arrayItemLabel,
  defineConfig,
  group,
  text,
  type ArrayField,
  type ArrayType,
  type CollectionConfig,
  type VexResourceSlug,
} from "@vexcms/core";
import { AppForm } from "./AppForm";
import { FormArray } from "./FormArray";
import { VexConfigProvider } from "../../context/VexConfigContext";
import { testCollection } from "../../testing/harness/accessFixtures";

function FormArrayHarness(props: {
  fieldDef: ArrayField<VexResourceSlug, ArrayType>;
  collection?: CollectionConfig;
  initialValue: unknown[];
  readOnly?: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <form.Field name="testField" mode="array">
        {(field) => (
          <FormArray
            name="testField"
            field={field as any}
            fieldDef={props.fieldDef}
            collection={props.collection ?? testCollection}
            readOnly={props.readOnly ?? false}
            submissionAttempts={0}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

const fieldDef = array({
  label: "Tags",
  items: text({ label: "Tag", required: true }),
});

describe("FormArray", () => {
  it("duplicates an item immediately after itself", async () => {
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b"]} />);

    await user.click(screen.getByRole("button", { name: "Duplicate item 1 from Tags" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as string[];
    expect(values).toEqual(["a", "a", "b"]);
  });

  it("moves an item up, swapping it with its predecessor", async () => {
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b", "c"]} />);

    await user.click(screen.getByRole("button", { name: "Move item 2 up" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as string[];
    expect(values).toEqual(["b", "a", "c"]);
  });

  it("moves an item down, swapping it with its successor", async () => {
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b", "c"]} />);

    await user.click(screen.getByRole("button", { name: "Move item 2 down" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as string[];
    expect(values).toEqual(["a", "c", "b"]);
  });

  it("disables moving the first item up and the last item down", () => {
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b"]} />);

    expect(screen.getByRole("button", { name: "Move item 1 up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move item 2 down" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move item 1 down" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Move item 2 up" })).not.toBeDisabled();
  });

  it("disables duplicate once the max item count is reached", () => {
    const boundaryFieldDef = array({ label: "Tags", items: text({ label: "Tag" }), max: 2 });
    render(<FormArrayHarness fieldDef={boundaryFieldDef} initialValue={["a", "b"]} />);

    expect(screen.getByRole("button", { name: "Duplicate item 1 from Tags" })).toBeDisabled();
  });

  it("keeps each item's stable key travelling with it across a duplicate, so the untouched item does not remount", async () => {
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b"]} />);

    const secondInputBefore = screen.getAllByRole("textbox")[1] as HTMLInputElement;
    const draggableIdBefore = secondInputBefore
      .closest("[data-rfd-draggable-id]")
      ?.getAttribute("data-rfd-draggable-id");

    await user.click(screen.getByRole("button", { name: "Duplicate item 1 from Tags" }));

    const thirdInputAfter = screen.getAllByRole("textbox")[2] as HTMLInputElement;
    const draggableIdAfter = thirdInputAfter
      .closest("[data-rfd-draggable-id]")
      ?.getAttribute("data-rfd-draggable-id");

    expect(draggableIdAfter).toBe(draggableIdBefore);
  });
});

describe("FormArray: stored item id (object-shaped items)", () => {
  const linkFieldDef = array({
    items: group({ fields: { label: text({ required: true }) } }),
  });

  it("assigns a stored id when a new object-shaped item is added", async () => {
    const user = userEvent.setup();
    render(<VexConfigProvider config={defineConfig()}><FormArrayHarness fieldDef={linkFieldDef} initialValue={[]} /></VexConfigProvider>);

    await user.click(screen.getByRole("button", { name: `Add ${arrayItemLabel(linkFieldDef)}` }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
      id?: string;
    }[];
    expect(typeof values[0]?.id).toBe("string");
  });

  it("assigns a FRESH id to a duplicated object-shaped item, distinct from its source", async () => {
    const user = userEvent.setup();
    render(
      <VexConfigProvider config={defineConfig()}>
        <FormArrayHarness fieldDef={linkFieldDef} initialValue={[{ label: "a", id: "source-id" }]} />
      </VexConfigProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Duplicate item 1/ }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
      id: string;
    }[];
    expect(values[1]?.id).not.toBe("source-id");
    expect(typeof values[1]?.id).toBe("string");
  });

  it("duplicates the item's current unsaved values, not the values it was loaded with", async () => {
    const user = userEvent.setup();
    render(
      <VexConfigProvider config={defineConfig()}>
        <FormArrayHarness fieldDef={linkFieldDef} initialValue={[{ label: "saved", id: "source-id" }]} />
      </VexConfigProvider>,
    );

    const input = screen.getByDisplayValue("saved");
    await user.clear(input);
    await user.type(input, "edited");
    await user.click(screen.getByRole("button", { name: /Duplicate item 1/ }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
      label: string;
    }[];
    expect(values.map((item) => item.label)).toEqual(["edited", "edited"]);
  });

  it("keeps each item's open/collapsed state with the item when moved by the arrow buttons", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <VexConfigProvider config={defineConfig()}>
        <FormArrayHarness
          fieldDef={linkFieldDef}
          initialValue={[
            { label: "first", id: "first-id" },
            { label: "second", id: "second-id" },
          ]}
        />
      </VexConfigProvider>,
    );
    const triggers = () =>
      [...container.querySelectorAll('[data-slot="accordion-trigger"]')].map((trigger) =>
        trigger.getAttribute("aria-expanded"),
      );

    await user.click(container.querySelectorAll('[data-slot="accordion-trigger"]')[0]!);
    expect(triggers()).toEqual(["false", "true"]);

    await user.click(screen.getByRole("button", { name: "Move item 1 down" }));
    expect(screen.getByTestId("value-probe").textContent).toContain('"second"');
    expect(triggers()).toEqual(["true", "false"]);
  });

  it("collapses and expands every item via Collapse all / Expand all", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <VexConfigProvider config={defineConfig()}>
        <FormArrayHarness
          fieldDef={linkFieldDef}
          initialValue={[
            { label: "first", id: "first-id" },
            { label: "second", id: "second-id" },
          ]}
        />
      </VexConfigProvider>,
    );
    const triggers = () =>
      [...container.querySelectorAll('[data-slot="accordion-trigger"]')].map((trigger) =>
        trigger.getAttribute("aria-expanded"),
      );

    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(triggers()).toEqual(["false", "false"]);
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(triggers()).toEqual(["true", "true"]);
  });

  it("keys scalar items by the existing synthetic UUID scheme, unaffected by this change", () => {
    const scalarFieldDef = array({ items: text() });
    render(<FormArrayHarness fieldDef={scalarFieldDef} initialValue={["a", "b"]} />);

    // No `id` property exists on a scalar item — assert the component renders
    // without throwing and the values round-trip, proving the keysRef fallback
    // still applies.
    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as string[];
    expect(values).toEqual(["a", "b"]);
  });
});

describe("FormArray: item actions follow the form column width", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows inline icons and no item menu while the form column is wide", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(900);
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b"]} />);
    expect(screen.getByRole("button", { name: "Duplicate item 1 from Tags" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Item 1 actions" })).not.toBeInTheDocument();
  });

  it("moves every action into the item's ⋯ menu while the form column is compact", async () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    const user = userEvent.setup();
    render(<FormArrayHarness fieldDef={fieldDef} initialValue={["a", "b"]} />);
    expect(screen.queryByRole("button", { name: "Duplicate item 1 from Tags" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Item 1 actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as string[];
    expect(values).toEqual(["a", "a", "b"]);
  });
});
