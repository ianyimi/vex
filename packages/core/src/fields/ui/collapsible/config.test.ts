import { describe, it, expect } from "vitest";
import { collapsible } from "./config";
import { text } from "../../text/config";

describe("collapsible()", () => {
  it("defaults defaultCollapsed to false", () => {
    const field = collapsible({ label: "SEO", fields: { title: text() } });
    expect(field.admin.defaultCollapsed).toBe(false);
  });

  it("keeps the given fields verbatim", () => {
    const field = collapsible({
      label: "SEO",
      admin: { defaultCollapsed: true },
      fields: { title: text() },
    });
    expect(field.type).toBe("collapsible");
    expect(field.fields.title).toBeDefined();
    expect(field.admin.defaultCollapsed).toBe(true);
  });

  it("throws on an empty field map", () => {
    expect(() => collapsible({ label: "SEO", fields: {} })).toThrow(
      "collapsible(): requires at least one field",
    );
  });
});
