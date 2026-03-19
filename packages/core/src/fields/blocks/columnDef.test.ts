import { describe, it, expect } from "vitest";
import { blocksColumnDef } from "./columnDef";
import { blocks } from "./config";
import { defineBlock } from "../../blocks/defineBlock";
import { text } from "../text";

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero",
  fields: { heading: text() },
});

describe("blocksColumnDef", () => {
  it("uses field label as header when provided", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({ blocks: [heroBlock], label: "Page Content" }),
    });

    expect(col.header).toBe("Page Content");
  });

  it("uses toTitleCase(fieldKey) as header when no label", () => {
    const col = blocksColumnDef({
      fieldKey: "pageContent",
      field: blocks({ blocks: [heroBlock] }),
    });

    expect(col.header).toBe("Page Content");
  });

  it("shows 'no blocks' for empty array", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({ blocks: [heroBlock] }),
    });

    const cellFn = (col as any).cell;
    expect(cellFn({ getValue: () => [] })).toBe("no blocks");
    expect(cellFn({ getValue: () => null })).toBe("no blocks");
  });

  it("shows '1 block' for single item", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({ blocks: [heroBlock] }),
    });

    const cellFn = (col as any).cell;
    expect(cellFn({ getValue: () => [{ blockType: "hero" }] })).toBe("1 block");
  });

  it("shows 'N blocks' for multiple items", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({ blocks: [heroBlock] }),
    });

    const cellFn = (col as any).cell;
    expect(cellFn({ getValue: () => [{}, {}, {}] })).toBe("3 blocks");
  });

  it("uses custom labels when provided", () => {
    const col = blocksColumnDef({
      fieldKey: "content",
      field: blocks({
        blocks: [heroBlock],
        labels: { singular: "section", plural: "sections" },
      }),
    });

    const cellFn = (col as any).cell;
    expect(cellFn({ getValue: () => [] })).toBe("no sections");
    expect(cellFn({ getValue: () => [{}] })).toBe("1 section");
    expect(cellFn({ getValue: () => [{}, {}] })).toBe("2 sections");
  });
});
