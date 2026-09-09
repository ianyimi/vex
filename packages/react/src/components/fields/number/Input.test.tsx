import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { numberFieldToInputSchema, type CollectionConfig, type NumberField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { numberFieldFixture } from "./testFixture";
import { NumberFieldInput } from "./Input";

/**
 * Mounts `NumberFieldInput` behind a real `useForm` + `<AppForm>`, exposing the
 * form's coerced value through a probe element so the raw DOM string can be
 * told apart from the number `NumberFieldInput` actually stores — without
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
      <NumberFieldInput
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
 * Mounts `NumberFieldInput` with the field's REAL `numberFieldToInputSchema`
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
          <NumberFieldInput
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
  Component: NumberFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("number: numeric coercion, decimal/negative handling, and the ?? 0 empty fallback", () => {
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

      it("does not forward fieldDef.min/max as native HTML attributes and does not clamp typed values — range enforcement is the schema's job, not the input's", async () => {
        const user = userEvent.setup();
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        expect(input).not.toHaveAttribute("min");
        expect(input).not.toHaveAttribute("max");
        await user.clear(input);
        await user.type(input, "999");
        expect(input).toHaveValue(999);
        expect(screen.getByTestId("value-probe").textContent).toBe("999");
      });

      it("renders 0, not blank, when the field's value is undefined — the field.state.value ?? 0 fallback", () => {
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        expect(input).toHaveValue(0);
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

      // Ambiguous intent: neither NumberField's JSDoc nor NumberFieldInput's
      // own JSDoc says what a cleared number field should hold. A user
      // clearing a required numeric field would reasonably expect the value
      // to become empty/undefined so "required" validation can catch it — not
      // silently become a valid 0. `NumberFieldInput` computes
      // `Number(e.target.value)`, and `Number("") === 0`, so it does the
      // latter. This assertion targets the behavior a user would reasonably
      // expect and is EXPECTED TO FAIL against the current implementation —
      // a failing assertion here is the deliverable.
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

      // CORE-1 (fixed in Step 1): `numberFieldToInputSchema` no longer
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
