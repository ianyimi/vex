import { describe, it, expect } from "vitest";
import { textColumnDef } from "./columnDef";
import type { TextFieldMeta } from "../../types";

describe("textColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: TextFieldMeta = { type: "text" };
    const col = textColumnDef({ fieldKey: "title", meta });
    expect(col).toHaveProperty("accessorKey", "title");
  });

  it("uses meta.label as header when provided", () => {
    const meta: TextFieldMeta = { type: "text", label: "Post Title" };
    const col = textColumnDef({ fieldKey: "title", meta });
    expect(col).toHaveProperty("header", "Post Title");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: TextFieldMeta = { type: "text" };
    const col = textColumnDef({ fieldKey: "title", meta });
    expect(col).toHaveProperty("header", "Title");
  });
});
