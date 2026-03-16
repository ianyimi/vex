import { describe, it, expect } from "vitest";
import { richtextColumnDef } from "./columnDef";
import type { RichTextFieldDef } from "../../types";

describe("richtextColumnDef", () => {
  const field: RichTextFieldDef = { type: "richtext", label: "Content" };

  it("uses field label as header", () => {
    const col = richtextColumnDef({ fieldKey: "content", field });
    expect(col.header).toBe("Content");
  });

  it("falls back to title case of field key", () => {
    const col = richtextColumnDef({
      fieldKey: "body_content",
      field: { type: "richtext" },
    });
    expect(col.header).toBe("Body Content");
  });

  it("renders 'Rich text' for non-empty value", () => {
    const col = richtextColumnDef({ fieldKey: "content", field });
    const cell = (col as any).cell({
      getValue: () => [{ type: "p", children: [{ text: "hello" }] }],
    });
    expect(cell).toBe("Rich text");
  });

  it("renders empty string for null", () => {
    const col = richtextColumnDef({ fieldKey: "content", field });
    const cell = (col as any).cell({ getValue: () => null });
    expect(cell).toBe("");
  });

  it("renders empty string for empty array", () => {
    const col = richtextColumnDef({ fieldKey: "content", field });
    const cell = (col as any).cell({ getValue: () => [] });
    expect(cell).toBe("");
  });
});
