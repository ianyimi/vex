import { describe, it, expect } from "vitest";
import { checkboxColumnDef } from "./columnDef";
import { checkbox } from ".";

describe("checkboxColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const col = checkboxColumnDef({ fieldKey: "featured", field: checkbox() });
    expect(col).toHaveProperty("accessorKey", "featured");
  });

  it("uses field.label as header when provided", () => {
    const col = checkboxColumnDef({ fieldKey: "featured", field: checkbox({ label: "Is Featured" }) });
    expect(col).toHaveProperty("header", "Is Featured");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = checkboxColumnDef({ fieldKey: "active", field: checkbox() });
    expect(col).toHaveProperty("header", "Active");
  });
});
