import { describe, it, expect } from "vitest";
import { textColumnDef } from "./columnDef";
import { text } from ".";

describe("textColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const col = textColumnDef({ fieldKey: "title", field: text() });
    expect(col).toHaveProperty("accessorKey", "title");
  });

  it("uses field.label as header when provided", () => {
    const col = textColumnDef({ fieldKey: "title", field: text({ label: "Post Title" }) });
    expect(col).toHaveProperty("header", "Post Title");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = textColumnDef({ fieldKey: "title", field: text() });
    expect(col).toHaveProperty("header", "Title");
  });
});
