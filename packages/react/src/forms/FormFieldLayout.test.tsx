import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";

function Harness(props: {
  initialValue: string;
  label?: string;
  required?: boolean;
  description?: string;
  index?: number;
  submissionAttempts?: number;
  validate?: (value: string) => string | undefined;
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { name: props.initialValue },
  });
  return (
    <form.Field
      name="name"
      validators={props.validate ? { onMount: ({ value }) => props.validate!(value) } : undefined}
    >
      {(field) => {
        const showError = isFieldShowingError({ field, submissionAttempts: props.submissionAttempts ?? 0 });
        const describedBy = fieldDescribedBy({
          id: "name",
          hasDescription: Boolean(props.description),
          showError,
        });
        return (
          <FormFieldLayout
            id="name"
            label={props.label}
            required={props.required}
            description={props.description}
            index={props.index}
            field={field}
            submissionAttempts={props.submissionAttempts ?? 0}
            readOnly={props.readOnly}
          >
            <input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={showError}
              aria-describedby={describedBy}
            />
          </FormFieldLayout>
        );
      }}
    </form.Field>
  );
}

describe("FormFieldLayout", () => {
  it("renders the label with the required marker and an index prefix", () => {
    render(<Harness initialValue="" label="Name" required index={2} />);
    const label = screen.getByText(/Name/).closest("label")!;
    expect(label.textContent).toBe("[3] - Name*");
  });

  // Regression (muted read-only label): a field the caller can't write
  // (field permission map, `admin.readOnly`, or an auth-adapter-locked
  // field) must visibly read as read-only, not just its (greyed-out, easy
  // to miss) control. `readOnly` drives `data-disabled` on the outer
  // `Field` group — `FieldLabel`/`FieldDescription`'s own
  // `group-data-[disabled=true]/field:opacity-50` classes do the muting.
  it("marks the field group disabled when readOnly, muting the label and description", () => {
    render(<Harness initialValue="" label="Name" description="Helper text" readOnly />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-disabled", "true");
  });

  it("does not mark the field group disabled when readOnly is omitted", () => {
    render(<Harness initialValue="" label="Name" />);
    const group = screen.getByRole("group");
    expect(group).not.toHaveAttribute("data-disabled");
  });

  it("renders no label block when label is omitted", () => {
    render(<Harness initialValue="" />);
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
  });

  it("shows the description only when provided", () => {
    const { rerender } = render(<Harness initialValue="" />);
    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    rerender(<Harness initialValue="" description="Helper text" />);
    expect(screen.getByText("Helper text")).toBeInTheDocument();
  });

  it("renders label, description, then control in that DOM order — description above the control, not below it", () => {
    render(<Harness initialValue="" label="Name" description="Helper text" />);
    const group = screen.getByRole("group");
    const label = screen.getByText("Name").closest("label")!;
    const description = screen.getByText("Helper text");
    const control = screen.getByRole("textbox");
    expect(group).toContainElement(label);
    expect(label.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(description.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the error only after submissionAttempts > 0 with no prior touch", () => {
    render(<Harness initialValue="" validate={(v) => (v ? undefined : "Required")} submissionAttempts={1} />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("hides the error before any submission attempt or touch", () => {
    render(<Harness initialValue="" validate={(v) => (v ? undefined : "Required")} submissionAttempts={0} />);
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("sets aria-invalid and aria-describedby on the control, not the role=group wrapper", () => {
    render(
      <Harness
        initialValue=""
        description="Helper text"
        validate={(v) => (v ? undefined : "Required")}
        submissionAttempts={1}
      />,
    );
    const control = screen.getByRole("textbox");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control.getAttribute("aria-describedby")).toBe("name-description name-error");
    const group = screen.getByRole("group");
    expect(group).not.toHaveAttribute("aria-invalid");
    expect(group).not.toHaveAttribute("aria-describedby");
  });
});

describe("isFieldShowingError", () => {
  it("is false with zero submission attempts and an untouched field", () => {
    const field = {
      state: { meta: { errors: ["Required"], isTouched: false } },
    } as unknown as Parameters<typeof isFieldShowingError>[0]["field"];
    expect(isFieldShowingError({ field, submissionAttempts: 0 })).toBe(false);
  });

  it("reads a Standard Schema issue's message property", () => {
    const field = {
      state: { meta: { errors: [{ message: "Too short" }], isTouched: true } },
    } as unknown as Parameters<typeof isFieldShowingError>[0]["field"];
    expect(isFieldShowingError({ field, submissionAttempts: 0 })).toBe(true);
  });
});
