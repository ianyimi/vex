import { describe, expect, it } from "vitest";

import { relationship, row, text } from "../fields";
import { resolveCollectionIndexes } from "./resolveCollectionIndexes";

type Collection = Parameters<typeof resolveCollectionIndexes>[0]["collection"];
const resolve = (collection: Omit<Collection, "slug">) => resolveCollectionIndexes({ collection: { slug: "posts", ...collection } });

describe("resolveCollectionIndexes — declarations", () => {
  it("reads the string shorthand, the object form, and relationship auto-indexes", () => {
    expect(
      resolve({
        fields: {
          slug: text({ index: "by_slug" }),
          author: relationship({ collection: { slug: "users" }, index: { name: "by_author_status", additionalFields: ["status"] } }),
          status: text(),
          editor: relationship({ collection: { slug: "users" } }),
        },
      }),
    ).toEqual([
      { name: "by_slug", fields: ["slug"], source: "field" },
      { name: "by_author_status", fields: ["author", "status"], source: "field" },
      { name: "by_editor", fields: ["editor"], source: "relationship" },
    ]);
  });

  it("carries draftStatus from the object form", () => {
    expect(resolve({ fields: { slug: text({ index: { name: "by_slug", draftStatus: "both" } }) } })).toEqual([
      { name: "by_slug", fields: ["slug"], draftStatus: "both", source: "field" },
    ]);
  });

  it("counts a field inside a row under its own key", () => {
    expect(resolve({ fields: { names: row({ fields: { first: text({ index: { name: "by_name", additionalFields: ["last"] } }), last: text() } }) } })).toEqual([
      { name: "by_name", fields: ["first", "last"], source: "field" },
    ]);
  });
});

describe("resolveCollectionIndexes — precedence", () => {
  it("lets a field-level index win over a collection-level entry of the same name", () => {
    expect(
      resolve({
        fields: { slug: text({ index: { name: "by_slug", additionalFields: ["status"] } }), status: text() },
        indexes: [{ name: "by_slug", fields: ["slug"] }],
      }),
    ).toEqual([{ name: "by_slug", fields: ["slug", "status"], source: "field" }]);
  });

  it("lets a collection-level entry replace a relationship's automatic index", () => {
    expect(
      resolve({
        fields: { author: relationship({ collection: { slug: "users" } }), status: text() },
        indexes: [{ name: "by_author", fields: ["author", "status"] }],
      }),
    ).toEqual([{ name: "by_author", fields: ["author", "status"], source: "collection" }]);
  });
});

describe("resolveCollectionIndexes — errors", () => {
  it("rejects two fields declaring the same name, pointing at additionalFields", () => {
    expect(() => resolve({ fields: { a: text({ index: "by_x" }), b: text({ index: "by_x" }) } })).toThrow(
      'defineCollection: collection "posts": fields "a" and "b" both declare index "by_x". Declare a compound index once, on its first field — index: { name: "by_x", additionalFields: ["b"] } on "a" — or in the collection\'s indexes.',
    );
  });

  it("rejects taking another relationship field's automatic name", () => {
    expect(() => resolve({ fields: { slug: text({ index: "by_author" }), author: relationship({ collection: { slug: "users" } }) } })).toThrow(
      /the automatic index name of relationship field "author"/,
    );
  });

  it("rejects an unknown, self-referencing or repeated additional field", () => {
    expect(() => resolve({ fields: { a: text({ index: { name: "by_a", additionalFields: ["nope"] } }) } })).toThrow(/not a field of this collection/);
    expect(() => resolve({ fields: { a: text({ index: { name: "by_a", additionalFields: ["a"] } }) } })).toThrow(/lists "a" twice/);
    expect(() => resolve({ fields: { a: text({ index: { name: "by_a", additionalFields: ["b", "b"] } }), b: text() } })).toThrow(/lists "b" twice/);
  });

  it("rejects two collection-level entries with one name", () => {
    expect(() =>
      resolve({ fields: { a: text(), b: text() }, indexes: [{ name: "by_x", fields: ["a"] }, { name: "by_x", fields: ["b"] }] }),
    ).toThrow('defineCollection: collection "posts": declares index "by_x" twice in indexes.');
  });
});
