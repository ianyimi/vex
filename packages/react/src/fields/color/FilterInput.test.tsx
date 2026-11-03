import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { color } from "@vexcms/core";
import { ColorFilterInput } from "./FilterInput";

const fieldDef = color({ label: "Accent" });

describe("ColorFilterInput", () => {
  it("renders a swatch with the current value's background color and a matching hex input", () => {
    const { container } = render(<ColorFilterInput field={fieldDef} value="#ff0000" op="eq" onChange={vi.fn()} />);
    const swatch = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(swatch.style.backgroundColor).toBe("rgb(255, 0, 0)");
    expect(screen.getByRole("textbox")).toHaveValue("#ff0000");
  });

  it("renders no swatch background for an empty value", () => {
    const { container } = render(<ColorFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} />);
    const swatch = container.querySelector("[aria-hidden='true']") as HTMLElement;
    expect(swatch.style.backgroundColor).toBe("");
  });

  it("calls onChange with the typed hex string", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColorFilterInput field={fieldDef} value="" op="eq" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "#");
    expect(onChange).toHaveBeenCalledWith("#");
  });

  it("disables the input when props.disabled is true", () => {
    render(<ColorFilterInput field={fieldDef} value="" op="eq" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
