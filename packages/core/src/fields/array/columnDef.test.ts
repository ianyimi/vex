import { describe, it, expect } from "vitest";
import { arrayColumnDef } from "./columnDef";
import type { ArrayFieldMeta } from "../../types";
import { text } from "../text";

describe("arrayColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: ArrayFieldMeta = { type: "array", field: text() };
    const col = arrayColumnDef({ fieldKey: "tags", meta });
    expect(col).toHaveProperty("accessorKey", "tags");
  });

  it("uses meta.label as header when provided", () => {
    const meta: ArrayFieldMeta = { type: "array", field: text(), label: "Tags" };
    const col = arrayColumnDef({ fieldKey: "tags", meta });
    expect(col).toHaveProperty("header", "Tags");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: ArrayFieldMeta = { type: "array", field: text() };
    const col = arrayColumnDef({ fieldKey: "tags", meta });
    expect(col).toHaveProperty("header", "Tags");
  });
});
