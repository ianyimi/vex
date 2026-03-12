import { describe, it, expect } from "vitest";
import { dateColumnDef } from "./columnDef";
import { date } from ".";

describe("dateColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const col = dateColumnDef({ fieldKey: "createdAt", field: date() });
    expect(col).toHaveProperty("accessorKey", "createdAt");
  });

  it("uses field.label as header when provided", () => {
    const col = dateColumnDef({ fieldKey: "createdAt", field: date({ label: "Created" }) });
    expect(col).toHaveProperty("header", "Created");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = dateColumnDef({ fieldKey: "createdAt", field: date() });
    expect(col).toHaveProperty("header", "Created At");
  });

  it("has a cell renderer", () => {
    const col = dateColumnDef({ fieldKey: "createdAt", field: date() });
    expect(col.cell).toBeDefined();
  });
});
