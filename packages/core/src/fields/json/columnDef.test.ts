import { describe, it, expect } from "vitest";
import { jsonColumnDef } from "./columnDef";
import { json } from ".";

describe("jsonColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const col = jsonColumnDef({ fieldKey: "metadata", field: json() });
    expect(col).toHaveProperty("accessorKey", "metadata");
  });

  it("uses field.label as header when provided", () => {
    const col = jsonColumnDef({ fieldKey: "metadata", field: json({ label: "Metadata" }) });
    expect(col).toHaveProperty("header", "Metadata");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = jsonColumnDef({ fieldKey: "metadata", field: json() });
    expect(col).toHaveProperty("header", "Metadata");
  });
});
