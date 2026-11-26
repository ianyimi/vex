import { describe, expect, it } from "vitest";
import { group } from "../group";
import { keyValue } from "../keyValue";
import { text } from "../text";
import { blocks, defineBlock } from "../blocks";
import { variant } from "../variant";
import { array } from "./config";
import { isObjectShapedArrayItem, withArrayItemId, assignArrayItemIds } from "./utils";

describe("isObjectShapedArrayItem", () => {
  it("is true for a group item", () => {
    expect(isObjectShapedArrayItem(group({ fields: { title: text() } }))).toBe(true);
  });

  it("is false for a scalar item", () => {
    expect(isObjectShapedArrayItem(text())).toBe(false);
  });
});

describe("withArrayItemId", () => {
  const itemField = group({ fields: { title: text() } });

  it("assigns a fresh id to an object-shaped item missing one", () => {
    const result = withArrayItemId({
      item: { title: "a" } as { title: string; id?: string },
      itemField,
    });
    expect(typeof result.id).toBe("string");
    expect(result.id!.length).toBeGreaterThan(0);
  });

  it("preserves an existing string id", () => {
    const result = withArrayItemId({
      item: { title: "a", id: "existing" },
      itemField,
    });
    expect(result.id).toBe("existing");
  });

  it("leaves a scalar item unchanged", () => {
    expect(withArrayItemId({ item: "plain", itemField: text() })).toBe("plain");
  });
});

describe("assignArrayItemIds", () => {
  it("backfills an id onto every item in a top-level array of groups missing one", () => {
    const fields = {
      links: array({ items: group({ fields: { label: text() } }) }),
    };
    const result = assignArrayItemIds({
      fields,
      data: { links: [{ label: "a" }, { label: "b" }] },
    });
    const links = result.links as { label: string; id: string }[];
    expect(links[0]!.id).toEqual(expect.any(String));
    expect(links[1]!.id).toEqual(expect.any(String));
    expect(links[0]!.id).not.toBe(links[1]!.id);
  });

  it("preserves an item's own supplied id instead of overwriting it", () => {
    const fields = {
      links: array({ items: group({ fields: { label: text() } }) }),
    };
    const result = assignArrayItemIds({
      fields,
      data: { links: [{ label: "a", id: "kept" }] },
    });
    expect((result.links as { id: string }[])[0]!.id).toBe("kept");
  });

  it("does not touch an array of scalar items", () => {
    const fields = { tags: array({ items: text() }) };
    const result = assignArrayItemIds({ fields, data: { tags: ["a", "b"] } });
    expect(result.tags).toEqual(["a", "b"]);
  });

  it("backfills ids on an array of groups nested inside a group", () => {
    const fields = {
      seo: group({
        fields: {
          links: array({ items: group({ fields: { label: text() } }) }),
        },
      }),
    };
    const result = assignArrayItemIds({
      fields,
      data: { seo: { links: [{ label: "a" }] } },
    });
    const seo = result.seo as { links: { id: string }[] };
    expect(seo.links[0]!.id).toEqual(expect.any(String));
  });

  it("backfills ids on a group nested inside a keyValue field's value", () => {
    const fields = {
      scores: keyValue({ value: array({ items: group({ fields: { label: text() } }) }) }),
    };
    const result = assignArrayItemIds({
      fields,
      data: { scores: { alpha: [{ label: "a" }] } },
    });
    const scores = result.scores as Record<string, { label: string; id: string }[]>;
    expect(scores.alpha![0]!.id).toEqual(expect.any(String));
  });

  it("backfills ids on an array of groups nested inside a discriminated variant's active member", () => {
    const fields = {
      channel: variant({
        discriminator: "kind",
        variants: {
          email: { label: "Email", fields: { links: array({ items: group({ fields: { label: text() } }) }) } },
        },
      }),
    };
    const result = assignArrayItemIds({
      fields,
      data: { channel: { kind: "email", links: [{ label: "a" }] } },
    });
    const channel = result.channel as { links: { label: string; id: string }[] };
    expect(channel.links[0]!.id).toEqual(expect.any(String));
  });

  it("backfills ids on an array of groups nested inside a primitive variant's active member", () => {
    const fields = {
      amount: variant({
        variants: {
          itemized: array({ items: group({ fields: { label: text() } }) }),
          flat: text(),
        },
      }),
    };
    const result = assignArrayItemIds({ fields, data: { amount: [{ label: "a" }] } });
    const amount = result.amount as { label: string; id: string }[];
    expect(amount[0]!.id).toEqual(expect.any(String));
  });

  it("backfills ids on a block's own array-of-groups field nested inside a keyValue field's value", () => {
    const itemBlock = defineBlock({
      slug: "item",
      label: "Item",
      fields: { links: array({ items: group({ fields: { label: text() } }) }) },
    });
    const fields = {
      notes: keyValue({ value: blocks({ blocks: [itemBlock] }) }),
    };
    const result = assignArrayItemIds({
      fields,
      data: { notes: { entry1: [{ id: "block-1", blockType: "item", links: [{ label: "a" }] }] } },
    });
    const notes = result.notes as Record<string, { links: { label: string; id: string }[] }[]>;
    expect(notes.entry1![0]!.links[0]!.id).toEqual(expect.any(String));
  });

  it("leaves fields absent from data untouched", () => {
    const fields = {
      links: array({ items: group({ fields: { label: text() } }) }),
    };
    const result = assignArrayItemIds({ fields, data: {} });
    expect(result).toEqual({});
  });
});
