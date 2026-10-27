import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { ColorField } from "./ColorField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ColorField },
  formComponents: {},
});

function Harness(props: { initialValue: string }) {
  const form = useAppForm({ defaultValues: { accent: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="accent">
        {(field) => <field.ColorField label="Accent" format="hex" />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.accent}>
        {(value) => <output data-testid="value-probe">{value}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("ColorField", () => {
  it("renders the stored value in the text input", () => {
    render(<Harness initialValue="#e8622a" />);
    expect(screen.getByDisplayValue("#e8622a")).toBeInTheDocument();
  });

  it("commits a typed value back to the form", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="" />);
    await user.type(screen.getByPlaceholderText("#E8622A"), "#000000");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("#000000");
  });

  it("falls back to the format placeholder when none is given", () => {
    render(<Harness initialValue="" />);
    expect(screen.getByPlaceholderText("#E8622A")).toBeInTheDocument();
  });
});
