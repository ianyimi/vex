import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { UrlField } from "./UrlField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { UrlField },
  formComponents: {},
});

function Harness(props: { initialValue: string }) {
  const form = useAppForm({ defaultValues: { website: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="website">{(field) => <field.UrlField label="Website" />}</form.AppField>
    </form.AppForm>
  );
}

describe("UrlField", () => {
  it("disables the open-link button for an unparseable value", () => {
    render(<Harness initialValue="not a url" />);
    expect(screen.getByRole("button", { name: "Open link in new tab" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables the open-link button for a parseable absolute URL", () => {
    render(<Harness initialValue="https://vexcms.dev" />);
    expect(screen.getByRole("button", { name: "Open link in new tab" })).not.toHaveAttribute(
      "aria-disabled",
    );
  });
});
