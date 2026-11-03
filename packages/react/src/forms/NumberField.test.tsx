import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { NumberField } from "./NumberField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { NumberField },
  formComponents: {},
});

function Harness(props: { initialValue: number }) {
  const form = useAppForm({ defaultValues: { price: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="price">
        {(field) => <field.NumberField label="Price" min={0} max={100} step={0.5} />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.price}>
        {(value) => <output data-testid="value-probe">{value}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("NumberField", () => {
  it("forwards min/max/step as native attributes", () => {
    render(<Harness initialValue={10} />);
    const input = screen.getByLabelText(/Price/);
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("step", "0.5");
  });

  it("commits a typed number back to the form", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={0} />);
    const input = screen.getByLabelText(/Price/);
    await user.clear(input);
    await user.type(input, "42");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("42");
  });
});
