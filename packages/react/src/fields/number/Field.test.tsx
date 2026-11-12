import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  defineConfig,
  number,
  numberFieldToInputSchema,
  type CollectionConfig,
  type FieldControlProps,
  type NumberField,
} from "@vexcms/core";
import type { ComponentType } from "react";
import { AppForm } from "../../forms";
import { VexConfigContext } from "../../config/VexConfigContext";
import { testCollection } from "../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import { numberFieldFixture } from "./testFixture";
import { NumberFieldAdmin } from "./Field";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

/**
 * Mounts `NumberFieldAdmin` behind a real `useForm` + `<AppForm>`, exposing the
 * form's coerced value through a probe element so the raw DOM string can be
 * told apart from the number `NumberFieldAdmin` actually stores — without
 * hand-mocking TanStack's `FieldApi`.
 */
function NumberHarness(props: {
  fieldDef: NumberField;
  collection: CollectionConfig;
  initialValue: number | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <NumberFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

/**
 * Mounts `NumberFieldAdmin` with the field's REAL `numberFieldToInputSchema`
 * wired as an explicit `form.Field` `onSubmit` validator, via the documented
 * explicit-`field`-prop escape hatch (`createFieldInput` never attaches
 * validators itself), plus a submit button — so boundary values can be
 * checked against the schema's exact error messages through the real submit
 * path.
 */
function NumberBoundaryHarness(props: {
  fieldDef: NumberField;
  collection: CollectionConfig;
  initialValue: number;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = numberFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <NumberFieldAdmin
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: numberFieldFixture,
  Component: NumberFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("number: numeric coercion, decimal/negative handling, and the ?? \"\" empty fallback", () => {
      it("coerces the typed digits to a number, not a string", async () => {
        const user = userEvent.setup();
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.clear(input);
        await user.type(input, "42");
        // JSON.stringify(42) === "42"; JSON.stringify("42") === '"42"' — the quotes
        // are the only thing that can tell the two apart here.
        expect(screen.getByTestId("value-probe").textContent).toBe("42");
      });

      it("forwards fieldDef.min/max/step as native HTML attributes but still does not clamp a typed value — range enforcement stays the schema's job", async () => {
        const user = userEvent.setup();
        const fieldDef = number({
          label: "Quantity",
          min: [0, "Quantity cannot be negative."],
          max: [100, "Quantity cannot exceed 100."],
          step: 5,
        });
        render(
          <NumberHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(fieldDef.label, { exact: false });
        expect(input).toHaveAttribute("min", "0");
        expect(input).toHaveAttribute("max", "100");
        expect(input).toHaveAttribute("step", "5");
        await user.clear(input);
        await user.type(input, "999");
        expect(input).toHaveValue(999);
        expect(screen.getByTestId("value-probe").textContent).toBe("999");
      });

      it("renders blank, not 0, when the field's value is undefined — the field.state.value ?? \"\" fallback", () => {
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        expect(input).toHaveValue(null);
      });

      it("accepts and coerces a decimal value", () => {
        // A single fireEvent.change (one native "change" event carrying the
        // final string) rather than userEvent.type — typing "42.5" character
        // by character risks jsdom's <input type="number"> value-sanitization
        // algorithm discarding an intermediate value like "42." before the
        // trailing digit lands.
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        fireEvent.change(input, { target: { value: "42.5" } });
        expect(screen.getByTestId("value-probe").textContent).toBe("42.5");
      });

      it("accepts and coerces a negative value", () => {
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        fireEvent.change(input, { target: { value: "-5" } });
        expect(screen.getByTestId("value-probe").textContent).toBe("-5");
      });

      // A user clearing an optional numeric field reasonably expects the
      // value to become empty/undefined so "required" validation (or a
      // configured min/max default) can run against it on submit, not
      // silently become a valid 0 — and expects the INPUT itself to stay
      // visibly empty while typing a replacement value, not snap back to
      // "0" after every keystroke. `NumberFieldAdmin`/`NumberField` compute
      // `e.target.value === "" ? undefined : Number(e.target.value)` and
      // display `value={controlProps.value ?? ""}`, so both hold.
      it("clearing the input resets the stored value to empty, not a silently-valid 0", async () => {
        const user = userEvent.setup();
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.clear(input);
        expect(screen.getByTestId("value-probe").textContent).toBe("");
      });
    });

    describe("number: min/max boundary enforcement, exact schema error messages", () => {
      it("accepts the minimum boundary value (0) with no validation error", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={0}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Quantity cannot be negative.")).not.toBeInTheDocument();
        expect(screen.queryByText("Quantity cannot exceed 100.")).not.toBeInTheDocument();
      });

      it("rejects one below the minimum (-1) with the field's exact min error message", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={-1}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Quantity cannot be negative.")).toBeInTheDocument();
      });

      it("accepts the maximum boundary value (100) with no validation error", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={100}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Quantity cannot exceed 100.")).not.toBeInTheDocument();
      });

      it("rejects one above the maximum (101) with the field's exact max error message", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={101}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Quantity cannot exceed 100.")).toBeInTheDocument();
      });

      // CORE-1: `numberFieldToInputSchema` no longer
      // applies `.default()` when `field.required` — required fields return
      // early on the plain `z.number({ error: requiredError })` chain, so a
      // missing value is now correctly rejected instead of silently
      // defaulted and validated as `0`.
      it("the real schema rejects a missing value when required: true, with the field's own required message", () => {
        const schema = numberFieldToInputSchema({ field: options.fixture.fieldDef });
        const result = schema.safeParse(undefined);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("This field is required.");
      });
    });
  },
});

describe("number: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function NumberMaskHarness(props: { fieldDef: NumberField }) {
    const form = useForm({ defaultValues: { testField: undefined as number | undefined } });
    return (
      <AppForm form={form}>
        <NumberFieldAdmin
          name="testField"
          fieldDef={props.fieldDef}
          readOnly={false}
          collection={testCollection}
        />
      </AppForm>
    );
  }

  function renderMasked(fieldDef: NumberField) {
    return render(
      <VexConfigContext.Provider value={defineConfig()}>
        <NumberMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
  }

  it("renders type=text and lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = number({ label: "Amount", admin: { mask: "decimal" } });
    const { container } = renderMasked(fieldDef);
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("decimal", { rightAlign: false, autoUnmask: true }),
    );
    expect(container.querySelector("input")?.getAttribute("type")).toBe("text");
  });

  it("converts an empty masked input to undefined, not NaN", async () => {
    const fieldDef = number({ label: "Amount", admin: { mask: "decimal" } });
    const { container } = renderMasked(fieldDef);
    await waitFor(() => expect(withMaskMock).toHaveBeenCalled());
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "" } });
    expect(input.value).toBe("");
  });

  it("initializes Inputmask only once while typing a sequence of digits (regression: caret reset to 0)", async () => {
    const fieldDef = number({ label: "Amount", admin: { mask: "decimal" } });
    const { container } = renderMasked(fieldDef);
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledTimes(1));
    const input = container.querySelector("input") as HTMLInputElement;
    const user = userEvent.setup();
    await user.type(input, "1234");
    // `resolveFieldMask` re-resolves a fresh (but equal) mask object on
    // every one of the four re-renders this triggers; `withMask` must
    // still only be called once, or Inputmask tears down and re-inits on
    // every keystroke, resetting the caret to the front of the input.
    expect(withMaskMock).toHaveBeenCalledTimes(1);
  });

  it("renders the ordinary controlled type=number input when no mask resolves", () => {
    const fieldDef = number({ label: "Amount" });
    const { container } = renderMasked(fieldDef);
    expect(withMaskMock).not.toHaveBeenCalled();
    expect(container.querySelector("input")?.getAttribute("type")).toBe("number");
  });
});

describe("number: admin.components.Input override renders renderDefault as JSX", () => {
  function JsxWrapOverride(
    props: FieldControlProps<number> & { renderDefault: ComponentType<FieldControlProps<number>> },
  ) {
    const RenderDefault = props.renderDefault;
    return <RenderDefault {...props} />;
  }

  it("keeps the same <input> DOM node mounted — and keystroke focus on it — across re-renders of NumberFieldAdmin interleaved with typing", async () => {
    // Built once, outside the harness — mirrors a real `fieldDef`, read off a
    // stable config object and never recreated inline per render.
    const fieldDef = number({
      label: "Quantity",
      admin: { components: { Input: [{ id: "test.jsx-wrap", component: JsxWrapOverride }] } },
    });

    // `NumberFieldAdmin` is not memoized: any parent re-render (e.g. a sibling
    // subscription to the whole form re-rendering the field tree, as
    // `FieldSlotOutlet` does in production) re-invokes its function body,
    // redefining its inline `renderMaskedControl`/`renderBareControl`
    // closures — forced here via `rerender` so the regression doesn't depend
    // on reproducing that exact production trigger.
    function Harness(props: { tick: number }) {
      void props.tick;
      return (
        <NumberHarness fieldDef={fieldDef} collection={testCollection} initialValue={undefined} />
      );
    }

    const user = userEvent.setup();
    const { container, rerender } = render(<Harness tick={0} />);
    const input = container.querySelector("input") as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    for (let i = 0; i < 3; i++) {
      await user.type(input, String(i));
      rerender(<Harness tick={i + 1} />);
      // Still the exact same node — not unmounted/remounted by the re-render.
      expect(container.querySelector("input")).toBe(input);
      expect(document.activeElement).toBe(input);
    }

    // `type="number"` normalizes leading zeros away (DOM-sanitized to "1", then "12").
    expect(screen.getByTestId("value-probe").textContent).toBe("12");
  });
});
