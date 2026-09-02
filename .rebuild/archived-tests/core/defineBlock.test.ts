import { describe, it, expect } from "vitest";
import { defineBlock } from "./defineBlock";
import { text } from "../fields/text";
import { VexBlockValidationError } from "../errors";

describe("defineBlock", () => {
  it("returns a BlockDef with correct slug, label, and fields", () => {
    const block = defineBlock({
      slug: "hero",
      label: "Hero Section",
      fields: {
        heading: text({ required: true, defaultValue: "" }),
        subheading: text(),
      },
    });

    expect(block.slug).toBe("hero");
    expect(block.label).toBe("Hero Section");
    expect(block.fields.heading.type).toBe("text");
    expect(block.fields.subheading.type).toBe("text");
  });

  it("accepts empty fields (divider block)", () => {
    const block = defineBlock({
      slug: "divider",
      label: "Divider",
      fields: {},
    });

    expect(block.slug).toBe("divider");
    expect(Object.keys(block.fields)).toHaveLength(0);
  });

  it("accepts admin config with icon", () => {
    const block = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: {},
      admin: { icon: "layout-template" },
    });

    expect(block.admin?.icon).toBe("layout-template");
  });

  it("accepts slugs with hyphens and underscores", () => {
    const block = defineBlock({
      slug: "feature-grid_v2",
      label: "Feature Grid",
      fields: {},
    });

    expect(block.slug).toBe("feature-grid_v2");
  });

  it("throws on empty slug", () => {
    expect(() => defineBlock({ slug: "", label: "Test", fields: {} })).toThrow(
      VexBlockValidationError,
    );
  });

  it("throws on slug starting with a number", () => {
    expect(() =>
      defineBlock({ slug: "123hero", label: "Test", fields: {} }),
    ).toThrow(VexBlockValidationError);
  });

  it("throws on slug with spaces", () => {
    expect(() =>
      defineBlock({ slug: "my block", label: "Test", fields: {} }),
    ).toThrow(VexBlockValidationError);
  });

  it("throws when field name 'blockType' is used", () => {
    expect(() =>
      defineBlock({
        slug: "hero",
        label: "Hero",
        fields: { blockType: text() },
      }),
    ).toThrow(VexBlockValidationError);
    expect(() =>
      defineBlock({
        slug: "hero",
        label: "Hero",
        fields: { blockType: text() },
      }),
    ).toThrow(/reserved/i);
  });

  it("throws when field name '_key' is used", () => {
    expect(() =>
      defineBlock({
        slug: "hero",
        label: "Hero",
        fields: { _key: text() },
      }),
    ).toThrow(VexBlockValidationError);
  });

  it("throws when field name 'blockName' is used", () => {
    expect(() =>
      defineBlock({
        slug: "hero",
        label: "Hero",
        fields: { blockName: text() },
      }),
    ).toThrow(VexBlockValidationError);
  });
});
