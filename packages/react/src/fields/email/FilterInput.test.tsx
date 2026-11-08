import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { email } from "@vexcms/core";
import { EmailFilterInput } from "./FilterInput";

const fieldDef = email({ label: "Email" });

describe("EmailFilterInput", () => {
  it("renders the current value", () => {
    render(<EmailFilterInput field={fieldDef} value="a@b.com" op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("a@b.com");
  });

  it("calls onChange with the typed string", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EmailFilterInput field={fieldDef} value="" op="eq" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "x");
    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("disables the input when props.disabled is true", () => {
    render(<EmailFilterInput field={fieldDef} value="" op="eq" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("exposes the field's label as the input's accessible name", () => {
    render(<EmailFilterInput field={fieldDef} value="" op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
  });
});
