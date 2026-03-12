import { describe, it, expect } from "vitest";
import { numberColumnDef } from "./columnDef";
import { number } from ".";

describe("numberColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const col = numberColumnDef({ fieldKey: "count", field: number() });
    expect(col).toHaveProperty("accessorKey", "count");
  });

  it("uses field.label as header when provided", () => {
    const col = numberColumnDef({ fieldKey: "count", field: number({ label: "View Count" }) });
    expect(col).toHaveProperty("header", "View Count");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = numberColumnDef({ fieldKey: "views", field: number() });
    expect(col).toHaveProperty("header", "Views");
  });
});
