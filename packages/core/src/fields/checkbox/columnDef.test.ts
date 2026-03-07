import { describe, it, expect } from "vitest";
import { checkboxColumnDef } from "./columnDef";
import type { CheckboxFieldMeta } from "../../types";

describe("checkboxColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox" };
    const col = checkboxColumnDef({ fieldKey: "featured", meta });
    expect(col).toHaveProperty("accessorKey", "featured");
  });

  it("uses meta.label as header when provided", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox", label: "Is Featured" };
    const col = checkboxColumnDef({ fieldKey: "featured", meta });
    expect(col).toHaveProperty("header", "Is Featured");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: CheckboxFieldMeta = { type: "checkbox" };
    const col = checkboxColumnDef({ fieldKey: "active", meta });
    expect(col).toHaveProperty("header", "Active");
  });
});
