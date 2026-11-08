import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { date } from "@vexcms/core";
import { DateFilterInput } from "./FilterInput";

const fieldDef = date({ label: "Published" });

describe("DateFilterInput", () => {
  it("shows the placeholder when value is undefined", () => {
    render(<DateFilterInput field={fieldDef} value={undefined} op="gte" onChange={vi.fn()} />);
    expect(screen.getByText("Pick a date")).toBeInTheDocument();
  });

  it("shows a formatted date when value is a Unix-ms number", () => {
    render(<DateFilterInput field={fieldDef} value={new Date(2024, 0, 15).getTime()} op="gte" onChange={vi.fn()} />);
    expect(screen.queryByText("Pick a date")).not.toBeInTheDocument();
  });

  it("disables the trigger when props.disabled is true", () => {
    render(<DateFilterInput field={fieldDef} value={undefined} op="gte" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
  });

  it("exposes the field's label as the trigger's accessible name", () => {
    render(<DateFilterInput field={fieldDef} value={undefined} op="gte" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox", { name: "Published" })).toBeInTheDocument();
  });
});
