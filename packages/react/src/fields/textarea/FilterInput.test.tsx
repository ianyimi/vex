import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { textarea } from "@vexcms/core";
import { TextareaFilterInput } from "./FilterInput";

const fieldDef = textarea({ label: "Body" });

describe("TextareaFilterInput", () => {
  it("renders a plain Input (not a textarea) with the current value", () => {
    render(<TextareaFilterInput field={fieldDef} value="Hello" op="eq" onChange={vi.fn()} />);
    const control = screen.getByRole("textbox");
    expect(control).toHaveValue("Hello");
    expect(control.tagName).toBe("INPUT");
  });

  it("calls onChange with the typed string", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextareaFilterInput field={fieldDef} value="" op="eq" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "x");
    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("disables the input when props.disabled is true", () => {
    render(<TextareaFilterInput field={fieldDef} value="" op="eq" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
