import { describe, it, expect } from "vitest";
import { dateColumnDef } from "./columnDef";
import type { DateFieldMeta } from "../../types";

describe("dateColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: DateFieldMeta = { type: "date" };
    const col = dateColumnDef({ fieldKey: "createdAt", meta });
    expect(col).toHaveProperty("accessorKey", "createdAt");
  });

  it("uses meta.label as header when provided", () => {
    const meta: DateFieldMeta = { type: "date", label: "Created" };
    const col = dateColumnDef({ fieldKey: "createdAt", meta });
    expect(col).toHaveProperty("header", "Created");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: DateFieldMeta = { type: "date" };
    const col = dateColumnDef({ fieldKey: "createdAt", meta });
    expect(col).toHaveProperty("header", "Created At");
  });

  it("has a cell renderer", () => {
    const meta: DateFieldMeta = { type: "date" };
    const col = dateColumnDef({ fieldKey: "createdAt", meta });
    expect(col.cell).toBeDefined();
  });
});
