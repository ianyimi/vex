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

  it("selects the whole value on focus so a prefilled 0 is replaced by typing a digit, not appended to", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={0} />);
    const input = screen.getByLabelText(/Price/);
    await user.click(input);
    await user.keyboard("7");
    expect(input).toHaveValue(7);
    expect(screen.getByTestId("value-probe")).toHaveTextContent("7");
  });
});

describe("NumberField: bigint mode", () => {
  function BigintHarness(props: { initial?: bigint }) {
    const form = useAppForm({ defaultValues: { amount: props.initial } });
    return (
      <form.AppForm>
        <form.AppField name="amount">
          {(field) => <field.NumberField label="Amount" bigint />}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.amount}>
          {(value) => <output data-testid="value-probe">{value !== undefined ? String(value) : ""}</output>}
        </form.Subscribe>
      </form.AppForm>
    );
  }

  it("renders the bigint value as plain digits", () => {
    render(<BigintHarness initial={9007199254740993n} />);
    expect(screen.getByRole("textbox")).toHaveValue("9007199254740993");
  });

  it("commits a typed integer as a bigint", async () => {
    const user = userEvent.setup();
    render(<BigintHarness />);
    await user.type(screen.getByRole("textbox"), "123");
    expect(screen.getByRole("textbox")).toHaveValue("123");
  });

  it("selects the whole value on focus so a prefilled digit is replaced by typing, not appended to", async () => {
    const user = userEvent.setup();
    render(<BigintHarness initial={0n} />);
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.keyboard("7");
    expect(input).toHaveValue("7");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("7");
  });

  it("ignores a non-digit keystroke, leaving the committed form value unchanged", async () => {
    const user = userEvent.setup();
    render(<BigintHarness initial={5n} />);
    await user.type(screen.getByRole("textbox"), "x");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("5");
  });

  it("shows a field error for non-integer text, commits nothing further, and clears the error on a valid entry", async () => {
    const user = userEvent.setup();
    render(<BigintHarness initial={5n} />);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "1.5");
    expect(await screen.findByRole("alert")).toHaveTextContent("Must be a whole number.");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("1");
    await user.clear(input);
    await user.type(input, "15");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("value-probe")).toHaveTextContent("15");
  });

  it("shows no error for an interim leading minus sign, committing nothing until a digit follows", async () => {
    const user = userEvent.setup();
    render(<BigintHarness initial={5n} />);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "-");
    expect(input).toHaveValue("-");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("value-probe")).toHaveTextContent("");
    await user.type(input, "3");
    expect(input).toHaveValue("-3");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("value-probe")).toHaveTextContent("-3");
  });

  function BigintResettableHarness() {
    const form = useAppForm({ defaultValues: { amount: 5n as bigint | undefined } });
    return (
      <form.AppForm>
        <form.AppField name="amount">
          {(field) => <field.NumberField label="Amount" bigint />}
        </form.AppField>
        <button type="button" onClick={() => form.reset({ amount: 777n })}>
          Reset
        </button>
      </form.AppForm>
    );
  }

  it("re-syncs the displayed text when the form value changes externally (reset/merge/restore), not just from its own typing", async () => {
    const user = userEvent.setup();
    render(<BigintResettableHarness />);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "999");
    expect(input).toHaveValue("999");
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(input).toHaveValue("777");
  });

  function BigintLiveMergeHarness() {
    const form = useAppForm({ defaultValues: { amount: 5n as bigint | undefined } });
    return (
      <form.AppForm>
        <form.AppField name="amount">
          {(field) => <field.NumberField label="Amount" bigint />}
        </form.AppField>
        <button type="button" onClick={() => form.setFieldValue("amount", 777n)}>
          Live merge
        </button>
      </form.AppForm>
    );
  }

  it("clears a pending whole-number error when the form value changes externally (a live merge/version switch, not a form.reset)", async () => {
    const user = userEvent.setup();
    render(<BigintLiveMergeHarness />);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "12a");
    expect(await screen.findByRole("alert")).toHaveTextContent("Must be a whole number.");
    await user.click(screen.getByRole("button", { name: "Live merge" }));
    expect(input).toHaveValue("777");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
