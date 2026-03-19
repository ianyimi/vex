import { describe, it, expect } from "vitest";
import { blocksToValueTypeString } from "./schemaValueType";
import { blocks } from "./config";
import { defineBlock } from "../../blocks/defineBlock";
import { text } from "../text";
import { VexBlockValidationError } from "../../errors";

// Simple resolver for test isolation
function resolveInnerField(props: {
  field: any;
  collectionSlug: string;
  fieldName: string;
  visitedBlockSlugs?: Set<string>;
}): string {
  const type = props.field.type;
  if (type === "text")
    return props.field.required ? "v.string()" : "v.optional(v.string())";
  if (type === "number")
    return props.field.required ? "v.number()" : "v.optional(v.number())";
  if (type === "checkbox")
    return props.field.required ? "v.boolean()" : "v.optional(v.boolean())";
  if (type === "blocks") {
    return blocksToValueTypeString({
      field: props.field,
      collectionSlug: props.collectionSlug,
      fieldName: props.fieldName,
      resolveInnerField,
      visitedBlockSlugs: props.visitedBlockSlugs,
    });
  }
  throw new Error(`Unknown type: ${type}`);
}

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero",
  fields: {
    heading: text({ required: true, defaultValue: "" }),
    subheading: text(),
  },
});

const ctaBlock = defineBlock({
  slug: "cta",
  label: "CTA",
  fields: {
    label: text({ required: true, defaultValue: "" }),
    url: text(),
  },
});

const dividerBlock = defineBlock({
  slug: "divider",
  label: "Divider",
  fields: {},
});

describe("blocksToValueTypeString", () => {
  it("generates v.union with multiple block types", () => {
    const field = blocks({ blocks: [heroBlock, ctaBlock], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toMatch(/^v\.array\(v\.union\(/);
    expect(result).toContain('v.literal("hero")');
    expect(result).toContain('v.literal("cta")');
    expect(result).toContain("blockName: v.optional(v.string())");
    expect(result).toContain("_key: v.string()");
    expect(result).toContain("heading: v.string()");
    expect(result).toContain("subheading: v.optional(v.string())");
    expect(result).toContain("label: v.string()");
    expect(result).toContain("url: v.optional(v.string())");
  });

  it("generates v.array(v.object(...)) for a single block type (no union)", () => {
    const field = blocks({ blocks: [heroBlock], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toMatch(/^v\.array\(v\.object\(\{/);
    expect(result).not.toContain("v.union");
    expect(result).toContain('blockType: v.literal("hero")');
  });

  it("wraps with v.optional for non-required field", () => {
    const field = blocks({ blocks: [heroBlock] });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toMatch(/^v\.optional\(v\.array\(/);
  });

  it("handles block with no fields (divider)", () => {
    const field = blocks({ blocks: [dividerBlock], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toContain('blockType: v.literal("divider")');
    expect(result).toContain("blockName: v.optional(v.string())");
    expect(result).toContain("_key: v.string()");
    // Only blockType, blockName, and _key — no user fields
    const objectContent = result.match(/v\.object\(\{(.+?)\}\)/)?.[1] ?? "";
    const fieldCount = objectContent
      .split(",")
      .filter((s) => s.includes(":")).length;
    expect(fieldCount).toBe(3); // blockType + blockName + _key
  });

  it("handles empty blocks array gracefully", () => {
    const field = blocks({ blocks: [], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toBe("v.array(v.any())");
  });

  it("handles nested blocks (blocks within blocks)", () => {
    const innerBlock = defineBlock({
      slug: "text-block",
      label: "Text",
      fields: { body: text() },
    });

    const columnsBlock = defineBlock({
      slug: "columns",
      label: "Columns",
      fields: {
        items: blocks({ blocks: [innerBlock], required: true }),
      },
    });

    const field = blocks({ blocks: [columnsBlock], required: true });
    const result = blocksToValueTypeString({
      field,
      collectionSlug: "pages",
      fieldName: "content",
      resolveInnerField,
    });

    expect(result).toContain('v.literal("columns")');
    expect(result).toContain('v.literal("text-block")');
  });

  it("detects direct cycle (block references itself)", () => {
    const selfRef: any = {
      type: "blocks" as const,
      blocks: [],
      required: true,
    };
    const cyclicBlock = {
      slug: "recursive",
      label: "Recursive",
      fields: { children: selfRef },
    };
    selfRef.blocks = [cyclicBlock];

    const field = {
      type: "blocks" as const,
      blocks: [cyclicBlock],
      required: true,
    } as any;

    expect(() =>
      blocksToValueTypeString({
        field,
        collectionSlug: "pages",
        fieldName: "content",
        resolveInnerField,
      }),
    ).toThrow(VexBlockValidationError);
    expect(() =>
      blocksToValueTypeString({
        field,
        collectionSlug: "pages",
        fieldName: "content",
        resolveInnerField,
      }),
    ).toThrow(/[Cc]ircular|[Cc]ycle/);
  });

  it("allows same block type in sibling blocks fields (no false cycle)", () => {
    const sharedBlock = defineBlock({
      slug: "card",
      label: "Card",
      fields: { title: text() },
    });

    const field = blocks({ blocks: [sharedBlock], required: true });

    expect(() =>
      blocksToValueTypeString({
        field,
        collectionSlug: "pages",
        fieldName: "sidebar",
        resolveInnerField,
      }),
    ).not.toThrow();
  });
});
