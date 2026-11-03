import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { TextareaField } from "./TextareaField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextareaField },
  formComponents: {},
});

function Harness(props: { initialValue: string; maxLength?: number }) {
  const form = useAppForm({ defaultValues: { bio: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="bio">
        {(field) => <field.TextareaField label="Bio" rows={3} maxLength={props.maxLength} />}
      </form.AppField>
    </form.AppForm>
  );
}

describe("TextareaField", () => {
  it("renders the counter unconditionally, with /max when maxLength is set", () => {
    render(<Harness initialValue="hi" maxLength={20} />);
    expect(screen.getByText("2/20")).toBeInTheDocument();
  });

  it("renders the bare character count with no maxLength", () => {
    render(<Harness initialValue="hi" />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("commits typed input to the form", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="" />);
    await user.type(screen.getByLabelText(/Bio/), "ab");
    expect(screen.getByText("2")).toBeInTheDocument();
  });


  it("renders the error and the counter in the same footer row, counter right-aligned", async () => {
    const user = userEvent.setup();
    const { useAppForm: useErrorForm } = createFormHook({
      fieldContext,
      formContext,
      fieldComponents: { TextareaField },
      formComponents: {},
    });
    function ErrorHarness() {
      const form = useErrorForm({ defaultValues: { bio: "" } });
      return (
        <form.AppForm>
          <form.AppField name="bio" validators={{ onChange: () => "Required" }}>
            {(field) => <field.TextareaField label="Bio" rows={3} maxLength={20} />}
          </form.AppField>
        </form.AppForm>
      );
    }
    render(<ErrorHarness />);
    await user.type(screen.getByLabelText(/Bio/), "x");
    await user.tab();
    const error = screen.getByRole("alert");
    const counter = screen.getByText("1/20");
    const footer = error.parentElement!;
    expect(footer).toContainElement(counter);
    expect(footer).toHaveAttribute("data-slot", "field-footer");
  });
});
