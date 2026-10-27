import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { CheckboxField } from "./CheckboxField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { CheckboxField },
  formComponents: {},
});

function Harness(props: { initialValue: boolean }) {
  const form = useAppForm({ defaultValues: { published: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="published">
        {(field) => <field.CheckboxField label="Published" required />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.published}>
        {(value) => <output data-testid="value-probe">{String(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("CheckboxField", () => {
  it("renders exactly one label, beside the checkbox", () => {
    render(<Harness initialValue={false} />);
    expect(screen.getAllByText(/Published/)).toHaveLength(1);
  });

  it("toggles the form value on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness initialValue={false} />);
    // Base UI's visible `role="checkbox"` span delegates a real click to its
    // hidden native `<input>` via a dispatched `PointerEvent` — jsdom doesn't
    // implement it (same gap `checkbox/Input.test.tsx` documents) — so this
    // drives the interaction through the hidden input directly.
    const hiddenInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    await user.click(hiddenInput);
    expect(screen.getByTestId("value-probe")).toHaveTextContent("true");
  });
});
