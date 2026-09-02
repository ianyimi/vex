import { describe, it, expect } from "vitest";
import { defineBlock, blocks } from "./config";
import { text } from "../text";
import { blocksFieldToInputSchema } from "./inputSchema";

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

function makeItem(blockType: string, extra: Record<string, unknown> = {}) {
  return {
    blockType: blockType,
    blockName: "Test block",
    id: "abc123",
    ...extra,
  };
}

describe("blocksFieldToInputSchema", () => {
  it("accepts a valid block array", () => {
    const field = blocks({ blocks: [headingBlock, paragraphBlock] });
    const schema = blocksFieldToInputSchema({ field });
    const result = schema.safeParse([
      makeItem("heading", { text: "Hello" }),
      makeItem("paragraph", { content: "World" }),
    ]);
    expect(result.success).toBe(true);
  });

  it("fails when required sub-field has an invalid value", () => {
    const field = blocks({ blocks: [headingBlock] });
    const schema = blocksFieldToInputSchema({ field });
    // Explicitly passing null (wrong type) fails — omitting the key would
    // get filled by the field's .default() and pass validation.
    const result = schema.safeParse([
      makeItem("heading", { text: null }),
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects an unknown blockType", () => {
    const field = blocks({ blocks: [headingBlock] });
    const schema = blocksFieldToInputSchema({ field });
    const result = schema.safeParse([makeItem("unknown", { text: "hi" })]);
    expect(result.success).toBe(false);
  });

  it("defaults to [] when value is undefined", () => {
    const field = blocks({ blocks: [headingBlock] });
    expect(blocksFieldToInputSchema({ field }).parse(undefined)).toEqual([]);
  });

  it("enforces min constraint", () => {
    const field = blocks({ blocks: [headingBlock], min: 1 });
    const schema = blocksFieldToInputSchema({ field });
    expect(schema.safeParse([]).success).toBe(false);
    expect(
      schema.safeParse([makeItem("heading", { text: "Hi" })]).success,
    ).toBe(true);
  });

  it("enforces max constraint", () => {
    const field = blocks({ blocks: [headingBlock], max: 1 });
    const schema = blocksFieldToInputSchema({ field });
    const twoItems = [
      makeItem("heading", { text: "A" }),
      makeItem("heading", { text: "B" }),
    ];
    expect(schema.safeParse(twoItems).success).toBe(false);
  });
});
