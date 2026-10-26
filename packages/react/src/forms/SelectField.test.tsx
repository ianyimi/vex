import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { SelectField } from "./SelectField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { SelectField },
  formComponents: {},
});

const options = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

function RadioHarness(props: { initialValue: string[]; hasMany?: boolean }) {
  const form = useAppForm({ defaultValues: { status: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="status">
        {(field) => (
          <field.SelectField label="Status" options={options} display="radio" hasMany={props.hasMany} />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.status}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("SelectField: radio display", () => {
  it("renders one radio per option and selects on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<RadioHarness initialValue={[]} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    // Base UI's visible `role="radio"` span handles clicks via a
    // `PointerEvent` jsdom doesn't implement — same gap
    // `select/Input.test.tsx` documents. Drive the interaction through the
    // hidden native `<input type="radio">` instead.
    const publishedIndex = options.findIndex((o) => o.label === "Published");
    const hiddenInputs = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    await user.click(hiddenInputs[publishedIndex]!);
    expect(screen.getByTestId("value-probe")).toHaveTextContent('["published"]');
  });

  it("renders checkboxes instead of radios when hasMany is true", () => {
    render(<RadioHarness initialValue={[]} hasMany />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("toggles a second value into the selection when hasMany is true", async () => {
    const user = userEvent.setup();
    const { container } = render(<RadioHarness initialValue={["draft"]} hasMany />);
    // Same jsdom `PointerEvent` gap as above — drive through the hidden
    // native `<input type="checkbox">` elements.
    const publishedIndex = options.findIndex((o) => o.label === "Published");
    const hiddenInputs = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    await user.click(hiddenInputs[publishedIndex]!);
    expect(screen.getByTestId("value-probe")).toHaveTextContent('["draft","published"]');
  });
});
