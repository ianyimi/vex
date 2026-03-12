import { describe, it, expect } from "vitest";
import { arrayColumnDef } from "./columnDef";
import { array } from ".";
import { text } from "../text";

describe("arrayColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const col = arrayColumnDef({ fieldKey: "tags", field: array({ field: text() }) });
    expect(col).toHaveProperty("accessorKey", "tags");
  });

  it("uses field.label as header when provided", () => {
    const col = arrayColumnDef({ fieldKey: "tags", field: array({ field: text(), label: "Tags" }) });
    expect(col).toHaveProperty("header", "Tags");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = arrayColumnDef({ fieldKey: "tags", field: array({ field: text() }) });
    expect(col).toHaveProperty("header", "Tags");
  });
});
