import { describe, it, expect } from "vitest";
import { numberColumnDef } from "./columnDef";
import type { NumberFieldMeta } from "../../types";

describe("numberColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: NumberFieldMeta = { type: "number" };
    const col = numberColumnDef({ fieldKey: "count", meta });
    expect(col).toHaveProperty("accessorKey", "count");
  });

  it("uses meta.label as header when provided", () => {
    const meta: NumberFieldMeta = { type: "number", label: "View Count" };
    const col = numberColumnDef({ fieldKey: "count", meta });
    expect(col).toHaveProperty("header", "View Count");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: NumberFieldMeta = { type: "number" };
    const col = numberColumnDef({ fieldKey: "views", meta });
    expect(col).toHaveProperty("header", "Views");
  });
});
