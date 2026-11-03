import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { select } from "@vexcms/core";
import { SelectFilterInput } from "./FilterInput";

const fieldDef = select({
  label: "Source",
  options: [
    { label: "G2", value: "g2" },
    { label: "Site", value: "site" },
  ],
});

describe("SelectFilterInput", () => {
  it("shows the current value's label", () => {
    render(<SelectFilterInput field={fieldDef} value="g2" op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Filter value: G2" })).toHaveTextContent("G2");
  });

  it("shows the Value placeholder in the accessible name when unset", () => {
    render(<SelectFilterInput field={fieldDef} value={undefined} op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Filter value: Value" })).toBeInTheDocument();
  });

  it("offers every declared option and calls onChange with the picked value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectFilterInput field={fieldDef} value="g2" op="eq" onChange={onChange} />);
    await user.click(screen.getByRole("combobox", { name: /^Filter value/ }));
    expect(await screen.findByRole("option", { name: "Site" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Site" }));
    expect(onChange).toHaveBeenCalledWith("site");
  });

  it("works for the synthetic vex_status field (itself type: select, no special case)", () => {
    const statusField = {
      type: "select",
      label: "Status",
      options: [
        { label: "Published", value: "published" },
        { label: "Draft", value: "draft" },
      ],
    } as never;
    render(<SelectFilterInput field={statusField} value="draft" op="eq" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Filter value: Draft" })).toHaveTextContent("Draft");
  });

  it("disables the select when props.disabled is true", () => {
    render(<SelectFilterInput field={fieldDef} value="g2" op="eq" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("combobox", { name: /^Filter value/ })).toBeDisabled();
  });
});
