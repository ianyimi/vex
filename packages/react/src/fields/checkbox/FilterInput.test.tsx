import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { checkbox } from "@vexcms/core";
import { CheckboxFilterInput } from "./FilterInput";

const fieldDef = checkbox({ label: "Featured" });

describe("CheckboxFilterInput", () => {
  it("shows True when value is true", () => {
    render(<CheckboxFilterInput field={fieldDef} value={true} op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Filter value: True" })).toHaveTextContent("True");
  });

  it("shows False when value is false", () => {
    render(<CheckboxFilterInput field={fieldDef} value={false} op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Filter value: False" })).toHaveTextContent("False");
  });

  it("shows the Value placeholder in the accessible name when unset", () => {
    render(<CheckboxFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Filter value: Value" })).toBeInTheDocument();
  });

  it("picking False calls onChange(false)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxFilterInput field={fieldDef} value={true} op="eq" onChange={onChange} />);
    await user.click(screen.getByRole("combobox", { name: /^Filter value/ }));
    await user.click(await screen.findByRole("option", { name: "False" }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("disables the select when props.disabled is true", () => {
    render(<CheckboxFilterInput field={fieldDef} value={true} op="eq" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("combobox", { name: /^Filter value/ })).toBeDisabled();
  });
});
