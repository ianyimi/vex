import { describe, it, expect } from "vitest";
import { jsonColumnDef } from "./columnDef";
import type { JsonFieldMeta } from "../../types";

describe("jsonColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: JsonFieldMeta = { type: "json" };
    const col = jsonColumnDef({ fieldKey: "metadata", meta });
    expect(col).toHaveProperty("accessorKey", "metadata");
  });

  it("uses meta.label as header when provided", () => {
    const meta: JsonFieldMeta = { type: "json", label: "Metadata" };
    const col = jsonColumnDef({ fieldKey: "metadata", meta });
    expect(col).toHaveProperty("header", "Metadata");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: JsonFieldMeta = { type: "json" };
    const col = jsonColumnDef({ fieldKey: "metadata", meta });
    expect(col).toHaveProperty("header", "Metadata");
  });
});
