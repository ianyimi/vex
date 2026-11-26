import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { GroupField } from "./GroupField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { GroupField },
  formComponents: {},
});

function Harness(props: {
  collapsible?: boolean;
  defaultOpen?: boolean;
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
}) {
  const form = useAppForm({ defaultValues: { seo: { title: "x" } } });
  return (
    <form.AppForm>
      <form.AppField name="seo">
        {(field) => (
          <field.GroupField
            label="SEO"
            collapsible={props.collapsible}
            defaultOpen={props.defaultOpen}
            isNull={props.isNull}
            onIsNullChange={props.onIsNullChange}
          >
            <span data-testid="group-children">children</span>
          </field.GroupField>
        )}
      </form.AppField>
    </form.AppForm>
  );
}

/**
 * Mirrors {@link Harness} but with a real `onSubmit` validator that fails
 * with an error on the `seo` path itself — the nested-error-on-failed-submit
 * scenario `GroupField`'s own `failedSubmitAttempt`/`errorCount` effect
 * (Finding 9) exists to re-open a collapsed group for.
 */
function SubmitHarness(props: { defaultOpen?: boolean }) {
  const form = useAppForm({
    defaultValues: { seo: { title: "" } },
    validators: {
      onSubmit: () => ({ fields: { seo: "Required" } }),
    },
  });
  return (
    <form.AppForm>
      <form.AppField name="seo">
        {(field) => (
          <field.GroupField label="SEO" collapsible defaultOpen={props.defaultOpen}>
            <span data-testid="group-children">children</span>
          </field.GroupField>
        )}
      </form.AppField>
      <button type="button" onClick={() => form.handleSubmit()}>
        Submit
      </button>
    </form.AppForm>
  );
}

describe("GroupField", () => {
  it("renders a plain fieldset with no trigger when collapsible is false", () => {
    render(<Harness collapsible={false} />);
    expect(screen.getByTestId("group-children")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders an accordion trigger labelled with the group label when collapsible", () => {
    render(<Harness collapsible defaultOpen />);
    expect(screen.getByRole("button", { name: /SEO/ })).toBeInTheDocument();
  });

  it("toggles children visibility on trigger click", async () => {
    const user = userEvent.setup();
    render(<Harness collapsible defaultOpen={false} />);
    const trigger = screen.getByRole("button", { name: /SEO/ });
    await user.click(trigger);
    expect(screen.getByTestId("group-children")).toBeVisible();
  });

  it("auto-opens a collapsed group once a failed submit leaves an error on its own path (Finding 9 regression)", async () => {
    const user = userEvent.setup();
    render(<SubmitHarness defaultOpen={false} />);
    expect(screen.queryByTestId("group-children")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(await screen.findByTestId("group-children")).toBeVisible();

  });

  it("hides children and shows a Null switch when isNull", () => {
    render(<Harness collapsible defaultOpen isNull onIsNullChange={() => {}} />);
    expect(screen.queryByTestId("group-children")).not.toBeInTheDocument();
    expect(screen.getByText("Null")).toBeInTheDocument();
  });

  it("collapses the accordion and disables the trigger while isNull, re-enabling it on uncheck", async () => {
    const user = userEvent.setup();
    const onIsNullChange = vi.fn();
    const { rerender } = render(<Harness collapsible defaultOpen isNull onIsNullChange={onIsNullChange} />);
    const trigger = screen.getByRole("button", { name: /SEO/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByTestId("group-children")).not.toBeInTheDocument();

    rerender(<Harness collapsible defaultOpen isNull={false} onIsNullChange={onIsNullChange} />);
    expect(screen.getByRole("button", { name: /SEO/ })).not.toBeDisabled();
    expect(screen.getByTestId("group-children")).toBeVisible();
  });
});
