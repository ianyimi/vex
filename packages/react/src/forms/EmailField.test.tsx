import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { EmailField } from "./EmailField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { EmailField },
  formComponents: {},
});

function Harness(props: { initialValue: string }) {
  const form = useAppForm({ defaultValues: { email: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="email">
        {(field) => <field.EmailField label="Email" />}
      </form.AppField>
    </form.AppForm>
  );
}

describe("EmailField", () => {
  it("renders a native type=email control with autoComplete=email", () => {
    render(<Harness initialValue="a@b.com" />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autoComplete", "email");
    expect(input).toHaveValue("a@b.com");
  });
});
