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

  it("enforces min constraint when required", () => {
    const field = blocks({ blocks: [headingBlock], required: true, min: 1 });
    const schema = blocksFieldToInputSchema({ field });
    const result = schema.safeParse([]);
    expect(result.success).toBe(false);
    // Regression: `min.value` matching the required floor (1) must not make
    // the configured min message unreachable — it's not enough for `[]` to
    // merely fail; the min-specific message must actually be among the issues.
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "At least 1 Blocks required.",
      );
    }
    expect(
      schema.safeParse([makeItem("heading", { text: "Hi" })]).success,
    ).toBe(true);
  });

  it("enforces max constraint when required", () => {
    const field = blocks({ blocks: [headingBlock], required: true, max: 1 });
    const schema = blocksFieldToInputSchema({ field });
    const twoItems = [
      makeItem("heading", { text: "A" }),
      makeItem("heading", { text: "B" }),
    ];
    expect(schema.safeParse(twoItems).success).toBe(false);
  });

  it("skips min/max on an optional field only when the value is empty", () => {
    const field = blocks({ blocks: [headingBlock], min: 1, max: 1 });
    const schema = blocksFieldToInputSchema({ field });
    expect(schema.safeParse([]).success).toBe(true);
  });

  it("still enforces min/max once a non-empty value is supplied, even though the field is optional", () => {
    // Regression: min/max is independent of `required` — `required` only
    // governs whether the field may be empty, not whether a *supplied*
    // value must respect the configured block-count bounds.
    const field = blocks({ blocks: [headingBlock], min: 2, max: 2 });
    const schema = blocksFieldToInputSchema({ field });
    const oneItem = [makeItem("heading", { text: "A" })];
    const twoItems = [
      makeItem("heading", { text: "A" }),
      makeItem("heading", { text: "B" }),
    ];
    const threeItems = [...twoItems, makeItem("heading", { text: "C" })];
    expect(schema.safeParse(oneItem).success).toBe(false);
    expect(schema.safeParse(threeItems).success).toBe(false);
    expect(schema.safeParse(twoItems).success).toBe(true);
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = blocks({ blocks: [headingBlock], required: true });
    const schema = blocksFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects an explicit empty array on a required field", () => {
    const field = blocks({ blocks: [headingBlock], required: true });
    const schema = blocksFieldToInputSchema({ field });

    const result = schema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });
});
