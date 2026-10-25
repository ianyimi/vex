import { describe, expect, it } from "vitest";
import { group } from "../group";
import { text } from "../text";
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

  it("leaves fields absent from data untouched", () => {
    const fields = {
      links: array({ items: group({ fields: { label: text() } }) }),
    };
    const result = assignArrayItemIds({ fields, data: {} });
    expect(result).toEqual({});
  });
});
