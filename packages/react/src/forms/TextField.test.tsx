import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { TextField } from "./TextField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: {},
});

function Harness(props: { initialValue: string; maxLength?: number }) {
  const form = useAppForm({ defaultValues: { title: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="title">
        {(field) => <field.TextField label="Title" required maxLength={props.maxLength} />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.title}>
        {(value) => <output data-testid="value-probe">{value}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("TextField", () => {
  it("binds the control to the field's current value", () => {
    render(<Harness initialValue="hello" />);
    expect(screen.getByLabelText(/Title/)).toHaveValue("hello");
  });

  it("commits typed input back to the form", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="" />);
    await user.type(screen.getByLabelText(/Title/), "abc");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("abc");
  });

  it("shows a length/maxLength counter when maxLength is set", () => {
    render(<Harness initialValue="hi" maxLength={10} />);
    expect(screen.getByText("2/10")).toBeInTheDocument();
  });

  it("renders no counter when maxLength is omitted", () => {
    render(<Harness initialValue="hi" />);
    expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
  });
});
