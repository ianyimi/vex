import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { VariantField } from "./VariantField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { VariantField },
  formComponents: {},
});

function Harness(props: {
  defaultOpen?: boolean;
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
  onActiveKeyChange?: (key: string) => void;
}) {
  const form = useAppForm({ defaultValues: { channel: "email" } });
  return (
    <form.AppForm>
      <form.AppField name="channel">
        {(field) => (
          <field.VariantField
            label="Channel"
            discriminated
            defaultOpen={props.defaultOpen}
            isNull={props.isNull}
            onIsNullChange={props.onIsNullChange}
            options={[{ key: "email", label: "Email" }]}
            activeKey="email"
            onActiveKeyChange={props.onActiveKeyChange ?? (() => {})}
          >
            <span data-testid="variant-children">children</span>
          </field.VariantField>
        )}
      </form.AppField>
    </form.AppForm>
  );
}

describe("VariantField", () => {
  it("renders an accordion trigger labelled with the field label", () => {
    render(<Harness defaultOpen />);
    expect(screen.getByRole("button", { name: /Channel/ })).toBeInTheDocument();
  });

  it("toggles children visibility on trigger click", async () => {
    const user = userEvent.setup();
    render(<Harness defaultOpen={false} />);
    const trigger = screen.getByRole("button", { name: /Channel/ });
    await user.click(trigger);
    expect(screen.getByTestId("variant-children")).toBeVisible();
  });

  it("collapses the accordion and disables the trigger while isNull, re-enabling it on uncheck", async () => {
    const user = userEvent.setup();
    const onIsNullChange = vi.fn();
    const { rerender } = render(<Harness defaultOpen isNull onIsNullChange={onIsNullChange} />);
    const trigger = screen.getByRole("button", { name: /Channel/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByTestId("variant-children")).not.toBeInTheDocument();

    rerender(<Harness defaultOpen isNull={false} onIsNullChange={onIsNullChange} />);
    expect(screen.getByRole("button", { name: /Channel/ })).not.toBeDisabled();
    expect(screen.getByTestId("variant-children")).toBeVisible();
  });
});
