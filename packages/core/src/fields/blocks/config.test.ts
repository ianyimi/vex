import { describe, it, expect } from "vitest";
import { blocks } from "./config";
import { defineBlock } from "../../blocks/defineBlock";
import { text } from "../text";
import { VexBlockValidationError } from "../../errors";

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero",
  fields: { heading: text({ required: true, defaultValue: "" }) },
});

const ctaBlock = defineBlock({
  slug: "cta",
  label: "CTA",
  fields: { label: text() },
});

describe("blocks()", () => {
  it("returns a BlocksFieldDef with type 'blocks'", () => {
    const field = blocks({ blocks: [heroBlock, ctaBlock] });

    expect(field.type).toBe("blocks");
    expect(field.blocks).toHaveLength(2);
    expect(field.blocks[0].slug).toBe("hero");
    expect(field.blocks[1].slug).toBe("cta");
  });

  it("passes through optional config", () => {
    const field = blocks({
      blocks: [heroBlock],
      label: "Page Content",
      required: true,
      min: 1,
      max: 10,
      labels: { singular: "block", plural: "blocks" },
    });

    expect(field.label).toBe("Page Content");
    expect(field.required).toBe(true);
    expect(field.min).toBe(1);
    expect(field.max).toBe(10);
    expect(field.labels).toEqual({ singular: "block", plural: "blocks" });
  });

  it("accepts empty blocks array", () => {
    const field = blocks({ blocks: [] });
    expect(field.blocks).toHaveLength(0);
  });

  it("throws on duplicate block slugs", () => {
    const heroBlock2 = defineBlock({
      slug: "hero",
      label: "Hero v2",
      fields: {},
    });

    expect(() => blocks({ blocks: [heroBlock, heroBlock2] })).toThrow(
      VexBlockValidationError,
    );
    expect(() => blocks({ blocks: [heroBlock, heroBlock2] })).toThrow(
      /[Dd]uplicate/,
    );
  });

  it("throws when same block passed twice", () => {
    expect(() => blocks({ blocks: [heroBlock, heroBlock] })).toThrow(
      VexBlockValidationError,
    );
  });
});
