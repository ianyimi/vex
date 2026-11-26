import { describe, it, expect } from "vitest";
import { select } from "./select/config";
import { text } from "./text/config";
import { childInterfaceType } from "./childInterfaceType";

describe("childInterfaceType — select", () => {
  it("emits an inline array union when no schema override is set", () => {
    const field = select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    });
    expect(childInterfaceType(field)).toBe('("draft" | "published")[]');
  });

  it("emits a bare inline union for schema.validator: 'literal'", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "literal" },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    });
    expect(childInterfaceType(field)).toBe('("draft" | "published")');
  });

  it("emits a bare string for schema.validator: 'string'", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "string" },
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(childInterfaceType(field)).toBe("string");
  });

  it("falls back to the declared interfaceType with no options configured", () => {
    const field = select({ options: [] });
    expect(childInterfaceType(field)).toBe("string[]");
  });

  it("is unaffected for non-select fields", () => {
    const field = text();
    expect(childInterfaceType(field)).toBe("string");
  });
});

describe("childInterfaceType — select — nullable", () => {
  it("appends | null to the inline array union when no schema override is set", () => {
    const field = select({
      nullable: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    });
    expect(childInterfaceType(field)).toBe('("draft" | "published")[] | null');
  });

  it("appends | null to the bare inline union for schema.validator: 'literal'", () => {
    const field = select({
      nullable: true,
      hasMany: false,
      schema: { validator: "literal" },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    });
    expect(childInterfaceType(field)).toBe('("draft" | "published") | null');
  });

  it("appends | null to the bare string for schema.validator: 'string'", () => {
    const field = select({
      nullable: true,
      hasMany: false,
      schema: { validator: "string" },
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(childInterfaceType(field)).toBe("string | null");
  });

  it("appends | null to the declared interfaceType fallback with no options configured", () => {
    const field = select({ nullable: true, options: [] });
    expect(childInterfaceType(field)).toBe("string[] | null");
  });
});
