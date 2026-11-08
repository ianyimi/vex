import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { number } from "@vexcms/core";
import { NumberFilterInput } from "./FilterInput";

const fieldDef = number({ label: "Rating" });

describe("NumberFilterInput", () => {
  it("renders a number input with the current value", () => {
    render(<NumberFilterInput field={fieldDef} value={4} op="eq" onChange={vi.fn()} />);
    const control = screen.getByRole("spinbutton");
    expect(control).toHaveValue(4);
  });

  it("renders an empty number input for an undefined value", () => {
    render(<NumberFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("spinbutton")).toHaveValue(null);
  });

  it("calls onChange with a parsed Number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberFilterInput field={fieldDef} value={undefined} op="eq" onChange={onChange} />);
    await user.type(screen.getByRole("spinbutton"), "5");
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("disables the input when props.disabled is true", () => {
    render(<NumberFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("spinbutton")).toBeDisabled();
  });

  it("exposes the field's label as the input's accessible name", () => {
    render(<NumberFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("spinbutton", { name: "Rating" })).toBeInTheDocument();
  });
});
