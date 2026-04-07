import { describe, it, expect } from "vitest";
import { richtext } from "./config";

describe("richtext", () => {
  it("creates a richtext field with default options", () => {
    const field = richtext();
    expect(field).toEqual({ type: "richtext" });
  });

  it("creates a richtext field with all options", () => {
    const field = richtext({
      label: "Content",
      required: true,
      description: "Main article content",
      admin: { position: "main", width: "full" },
    });
    expect(field).toEqual({
      type: "richtext",
      label: "Content",
      required: true,
      description: "Main article content",
      admin: { position: "main", width: "full" },
    });
  });

  it("preserves editor override", () => {
    const mockEditor = { type: "plate" } as any;
    const field = richtext({ editor: mockEditor });
    expect(field.editor).toBe(mockEditor);
  });
});
