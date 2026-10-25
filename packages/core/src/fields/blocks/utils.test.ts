import { describe, it, expect } from "vitest";
import { defineBlock, blocks } from "./config";
import { text } from "../text";
import { group } from "../group";
import type { GenericBlock } from "./types";
import { buildDefaultBlock, cloneBlockWithFreshIds, coerceBlockToDefinition } from "./utils";

const paragraphBlock = defineBlock({
  slug: "paragraph",
  label: "Paragraph",
  fields: { text: text() },
});

const itemBlock = defineBlock({
  slug: "item",
  label: "Item",
  fields: { label: text() },
});

const galleryBlock = defineBlock({
  slug: "gallery",
  label: "Gallery",
  fields: {
    items: blocks({ label: "Items", blocks: [itemBlock] }),
    meta: group({
      label: "Meta",
      fields: { inner: blocks({ label: "Inner", blocks: [itemBlock] }) },
    }),
  },
});

describe("buildDefaultBlock", () => {
  it("seeds a fresh id, the blockType, each field's default, and leaves blockName unset", () => {
    const block = buildDefaultBlock({ blockDef: paragraphBlock });
    expect(block.blockType).toBe("paragraph");
    expect(block.blockName).toBeUndefined();
    expect(typeof block.id).toBe("string");
    expect(block.text).toBe("");
  });

  it("gives two blocks distinct ids", () => {
    const a = buildDefaultBlock({ blockDef: paragraphBlock });
    const b = buildDefaultBlock({ blockDef: paragraphBlock });
    expect(a.id).not.toBe(b.id);
  });
});

describe("cloneBlockWithFreshIds", () => {
  it("clones a flat block with a fresh id, keeping its other fields", () => {
    const source: GenericBlock = {
      id: "p1",
      blockType: "paragraph",
      blockName: "Intro",
      text: "Hello",
    };
    const cloned = cloneBlockWithFreshIds({ block: source, blockDef: paragraphBlock });
    expect(cloned.id).not.toBe("p1");
    expect(cloned.blockName).toBe("Intro");
    expect(cloned.text).toBe("Hello");
  });

  it("regenerates ids on a nested blocks field's own items", () => {
    const source: GenericBlock = {
      id: "g1",
      blockType: "gallery",
      items: [{ id: "i1", blockType: "item", label: "A" }],
      meta: { inner: [{ id: "i2", blockType: "item", label: "B" }] },
    };
    const cloned = cloneBlockWithFreshIds({ block: source, blockDef: galleryBlock });
    expect(cloned.id).not.toBe("g1");
    const items = cloned.items as GenericBlock[];
    expect(items).toHaveLength(1);
    expect(items[0]?.id).not.toBe("i1");
    expect(items[0]?.label).toBe("A");
    const clonedMeta = cloned.meta as { inner: GenericBlock[] };
    const inner = clonedMeta.inner;
    expect(inner).toHaveLength(1);
    expect(inner[0]?.id).not.toBe("i2");
    expect(inner[0]?.label).toBe("B");
  });

  it("leaves an unrecognised nested blockType untouched", () => {
    const source: GenericBlock = {
      id: "g1",
      blockType: "gallery",
      items: [{ id: "i1", blockType: "not-registered", label: "A" }],
      meta: { inner: [] },
    };
    const cloned = cloneBlockWithFreshIds({ block: source, blockDef: galleryBlock });
    const items = cloned.items as GenericBlock[];
    expect(items[0]?.id).toBe("i1");
  });
});

describe("coerceBlockToDefinition", () => {
  it("drops keys the block definition does not declare and reports them", () => {
    const { block, droppedKeys } = coerceBlockToDefinition({
      block: { id: "x", blockType: "paragraph", text: "Hello", extra: "nope" },
      blockDef: paragraphBlock,
    });
    expect(droppedKeys).toEqual(["extra"]);
    expect(block.text).toBe("Hello");
    expect(block.id).not.toBe("x");
    expect("extra" in block).toBe(false);
  });

  it("fills a missing declared key with its field default", () => {
    const { block, droppedKeys } = coerceBlockToDefinition({
      block: { id: "x", blockType: "paragraph" },
      blockDef: paragraphBlock,
    });
    expect(droppedKeys).toEqual([]);
    expect(block.text).toBe("");
  });

  it("keeps a string blockName and regenerates nested block ids", () => {
    const { block } = coerceBlockToDefinition({
      block: {
        id: "x",
        blockType: "gallery",
        blockName: "My Gallery",
        items: [{ id: "i1", blockType: "item", label: "A" }],
        meta: { inner: [] },
      },
      blockDef: galleryBlock,
    });
    expect(block.blockName).toBe("My Gallery");
    const items = block.items as GenericBlock[];
    expect(items[0]?.id).not.toBe("i1");
  });

  it("drops a non-string blockName", () => {
    const { block } = coerceBlockToDefinition({
      block: { id: "x", blockType: "paragraph", blockName: 42 },
      blockDef: paragraphBlock,
    });
    expect(block.blockName).toBeUndefined();
  });
});
