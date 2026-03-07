import { describe, it, expect } from "vitest";
import { selectColumnDef } from "./columnDef";
import type { SelectFieldMeta } from "../../types";

describe("selectColumnDef", () => {
  const selectMeta: SelectFieldMeta = {
    type: "select",
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
    ],
  };

  it("uses fieldKey as accessorKey", () => {
    const col = selectColumnDef({ fieldKey: "status", meta: selectMeta });
    expect(col).toHaveProperty("accessorKey", "status");
  });

  it("uses meta.label as header when provided", () => {
    const meta: SelectFieldMeta = { ...selectMeta, label: "Post Status" };
    const col = selectColumnDef({ fieldKey: "status", meta });
    expect(col).toHaveProperty("header", "Post Status");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = selectColumnDef({ fieldKey: "status", meta: selectMeta });
    expect(col).toHaveProperty("header", "Status");
  });
});
