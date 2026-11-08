import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { text } from "@vexcms/core";
import { TextFilterInput } from "./FilterInput";

const fieldDef = text({ label: "Title" });

describe("TextFilterInput", () => {
  it("renders the current value", () => {
    render(<TextFilterInput field={fieldDef} value="Hello" op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("Hello");
  });

  it("renders an empty input for an undefined value", () => {
    render(<TextFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("calls onChange with the typed string", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TextFilterInput field={fieldDef} value="" op="eq" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "x");
    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("disables the input when props.disabled is true", () => {
    render(<TextFilterInput field={fieldDef} value="" op="eq" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("exposes the field's label as the input's accessible name", () => {
    render(<TextFilterInput field={fieldDef} value="" op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Title" })).toBeInTheDocument();
  });
});
