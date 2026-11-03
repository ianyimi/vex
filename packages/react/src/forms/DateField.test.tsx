import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { DateField } from "./DateField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { DateField },
  formComponents: {},
});

function Harness(props: { initialValue: number | undefined; hideTime?: boolean }) {
  const form = useAppForm({ defaultValues: { publishedAt: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="publishedAt">
        {(field) => <field.DateField label="Published at" hideTime={props.hideTime} />}
      </form.AppField>
    </form.AppForm>
  );
}

function OverrideHarness() {
  const form = useAppForm({
    defaultValues: { publishedAt: undefined as number | undefined },
    validators: {
      onSubmit: ({ value }) =>
        value.publishedAt === undefined ? { fields: { publishedAt: "Required." } } : undefined,
    },
  });
  return (
    <form.AppForm>
      <form.AppField name="publishedAt">
        {(field) => (
          <field.DateField
            label="Published at"
            renderControl={(controlProps) => (
              <div data-testid="override" data-invalid={controlProps.invalid} />
            )}
          />
        )}
      </form.AppField>
      <form.Subscribe>
        {() => (
          <button type="button" onClick={() => form.handleSubmit()}>
            Submit
          </button>
        )}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("DateField", () => {
  it("renders the label and a button-triggered picker for an unset value", () => {
    render(<Harness initialValue={undefined} />);
    expect(screen.getByText("Published at")).toBeInTheDocument();
  });

  it("renders the stored epoch value as a formatted date", () => {
    render(<Harness initialValue={Date.UTC(2026, 0, 15)} />);
    expect(screen.getByText(/Jan 15, 2026/)).toBeInTheDocument();
  });

  it("passes the real isFieldShowingError-derived invalid flag to a renderControl override after a failed submit, not hardcoded false", async () => {
    const user = userEvent.setup();
    render(<OverrideHarness />);
    expect(screen.getByTestId("override")).toHaveAttribute("data-invalid", "false");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByTestId("override")).toHaveAttribute("data-invalid", "true");
  });
});
