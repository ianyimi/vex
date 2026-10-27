import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { AppForm } from "./AppForm";
import { useFormContext } from "./formContext";
import { useCompactForm } from "./FormCompactContext";

function Harness(props: { onSubmit: () => void; validate?: boolean }) {
  const form = useForm({
    defaultValues: { name: "" },
    validators: props.validate
      ? { onSubmit: ({ value }) => (value.name ? undefined : { fields: { name: "Required" } }) }
      : undefined,
    onSubmit: props.onSubmit,
  });
  return (
    <AppForm form={form} className="extra">
      <form.Field name="name">
        {(field) => (
          <div data-field-invalid={field.state.meta.errors.length > 0 ? "" : undefined}>
            <input
              aria-label="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

describe("AppForm", () => {
  it("renders a noValidate form with the @container/form class and the caller's className", () => {
    render(<Harness onSubmit={vi.fn()} />);
    const form = screen.getByRole("textbox", { name: "name" }).closest("form")!;
    expect(form).toHaveAttribute("noValidate");
    expect(form.className).toContain("@container/form");
    expect(form.className).toContain("extra");
  });

  it("calls handleSubmit instead of letting the browser navigate on submit", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} validate={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("provides formContext to descendants", () => {
    function Reader() {
      const form = useFormContext();
      return <span>{String(form.state.values.name === "")}</span>;
    }
    function Wrapper() {
      const form = useForm({ defaultValues: { name: "" } });
      return (
        <AppForm form={form}>
          <Reader />
        </AppForm>
      );
    }
    render(<Wrapper />);
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("provides FormCompactContext to descendants", () => {
    function Reader() {
      return <span>{String(useCompactForm())}</span>;
    }
    function Wrapper() {
      const form = useForm({ defaultValues: { name: "" } });
      return (
        <AppForm form={form}>
          <Reader />
        </AppForm>
      );
    }
    render(<Wrapper />);
    expect(screen.getByText("false")).toBeInTheDocument();
  });
});
