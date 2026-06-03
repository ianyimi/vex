import { describe, it, expect } from "vitest";
import { defineBlock, blocks } from "./config";
import { text } from "../text";
import { number } from "../number";
import { blocksFieldToValidator } from "./validator";

const headingBlock = defineBlock({
  slug: "heading",
  label: "Heading",
  fields: { text: text({ required: true }) },
});
const paragraphBlock = defineBlock({
  slug: "paragraph",
  label: "Paragraph",
  fields: { content: text() },
});
const scoreBlock = defineBlock({
  slug: "score",
  label: "Score",
  fields: { value: number({ required: true }) },
});

describe("blocksFieldToValidator", () => {
  it("generates union array with framework keys for multiple block types", () => {
    const field = blocks({ blocks: [headingBlock, paragraphBlock] });
    const result = blocksFieldToValidator({ field });
    expect(result).toContain('v.literal("heading")');
    expect(result).toContain('v.literal("paragraph")');
    expect(result).toContain("blockName: v.optional(v.string())");
    expect(result).toContain("id: v.string()");
    expect(result).toContain("v.union(");
    expect(result).toContain("v.optional(v.array(");
  });

  it("skips union wrapper for a single block type", () => {
    const field = blocks({ blocks: [scoreBlock] });
    const result = blocksFieldToValidator({ field });
    expect(result).not.toContain("v.union(");
    expect(result).toContain('v.literal("score")');
    expect(result).toContain("id: v.string()");
  });

  it("omits outer v.optional for required field", () => {
    const field = blocks({ required: true, blocks: [headingBlock] });
    expect(blocksFieldToValidator({ field })).toMatch(/^v\.array\(/);
  });

  it("handles a block with no user fields (just framework keys)", () => {
    const divider = defineBlock({
      slug: "divider",
      label: "Divider",
      fields: {},
    });
    const field = blocks({ blocks: [divider] });
    const result = blocksFieldToValidator({ field });
    expect(result).toContain('blockType: v.literal("divider")');
    expect(result).toContain("id: v.string()");
  });

  it("throws on duplicate slugs", () => {
    const hero2 = defineBlock({
      slug: "heading",
      label: "Heading v2",
      fields: {},
    });
    expect(() => blocks({ blocks: [headingBlock, hero2] })).toThrow(
      /Duplicate block slug/,
    );
  });

  it("throws on invalid slug", () => {
    expect(() =>
      defineBlock({ slug: "my block type!", label: "Bad", fields: {} }),
    ).toThrow(/Invalid block slug/);
  });

  it("throws on reserved field name", () => {
    expect(() =>
      defineBlock({
        slug: "test",
        label: "Test",
        fields: { id: text() },
      }),
    ).toThrow(/id.*reserved/i);
  });
});
