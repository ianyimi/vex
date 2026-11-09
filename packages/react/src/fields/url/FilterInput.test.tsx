import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { url } from "@vexcms/core";
import { UrlFilterInput } from "./FilterInput";

const fieldDef = url({ label: "Link" });

describe("UrlFilterInput", () => {
  it("renders the current value", () => {
    render(<UrlFilterInput field={fieldDef} value="https://a.com" op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("https://a.com");
  });

  it("calls onChange with the typed string", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UrlFilterInput field={fieldDef} value="" op="eq" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "x");
    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("disables the input when props.disabled is true", () => {
    render(<UrlFilterInput field={fieldDef} value="" op="eq" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("exposes the field's label as the input's accessible name", () => {
    render(<UrlFilterInput field={fieldDef} value="" op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Link" })).toBeInTheDocument();
  });
});
